import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser, requireUserId } from "@/lib/auth-helpers";
import { User } from "@/lib/models";
import { changePasswordSchema } from "@/lib/validation";
import { error, handleApiError, json, unauthorized } from "@/lib/api";

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return error("Datos inválidos", 422);
    }

    const { currentPassword, newPassword } = parsed.data;

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return error("La contraseña actual no es correcta", 422);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.update({ passwordHash }, { where: { id: userId } });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
