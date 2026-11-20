import { Suspense, type ReactNode } from "react";
import { requireMembership } from "@/lib/workspaces";
import WorkspaceLoading from "./loading";

export default function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <MembersOnly params={params}>{children}</MembersOnly>
    </Suspense>
  );
}

async function MembersOnly({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}) {
  const { slug } = await params;
  await requireMembership(slug);
  return children;
}
