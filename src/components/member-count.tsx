import { Users } from "lucide-react";

export function MemberCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <Users aria-hidden className="size-3.5" />
      {count === 1 ? "1 membro" : `${count} membros`}
    </span>
  );
}
