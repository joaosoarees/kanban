"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterOptions } from "@/features/boards/components/filter-options";
import {
  replaceBoardFilter,
  useBoardFilter,
} from "@/features/boards/hooks/use-board-filter";
import {
  activeFilterCount,
  NO_FILTER,
} from "@/features/boards/lib/board-filter";
import { cn } from "@/lib/utils";

function clearFilter() {
  replaceBoardFilter(NO_FILTER);
}

export function FilterMenu() {
  const filter = useBoardFilter();
  const count = activeFilterCount(filter);

  return (
    <div className="flex shrink-0 items-center gap-2 max-sm:order-1 sm:ml-auto">
      {count > 0 && (
        <>
          <p className="hidden text-[13px] text-fg-muted lg:block">
            Limpe os filtros para arrastar cards.
          </p>
          <Button
            variant="ghost"
            onClick={clearFilter}
            className="hidden h-8 px-2.5 sm:inline-flex"
          >
            Limpar filtros
          </Button>
        </>
      )}
      <Popover>
        <PopoverTrigger
          aria-label={
            count === 0
              ? undefined
              : `Filtrar, ${count} ${count === 1 ? "filtro ativo" : "filtros ativos"}`
          }
          className={cn(
            "inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-hidden transition-colors duration-150 hover:border-border-control focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:h-8 sm:px-2.5",
            count > 0 &&
              "border-accent-border bg-accent text-accent-foreground hover:border-accent-border-hover",
          )}
        >
          <ListFilter aria-hidden className="size-4" />
          Filtrar
          {count > 0 && (
            <span
              aria-hidden
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[13px] font-semibold text-on-color"
            >
              {count}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          aria-label="Filtrar cards"
          className="w-[min(20rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0"
        >
          <FilterOptions filter={filter} />
          <div className="flex justify-end border-t p-1.5">
            <Button
              variant="ghost"
              disabled={count === 0}
              onClick={clearFilter}
              className="h-11 px-3 sm:h-8"
            >
              Limpar filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
