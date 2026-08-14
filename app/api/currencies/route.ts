import { Currency } from "@/lib/models";
import { serializeCurrency } from "@/lib/serialize";
import { handleApiError, json } from "@/lib/api";

export async function GET() {
  try {
    const currencies = await Currency.findAll({ order: [["code", "ASC"]] });
    return json(currencies.map(serializeCurrency));
  } catch (err) {
    return handleApiError(err);
  }
}
