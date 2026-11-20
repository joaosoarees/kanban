import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div role="status">
      <span className="sr-only">Carregando os membros…</span>
      <div aria-hidden className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-5">
          <Skeleton className="h-4 w-36 bg-zinc-200" />
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-end">
            <Skeleton className="h-10 rounded-lg bg-zinc-200" />
            <Skeleton className="h-10 rounded-lg bg-zinc-200" />
            <Skeleton className="h-10 rounded-lg bg-zinc-200" />
          </div>
          <Skeleton className="h-3.5 w-64 bg-zinc-200" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20 bg-zinc-200" />
          <div className="rounded-xl border bg-white">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0"
              >
                <Skeleton className="size-9 rounded-full bg-zinc-200" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-40 bg-zinc-200" />
                  <Skeleton className="h-3 w-56 bg-zinc-200" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
