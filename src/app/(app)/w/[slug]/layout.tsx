import { Suspense } from "react";
import { SidebarSkeleton } from "@/components/sidebar/sidebar-shell";
import { WorkspaceSidebar } from "@/components/sidebar/workspace-sidebar";

export default function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col lg:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <WorkspaceSidebar params={params} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
