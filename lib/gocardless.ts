const BASE = "https://bankaccountdata.gocardless.com/api/v2";

let cachedToken: { access: string; refresh: string; expiresAt: number } | null =
  null;

async function request(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<unknown> {
  let token = await ensureToken();

  const doFetch = async (t: string) => {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { res, body };
  };

  let { res, body } = await doFetch(token);

  if (res.status === 401 && retry) {
    cachedToken = null;
    token = await ensureToken();
    ({ res, body } = await doFetch(token));
  }

  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : null;
    const summary = typeof body?.summary === "string" ? body.summary : null;
    throw new Error(detail ?? summary ?? `GoCardless error ${res.status}`);
  }

  return body;
}

async function ensureToken(): Promise<string> {
  const secretId = process.env.GC_SECRET_ID;
  const secretKey = process.env.GC_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error("Faltan credenciales de GoCardless (GC_SECRET_ID/GC_SECRET_KEY)");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.access;
  }

  if (cachedToken?.refresh) {
    try {
      const res = await fetch(`${BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: cachedToken.refresh }),
      });
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        cachedToken = {
          access: String(data.access),
          refresh: typeof data.refresh === "string" ? data.refresh : cachedToken.refresh,
          expiresAt: Date.now() + (Number(data.access_expires ?? 86400)) * 1000,
        };
        return cachedToken.access;
      }
    } catch {
      // fall through to full re-auth
    }
  }

  const res = await fetch(`${BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
  if (!res.ok) throw new Error("No se pudo autenticar con GoCardless");

  const data = (await res.json()) as Record<string, unknown>;
  cachedToken = {
    access: String(data.access),
    refresh: String(data.refresh),
    expiresAt: Date.now() + Number(data.access_expires ?? 86400) * 1000,
  };
  return cachedToken.access;
}

export interface Institution {
  id: string;
  name: string;
  bic: string | null;
  logo: string | null;
  countries: string[];
}

export async function getInstitutions(country: string): Promise<Institution[]> {
  const body = await request(`/institutions/?country=${encodeURIComponent(country)}`);
  const list = (body ?? []) as Array<Record<string, unknown>>;
  return list.map((i) => ({
    id: String(i.id),
    name: String(i.name ?? "Banco"),
    bic: typeof i.bic === "string" ? i.bic : null,
    logo: typeof i.logo === "string" ? i.logo : null,
    countries: Array.isArray(i.countries) ? (i.countries as string[]) : [],
  }));
}

async function createAgreement(institutionId: string): Promise<string> {
  try {
    const body = (await request("/agreements/enduser/", {
      method: "POST",
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 730,
        access_valid_for_days: 90,
        access_scope: ["balances", "transactions", "details"],
      }),
    })) as Record<string, unknown>;
    return typeof body.id === "string" ? body.id : "";
  } catch {
    return "";
  }
}

export interface RequisitionLink {
  requisitionId: string;
  link: string;
}

export async function createRequisition(
  institutionId: string,
  redirectUri: string,
  reference: string,
): Promise<RequisitionLink> {
  const agreementId = await createAgreement(institutionId);
  const body = (await request("/requisitions/", {
    method: "POST",
    body: JSON.stringify({
      redirect: redirectUri,
      institution_id: institutionId,
      reference,
      user_language: "ES",
      ...(agreementId ? { agreement: agreementId } : {}),
    }),
  })) as Record<string, unknown>;
  return {
    requisitionId: String(body.id),
    link: String(body.link),
  };
}

export async function getRequisition(
  requisitionId: string,
): Promise<{ status: string; accounts: string[] }> {
  const body = (await request(
    `/requisitions/${requisitionId}/`,
  )) as Record<string, unknown>;
  return {
    status: typeof body.status === "string" ? body.status : "",
    accounts: Array.isArray(body.accounts) ? (body.accounts as string[]) : [],
  };
}

export async function deleteRequisition(requisitionId: string): Promise<void> {
  await request(`/requisitions/${requisitionId}/`, { method: "DELETE" });
}

export interface GcAccount {
  id: string;
  iban: string | null;
  name: string | null;
  currency: string | null;
}

export async function getAccountDetails(accountId: string): Promise<GcAccount> {
  const body = (await request(
    `/accounts/${accountId}/details/`,
  )) as Record<string, unknown>;
  const acct = (body?.account ?? {}) as Record<string, unknown>;
  return {
    id: accountId,
    iban: typeof acct.iban === "string" ? acct.iban : null,
    name: typeof acct.name === "string" ? acct.name : null,
    currency: typeof acct.currency === "string" ? acct.currency : null,
  };
}

interface GcTransactionRaw {
  transactionId?: unknown;
  bookingDate?: unknown;
  valueDate?: unknown;
  transactionAmount?: { amount?: unknown; currency?: unknown };
  creditorName?: unknown;
  debtorName?: unknown;
  creditorAgent?: unknown;
  remittanceInformationUnstructured?: unknown;
  additionalInformation?: unknown;
  reference?: unknown;
}

export interface GcTransaction {
  externalId: string;
  bookingDate: string;
  amount: number;
  currency: string;
  description: string;
}

export async function getAccountTransactions(
  accountId: string,
  dateFrom: string,
): Promise<GcTransaction[]> {
  const body = (await request(
    `/accounts/${accountId}/transactions/?date_from=${dateFrom}&date_to=2999-12-31`,
  )) as { transactions?: { booked?: GcTransactionRaw[]; pending?: GcTransactionRaw[] } };

  const raw: GcTransactionRaw[] = [
    ...(body?.transactions?.booked ?? []),
    ...(body?.transactions?.pending ?? []),
  ];

  return raw
    .filter((tx) => tx?.transactionId)
    .map((tx) => {
      const amount = Number(tx?.transactionAmount?.amount ?? 0);
      const counterparty = tx?.creditorName ?? tx?.debtorName ?? tx?.creditorAgent;
      const info =
        tx?.remittanceInformationUnstructured ??
        tx?.additionalInformation ??
        tx?.reference ??
        "";
      const parts = [counterparty, info]
        .filter((p) => typeof p === "string" && p.trim())
        .join(" · ");
      return {
        externalId: String(tx.transactionId),
        bookingDate: String(tx.bookingDate ?? tx.valueDate ?? ""),
        amount,
        currency: typeof tx?.transactionAmount?.currency === "string"
          ? tx.transactionAmount.currency
          : "EUR",
        description: (parts || "Movimiento bancario").slice(0, 255),
      };
    });
}