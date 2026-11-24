import { Suspense, type ReactNode } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      {children}
    </>
  );
}
