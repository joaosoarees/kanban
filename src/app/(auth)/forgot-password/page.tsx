import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  return (
    <>
      <AuthHeading
        title="Redefina sua senha"
        description="Digite o e-mail da sua conta. Vamos enviar um código para criar uma senha nova."
      />
      <Suspense fallback={null}>
        <ForgotPasswordFields searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ForgotPasswordFields({
  searchParams,
}: Pick<PageProps<"/forgot-password">, "searchParams">) {
  const { email } = await searchParams;
  return (
    <ForgotPasswordForm defaultEmail={typeof email === "string" ? email : ""} />
  );
}
