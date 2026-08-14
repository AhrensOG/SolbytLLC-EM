import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-card-foreground">
        Iniciar sesión
      </h2>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}
