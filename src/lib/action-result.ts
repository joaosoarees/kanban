export type ActionResult<T = undefined> =
  | { status: "success"; data: T }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };
