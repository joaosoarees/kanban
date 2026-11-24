import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, type BaseSyntheticEvent } from "react";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type * as z from "zod";
import type { ActionError, ActionResult } from "@/lib/action-result";
import { applyActionErrors } from "@/lib/form-errors";
import { runAction } from "@/lib/run-action";

type ActionFormOptions<
  TInput extends FieldValues,
  TOutput extends FieldValues,
  TData,
> = {
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  action: (values: TOutput) => Promise<ActionResult<TData>>;
  failure: string;
  onSuccess?: (data: TData, values: TOutput) => void;
  onError?: (error: ActionError) => void;
};

export function useActionForm<
  TInput extends FieldValues,
  TOutput extends FieldValues,
  TData = undefined,
>({
  schema,
  defaultValues,
  action,
  failure,
  onSuccess,
  onError,
}: ActionFormOptions<TInput, TOutput, TData>) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleValid = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await runAction(async () => action(values), failure);
      if (result.status === "success") {
        startTransition(() => {
          onSuccess?.(result.data, values);
        });
        return;
      }
      applyActionErrors(result, form.setError);
      startTransition(() => {
        onError?.(result);
      });
    });
  });

  const submit = (event?: BaseSyntheticEvent) => {
    void handleValid(event);
  };

  return { form, submit, isPending };
}
