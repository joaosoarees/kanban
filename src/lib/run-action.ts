import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

export async function runAction<T>(
  action: () => Promise<ActionResult<T>>,
  failure: string,
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (caught) {
    unstable_rethrow(caught);
    console.error(caught);
    return { status: "error", message: failure };
  }
}
