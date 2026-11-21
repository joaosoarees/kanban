import { SquareKanban } from "lucide-react";
import Link from "next/link";

const createdDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

type BoardTileProps = {
  href: string;
  name: string;
  createdAt: Date;
};

export function BoardTile({ href, name, createdAt }: BoardTileProps) {
  return (
    <Link
      href={href}
      className="flex h-[76px] min-w-0 items-center gap-3 rounded-xl border bg-white p-5 shadow-xs outline-hidden transition-[border-color,box-shadow] duration-150 hover:border-zinc-300 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:h-[84px]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
        <SquareKanban aria-hidden className="size-5 text-brand" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{name}</span>
        <span className="text-[13px] text-muted-foreground">
          Criado em {createdDate.format(createdAt)}
        </span>
      </span>
    </Link>
  );
}
