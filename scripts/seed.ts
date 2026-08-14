import { syncDatabase, Currency } from "../lib/models";
import { sequelize } from "../lib/db";
import { QueryTypes } from "sequelize";

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$", exchangeRateToBase: 1 },
  { code: "EUR", name: "Euro", symbol: "€", exchangeRateToBase: 1.09 },
  { code: "CLP", name: "Peso Chileno", symbol: "$", exchangeRateToBase: 0.001052 },
  { code: "ARS", name: "Peso Argentino", symbol: "$", exchangeRateToBase: 0.00085 },
];

async function backfillConvertedAmounts() {
  await sequelize.query(
    `
    UPDATE transactions t
    SET converted_amount = ROUND(t.amount * c.exchange_rate_to_base, 2)
    FROM currencies c
    WHERE t.currency_id = c.id AND t.converted_amount = 0
    `,
    { type: QueryTypes.UPDATE },
  );
  const rows = await sequelize.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM transactions WHERE converted_amount = 0",
    { type: QueryTypes.SELECT },
  );
  console.log(`Backfilled converted_amount. Remaining zero: ${rows?.[0]?.count ?? 0}`);
}

async function main() {
  console.log("Syncing database schema...");
  await syncDatabase({ alter: true });
  console.log("Schema ready.");

  for (const c of currencies) {
    const [currency] = await Currency.findOrCreate({
      where: { code: c.code },
      defaults: c,
    });
    console.log(`Currency ${currency.code} (id: ${currency.id})`);
  }

  await backfillConvertedAmounts();

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
