import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <output className="block">
      <span className="sr-only">Carregando os membros…</span>
      <div aria-hidden className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-36 bg-muted-strong" />
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-end">
            <Skeleton className="h-10 rounded-lg bg-muted-strong" />
            <Skeleton className="h-10 rounded-lg bg-muted-strong" />
            <Skeleton className="h-10 rounded-lg bg-muted-strong" />
          </div>
          <Skeleton className="h-3.5 w-64 bg-muted-strong" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20 bg-muted-strong" />
          <div className="rounded-xl border bg-card">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0"
              >
                <Skeleton className="size-9 rounded-full bg-muted-strong" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-40 bg-muted-strong" />
                  <Skeleton className="h-3 w-56 bg-muted-strong" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg bg-muted-strong" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </output>
  );
}
