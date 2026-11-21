import { Suspense, type ReactNode } from "react";
import { requireMembership } from "@/lib/workspaces";

export default function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<output className="sr-only">Carregando…</output>}>
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
