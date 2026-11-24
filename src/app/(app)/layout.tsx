import { Suspense, type ReactNode } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";

export default function AppLayout({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader crumb={<Suspense>{crumb}</Suspense>} />
      </Suspense>
      {children}
    </div>
  );
}
