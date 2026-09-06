import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { getAspsps } from "@/lib/enablebanking";
import { handleApiError, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireUserId();
    const country = (req.nextUrl.searchParams.get("country") ?? "ES").toUpperCase();
    const aspsps = await getAspsps(country);
    return json(aspsps);
  } catch (err) {
    return handleApiError(err);
  }
}