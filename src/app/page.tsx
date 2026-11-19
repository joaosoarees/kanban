import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
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
      <p>Olá, {user.name}.</p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </>
  );
}
