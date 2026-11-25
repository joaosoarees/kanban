import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Crie sua conta"
        description="Organize o trabalho do seu time em quadros."
      />
      <SignUpForm />
    </>
  );
}
