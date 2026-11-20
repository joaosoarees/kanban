import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div role="status">
      <span className="sr-only">Carregando as configurações…</span>
      <div aria-hidden className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-5">
          <Skeleton className="h-4 w-40 bg-zinc-200" />
          <Skeleton className="h-10 w-full max-w-[480px] rounded-lg bg-zinc-200" />
        </div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
