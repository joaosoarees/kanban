import { Skeleton } from "@/components/ui/skeleton";

export default function GeneralSettingsLoading() {
  return (
    <output className="block">
      <span className="sr-only">Carregando as configurações…</span>
      <div
        aria-hidden
        className="flex flex-col gap-4 rounded-xl border bg-card p-5"
      >
        <Skeleton className="h-4 w-40 bg-muted-strong" />
        <Skeleton className="h-10 w-full max-w-[480px] rounded-lg bg-muted-strong" />
        <Skeleton className="h-10 w-20 rounded-lg bg-muted-strong" />
      </div>
    </output>
  );
}
