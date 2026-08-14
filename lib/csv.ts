import type { Transaction } from "@/types";

function escapeCsv(value: string): string {
  if (/[;"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(
  transactions: Transaction[],
  currencyCode: string,
  currencyRate: number,
): string {
  const header = [
    "Fecha",
    "Tipo",
    "Monto",
    "Moneda",
    `Convertido (${currencyCode})`,
    "Categoría",
    "Descripción",
  ];

  const rows = transactions.map((tx) => {
    const converted =
      Math.round((tx.convertedAmount / (currencyRate || 1)) * 100) / 100;
    return [
      tx.date,
      tx.type === "income" ? "Ingreso" : "Gasto",
      String(tx.amount),
      tx.currency?.code ?? "",
      String(converted),
      tx.category?.name ?? "",
      tx.description ?? "",
    ];
  });

  return [header, ...rows].map((r) => r.map(escapeCsv).join(";")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
