import Link from "next/link";
import { linkButton } from "@/components/button-styles";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export function ResetPasswordExpired() {
  return (
    <>
      <AuthHeading
        title="Esta tela expirou"
        description="Peça a redefinição de novo para receber outro código. Se você lembrou a senha, entre com ela."
      />
      <div className="flex flex-col gap-2">
        <Link
          href="/forgot-password"
          className={linkButton("default", "h-10 w-full")}
        >
          Pedir de novo
        </Link>
        <Link href="/sign-in" className={linkButton("outline", "h-10 w-full")}>
          Entrar
        </Link>
      </div>
    </>
  );
}
