import { Skeleton } from "@/components/ui/skeleton";

const CARD_HEIGHTS = ["h-[214px]", "h-[322px]", "h-[146px]"];

export function AccountSkeleton() {
  return (
    <output className="block">
      <span className="sr-only">Carregando sua conta…</span>
      <div aria-hidden className="flex flex-col gap-6">
        {CARD_HEIGHTS.map((height) => (
          <div
            key={height}
            className={`flex flex-col gap-3 rounded-xl border bg-card p-5 ${height}`}
          >
            <Skeleton className="h-4 w-28 bg-muted-strong" />
            <Skeleton className="h-3.5 w-72 max-w-full bg-muted-strong" />
            <Skeleton className="mt-2 h-10 w-full bg-muted-strong" />
          </div>
        ))}
      </div>
    </output>
  );
}
