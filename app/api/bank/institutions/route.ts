import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { getAspsps, EnableError } from "@/lib/enablebanking";
import { error, handleApiError, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireUserId();
    const country = (req.nextUrl.searchParams.get("country") ?? "ES").toUpperCase();
    const aspsps = await getAspsps(country);
    return json(aspsps);
  } catch (err) {
    if (
      err instanceof EnableError &&
      (err.code === "NETWORK_TIMEOUT" || err.code === "HTTP_0")
    ) {
      return error("No se pudieron cargar los bancos. Inténtalo de nuevo.", 503);
    }
    return handleApiError(err);
  }
}