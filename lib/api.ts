import { ZodError } from "zod";

export function json<T>(data: T, init?: number | ResponseInit) {
  const status =
    typeof init === "number" ? init : (init?.status ?? 200);
  return Response.json(data, { ...(typeof init === "object" ? init : {}), status });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export function unauthorized() {
  return json({ error: "No autorizado" }, 401);
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return json(
      { error: "Datos inválidos", details: err.flatten() },
      422,
    );
  }
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return unauthorized();
  }
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return json({ error: "No tienes permisos para realizar esta acción" }, 403);
  }
  console.error("[api] error:", err);
  return json({ error: "Error interno del servidor" }, 500);
}
