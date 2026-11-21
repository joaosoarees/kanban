import { Suspense } from "react";
import { requireMembership } from "@/lib/workspaces";

export default function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]">) {
  return (
    <>
      <Suspense fallback={null}>
        <MembersOnly params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function MembersOnly({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMembership(slug);
  return null;
}
