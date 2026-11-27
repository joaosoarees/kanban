import { createFormControl, type FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { ActionError } from "./action-result";
import { applyActionErrors } from "./form-errors";

type Values = { title: string; description: string };

function makeForm() {
  const form = createFormControl<Values>({
    defaultValues: { title: "", description: "" },
  });
  const seen: { errors: FieldErrors<Values> } = { errors: {} };
  form.subscribe({
    formState: { errors: true },
    callback: ({ errors }) => {
      seen.errors = errors ?? {};
    },
  });
  return { form, seen };
}

describe("applyActionErrors", () => {
  it("should put the first message of each field on that field", () => {
    const { form, seen } = makeForm();
    const result: ActionError = {
      status: "error",
      message: "Confira os campos e tente de novo.",
      fieldErrors: {
        title: ["Digite o título.", "Até 200 caracteres."],
        description: ["Remova os caracteres inválidos."],
      },
    };

    applyActionErrors(result, form.setError);

    expect(form.getFieldState("title").error?.message).toBe("Digite o título.");
    expect(form.getFieldState("description").error?.message).toBe(
      "Remova os caracteres inválidos.",
    );
    expect(seen.errors.root).toBe(undefined);
  });

  it("should put the message on the form root when no field failed", () => {
    const { form, seen } = makeForm();
    const result: ActionError = {
      status: "error",
      message: "Você não tem permissão para fazer isso.",
    };

    applyActionErrors(result, form.setError);

    expect(seen.errors.root?.message).toBe(
      "Você não tem permissão para fazer isso.",
    );
  });

  it("should skip a field whose message list is empty", () => {
    const { form } = makeForm();
    const result: ActionError = {
      status: "error",
      message: "Confira os campos e tente de novo.",
      fieldErrors: { title: [], description: ["Até 5.000 caracteres."] },
    };

    applyActionErrors(result, form.setError);

    expect(form.getFieldState("title").error).toBe(undefined);
    expect(form.getFieldState("description").error?.message).toBe(
      "Até 5.000 caracteres.",
    );
  });
});
