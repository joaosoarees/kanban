import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { BoardPreview } from "@/features/auth/components/board-preview";
import { FreshDocument } from "@/features/auth/components/fresh-document";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <FreshDocument />
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 justify-center py-12 lg:pt-34">
          <div className="w-full max-w-sm">{children}</div>
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
