import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import { User } from "@/lib/models";
import { createUserWithDefaults } from "@/lib/user-setup";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return error("Ya existe una cuenta con ese email", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUserWithDefaults({ name, email, passwordHash });

    return json({ id: user.id, name: user.name, email: user.email }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}