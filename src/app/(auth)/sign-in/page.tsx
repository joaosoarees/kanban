import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage() {
  return (
    <>
      <h1 className="mt-6 text-lg leading-6 font-semibold">
        Entre na sua conta
      </h1>
      <SignInForm />
    </>
  );
}
