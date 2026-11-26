import { redirect } from "next/navigation";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/invite/[token]">,
) {
  const { token } = await params;
  redirect(`/invite#${encodeURIComponent(token)}`);
}
