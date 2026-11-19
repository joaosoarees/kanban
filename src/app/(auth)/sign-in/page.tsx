import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <>
      <h1 className="mt-6 pt-[18px] text-2xl leading-[30px] font-semibold tracking-tight">
        Entre na sua conta
      </h1>
      <SignInForm />
    </>
  );
}
