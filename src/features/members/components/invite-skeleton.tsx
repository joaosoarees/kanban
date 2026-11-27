import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const bone = "bg-muted-strong motion-reduce:animate-none";

function LeadLine({ width }: { width: string }) {
  return (
    <div className="flex h-[22px] items-center">
      <Skeleton className={cn("h-3.5", bone, width)} />
    </div>
  );
}

export function InviteSkeleton({ slow = false }: { slow?: boolean }) {
  return (
    <div aria-busy="true">
      <div aria-hidden="true" className="mb-8 flex flex-col gap-2">
        <Skeleton className={cn("mb-2 size-10 rounded-[10px]", bone)} />
        <div className="flex h-8 items-center">
          <Skeleton className={cn("h-7 w-[72%]", bone)} />
        </div>
        <div>
          <LeadLine width="w-full" />
          <LeadLine width="w-[62%]" />
        </div>
        <div>
          <LeadLine width="w-full" />
          <LeadLine width="w-[46%]" />
        </div>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className={cn("h-10 w-full", bone)} />
        <Skeleton className={cn("h-10 w-full", bone)} />
      </div>
      <output className="mt-5 flex h-5 items-center justify-center text-sm text-muted-foreground">
        {slow ? (
          <span className="flex items-center gap-2">
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Ainda carregando o convite…
          </span>
        ) : (
          <>
            <span className="sr-only">Carregando o convite…</span>
            <Skeleton
              aria-hidden="true"
              className={cn("h-3.5 w-[68%]", bone)}
            />
          </>
        )}
      </output>
    </div>
  );
}
