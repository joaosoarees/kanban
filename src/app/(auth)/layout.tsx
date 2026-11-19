import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BoardPreview } from "@/components/board-preview";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 justify-center py-12 lg:pt-[18vh]">
          <div className="w-full max-w-sm">
            <Suspense fallback={null}>
              <SignedOutOnly>{children}</SignedOutOnly>
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <div className="absolute top-1/2 left-16 -translate-y-1/2">
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
