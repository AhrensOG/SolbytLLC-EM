import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { getInstitutions } from "@/lib/gocardless";
import { handleApiError, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireUserId();
    const country = (req.nextUrl.searchParams.get("country") ?? "ES").toUpperCase();
    const institutions = await getInstitutions(country);
    return json(institutions);
  } catch (err) {
    return handleApiError(err);
  }
}