import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mt-6 pt-[18px] text-2xl leading-[30px] font-semibold tracking-tight">
        Crie sua conta
      </h1>
      <SignUpForm />
    </>
  );
}
