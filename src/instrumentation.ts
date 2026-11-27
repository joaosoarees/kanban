import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  const [pathname] = request.path.split("?");

  console.error(
    `[onRequestError] ${request.method} ${pathname} route=${context.routePath} digest=${digest} message=${message}`,
  );
};
