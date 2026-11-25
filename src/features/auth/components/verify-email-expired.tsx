import Link from "next/link";
import { linkButton } from "@/components/button-styles";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export function VerifyEmailExpired() {
  return (
    <>
      <AuthHeading
        title="Esta tela expirou"
        description="Cadastre-se de novo para receber outro código. Se você já confirmou o e-mail, entre com sua senha."
      />
      <div className="flex flex-col gap-2">
        <Link href="/sign-up" className={linkButton("default", "h-10 w-full")}>
          Criar conta
        </Link>
        <Link href="/sign-in" className={linkButton("outline", "h-10 w-full")}>
          Entrar
        </Link>
      </div>
    </>
  );
}
