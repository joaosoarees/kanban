import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-start gap-6 p-8">
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Olá, {user.name}.
      </h1>
      <form action={signOutAction}>
        <SignOutButton />
      </form>
    </>
  );
}
