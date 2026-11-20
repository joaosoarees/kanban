import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      <div role="status">
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
            <Skeleton className="h-9 w-full rounded-lg bg-zinc-200 sm:w-36" />
          </div>
          <Skeleton className="mt-10 h-4 w-16 bg-zinc-200" />
          <Skeleton className="mt-3 h-[230px] rounded-xl bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}
