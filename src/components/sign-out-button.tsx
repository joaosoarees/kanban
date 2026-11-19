"use client";

import { Loader2, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="disabled:cursor-wait"
    >
      {pending ? (
        <Loader2
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
        />
      ) : (
        <LogOut aria-hidden />
      )}
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}
