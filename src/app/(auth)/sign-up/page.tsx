import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mt-6 text-lg leading-6 font-semibold">Crie sua conta</h1>
      <SignUpForm />
    </>
  );
}
