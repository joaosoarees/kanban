import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <main className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
      <output className="flex min-h-0 flex-1 flex-col">
        <span className="sr-only">Carregando o quadro…</span>
        <div aria-hidden className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center px-3 sm:h-16 sm:px-6">
            <Skeleton className="h-6 w-56 max-w-full bg-zinc-200" />
          </div>
          <div className="flex min-h-0 flex-1 gap-2.5 overflow-hidden px-3 pb-3 sm:gap-3 sm:px-6 sm:pb-4">
            {[1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                className="h-full w-[312px] shrink-0 rounded-xl bg-zinc-200 sm:w-72"
              />
            ))}
            <Skeleton className="h-11 w-[312px] shrink-0 rounded-xl bg-zinc-200 sm:h-10 sm:w-72" />
          </div>
        </div>
      </output>
    </main>
  );
}
