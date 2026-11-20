import { Skeleton } from "@/components/ui/skeleton";

export default function GeneralSettingsLoading() {
  return (
    <output className="block">
      <span className="sr-only">Carregando as configurações…</span>
      <div
        aria-hidden
        className="flex flex-col gap-4 rounded-xl border bg-white p-5"
      >
        <Skeleton className="h-4 w-40 bg-zinc-200" />
        <Skeleton className="h-10 w-full max-w-[480px] rounded-lg bg-zinc-200" />
        <Skeleton className="h-10 w-20 rounded-lg bg-zinc-200" />
      </div>
    </output>
  );
}
