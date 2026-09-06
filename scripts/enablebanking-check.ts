import { getAspsps } from "../lib/enablebanking";

async function main() {
  const country = process.env.EB_CHECK_COUNTRY ?? "ES";
  console.log(`Checking Enable Banking connection for country ${country}...`);
  const aspsps = await getAspsps(country);
  console.log(`OK - ${aspsps.length} institutions available.`);
  for (const a of aspsps.slice(0, 10)) {
    console.log(`  - ${a.name} (${a.country})`);
  }
  if (aspsps.length > 10) {
    console.log(`  ... and ${aspsps.length - 10} more`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Enable Banking check FAILED:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});