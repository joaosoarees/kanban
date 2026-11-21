import * as z from "zod";

export type ActionError = {
  status: "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  gone?: boolean;
};

export type ActionResult<T = undefined> =
  { status: "success"; data: T } | ActionError;

export const FORBIDDEN: ActionError = {
  status: "error",
  message: "Você não tem permissão para fazer isso.",
};

export const INVALID: ActionError = {
  status: "error",
  message: "Confira os campos e tente de novo.",
};

export function invalidFields(error: z.ZodError): ActionError {
  return {
    ...INVALID,
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}
