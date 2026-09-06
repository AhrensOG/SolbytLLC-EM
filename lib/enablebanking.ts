import { createSign } from "crypto";

const API_BASE = "https://api.enablebanking.com";
const TOKEN_TTL_SECONDS = 3600;

export class EnableError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, description?: string) {
    super(description ?? code);
    this.name = "EnableError";
    this.code = code;
    this.status = status;
  }
}

function getAppId(): string {
  const appId = process.env.EB_APP_ID;
  if (!appId) throw new Error("Falta EB_APP_ID en el entorno");
  return appId;
}

function getPrivateKey(): string {
  const b64 = process.env.EB_PRIVATE_KEY_B64;
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  const pem = process.env.EB_PRIVATE_KEY;
  if (!pem) {
    throw new Error("Falta EB_PRIVATE_KEY o EB_PRIVATE_KEY_B64 en el entorno");
  }
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildJwt(): string {
  const appId = getAppId();
  const privateKey = getPrivateKey();

  const header = base64Url(
    JSON.stringify({ typ: "JWT", alg: "RS256", kid: appId }),
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  );

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  sign.end();
  const signature = base64Url(Buffer.from(sign.sign(privateKey, "base64"), "base64"));

  return `${header}.${payload}.${signature}`;
}

async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${buildJwt()}`,
      Accept: "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const code =
      typeof data.error === "string" ? data.error : `HTTP_${res.status}`;
    const description =
      (typeof data.description === "string" && data.description) ||
      (typeof data.message === "string" && data.message) ||
      undefined;
    throw new EnableError(code, res.status, description);
  }

  return data as T;
}

export interface Aspsp {
  id: string; // "Name|COUNTRY"
  name: string;
  country: string;
}

export async function getAspsps(country: string): Promise<Aspsp[]> {
  const data = await apiRequest<{ aspsps: { name: string; country: string }[] }>(
    `/aspsps?country=${encodeURIComponent(country.toUpperCase())}`,
  );
  return (data.aspsps ?? [])
    .filter((a) => a.name && a.country)
    .map((a) => ({
      id: `${a.name}|${a.country}`,
      name: a.name,
      country: a.country,
    }));
}

export interface StartAuthResult {
  url: string;
}

export async function startAuth(opts: {
  aspsp: { name: string; country: string };
  redirectUrl: string;
  state: string;
}): Promise<StartAuthResult> {
  const validUntil = new Date(
    Date.now() + 179 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const data = await apiRequest<{ url: string }>("/auth", {
    method: "POST",
    body: {
      access: { valid_until: validUntil },
      aspsp: { name: opts.aspsp.name, country: opts.aspsp.country },
      redirect_url: opts.redirectUrl,
      state: opts.state,
      language: "es",
      psu_type: "personal",
    },
  });
  return { url: data.url };
}

export interface AuthorizedSession {
  sessionId: string;
  validUntil: string | null;
  accounts: {
    id: string;
    iban: string | null;
    name: string | null;
    currency: string | null;
  }[];
}

export async function authorizeSession(code: string): Promise<AuthorizedSession> {
  const data = await apiRequest<{
    session_id: string;
    access?: { valid_until?: string };
    accounts?: {
      uid?: string;
      account_id?: { iban?: string };
      name?: string;
      currency?: string;
    }[];
  }>("/sessions", { method: "POST", body: { code } });

  return {
    sessionId: data.session_id,
    validUntil: data.access?.valid_until ?? null,
    accounts: (data.accounts ?? []).map((a) => ({
      id: a.uid ?? "",
      iban: a.account_id?.iban ?? null,
      name: a.name ?? null,
      currency: a.currency ?? null,
    })),
  };
}

export async function getSession(
  sessionId: string,
): Promise<{ accountIds: string[]; validUntil: string | null }> {
  const data = await apiRequest<{
    accounts?: string[];
    access?: { valid_until?: string };
  }>(`/sessions/${sessionId}`);
  return {
    accountIds: data.accounts ?? [],
    validUntil: data.access?.valid_until ?? null,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiRequest(`/sessions/${sessionId}`, { method: "DELETE" });
}

export interface AccountDetails {
  id: string;
  iban: string | null;
  name: string | null;
  currency: string | null;
}

export async function getAccountDetails(accountId: string): Promise<AccountDetails> {
  const data = await apiRequest<{
    account_id?: { iban?: string };
    name?: string;
    currency?: string;
  }>(`/accounts/${accountId}/details`);
  return {
    id: accountId,
    iban: data.account_id?.iban ?? null,
    name: data.name ?? null,
    currency: data.currency ?? null,
  };
}

export interface EnableTransaction {
  externalId: string;
  bookingDate: string;
  amount: number;
  currency: string;
  description: string;
}

interface RawTransaction {
  entry_reference?: string;
  transaction_amount?: { currency?: string; amount?: string };
  credit_debit_indicator?: string;
  booking_date?: string;
  value_date?: string;
  creditor?: { name?: string };
  debtor?: { name?: string };
  remittance_information?: string[];
  reference_number?: string;
  bank_transaction_code?: { description?: string };
  transaction_id?: string;
}

function normalizeTransaction(tx: RawTransaction): EnableTransaction {
  const rawAmount = Number(tx.transaction_amount?.amount ?? 0);
  const isDebit = tx.credit_debit_indicator === "DBIT";
  const amount = isDebit ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  const parts: string[] = [];
  if (Array.isArray(tx.remittance_information)) {
    for (const line of tx.remittance_information) {
      if (typeof line === "string" && line.trim()) parts.push(line.trim());
    }
  }
  if (tx.creditor?.name) parts.push(tx.creditor.name);
  if (tx.debtor?.name) parts.push(tx.debtor.name);
  if (tx.bank_transaction_code?.description) parts.push(tx.bank_transaction_code.description);
  if (tx.reference_number) parts.push(tx.reference_number);

  const description = (parts.filter((p, i) => parts.indexOf(p) === i).join(" · ") || "Movimiento bancario").slice(0, 255);

  let externalId = tx.entry_reference;
  if (!externalId) {
    const fallback = [
      tx.booking_date ?? tx.value_date ?? "",
      tx.transaction_amount?.amount ?? "",
      tx.credit_debit_indicator ?? "",
      tx.creditor?.name ?? tx.debtor?.name ?? "",
      tx.reference_number ?? "",
    ].join("|");
    externalId = `synth:${fallback}`.slice(0, 255);
  }

  return {
    externalId,
    bookingDate: tx.booking_date ?? tx.value_date ?? "",
    amount,
    currency: tx.transaction_amount?.currency ?? "EUR",
    description,
  };
}

export async function getAccountTransactions(
  accountId: string,
  opts: {
    dateFrom?: string;
    psuHeaders?: Record<string, string>;
  } = {},
): Promise<EnableTransaction[]> {
  const psuHeaders = opts.psuHeaders ?? {};
  const query = new URLSearchParams();
  if (opts.dateFrom) query.set("date_from", opts.dateFrom);

  const all: EnableTransaction[] = [];
  let continuationKey: string | null = null;

  do {
    if (continuationKey) query.set("continuation_key", continuationKey);
    const data = await apiRequest<{
      transactions?: RawTransaction[];
      continuation_key?: string | null;
    }>(`/accounts/${accountId}/transactions?${query.toString()}`, {
      headers: psuHeaders,
    });
    all.push(...(data.transactions ?? []).map(normalizeTransaction));
    continuationKey = data.continuation_key ?? null;
  } while (continuationKey);

  return all;
}