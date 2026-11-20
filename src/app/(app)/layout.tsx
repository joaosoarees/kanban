import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col bg-zinc-50">
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      {children}
    </div>
  );
}
