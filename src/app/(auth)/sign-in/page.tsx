import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading
        title="Entre na sua conta"
        description="Seus quadros estão esperando por você."
      />
      <SignInForm />
    </>
  );
}
