import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      <output className="block">
        <span className="sr-only">Carregando o workspace…</span>
        <div aria-hidden>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-4">
              <Skeleton className="size-10 rounded-[10px] bg-zinc-200 sm:size-12" />
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-[26px] w-56 bg-zinc-200" />
                <Skeleton className="h-3.5 w-72 max-w-full bg-zinc-200" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-lg bg-zinc-200 sm:h-9 sm:w-36" />
          </div>
          <div className="mt-7 mb-2 flex h-11 items-center justify-between sm:mt-10 sm:mb-3 sm:h-9">
            <Skeleton className="h-4 w-16 bg-zinc-200" />
            <Skeleton className="h-11 w-32 rounded-lg bg-zinc-200 sm:h-9" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton
                key={item}
                className="h-[76px] rounded-xl bg-zinc-200 sm:h-[84px]"
              />
            ))}
          </div>
        </div>
      </output>
    </main>
  );
}
