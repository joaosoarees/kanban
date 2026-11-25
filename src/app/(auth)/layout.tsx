import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BoardPreview } from "@/components/board-preview";
import { FreshDocument } from "@/components/fresh-document";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/server/session";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <FreshDocument />
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 justify-center py-12 lg:pt-34">
          <div className="w-full max-w-sm">
            <Suspense fallback={null}>
              <SignedOutOnly>{children}</SignedOutOnly>
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <div className="absolute top-49 left-16">
          <BoardPreview />
        </div>
      </div>
    </main>
  );
}

async function SignedOutOnly({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return children;
}
