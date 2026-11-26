"use client";

import { Check, Search, UsersRound } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useBoardMeta } from "@/features/boards/components/board/board-meta";
import { MemberAvatar } from "@/features/boards/components/card/member-avatar";
import { comparable } from "@/features/boards/components/label/label-list";
import { LabelTag } from "@/features/boards/components/label/label-tag";
import { replaceBoardFilter } from "@/features/boards/hooks/use-board-filter";
import {
  NO_ASSIGNEE,
  type BoardFilter,
} from "@/features/boards/lib/board-filter";
import { cn } from "@/lib/utils";

const ANY_ASSIGNEE = "any";
const LEGEND = "px-3 pt-2.5 pb-1 text-[13px] font-medium text-fg-muted";
const LIST =
  "relative flex max-h-[min(188px,25svh)] flex-col overflow-y-auto p-1 pt-0";
const OPTION =
  "relative flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-[15px] hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:h-9 sm:text-sm";

type PersonOption = {
  value: string;
  name: string;
  suffix: string;
  avatar: ReactNode;
};

export function FilterOptions({ filter }: { filter: BoardFilter }) {
  const { labels, members } = useBoardMeta();
  const [query, setQuery] = useState("");
  const groupName = useId();
  const search = comparable(query);
  const matches = labels.filter(({ name }) =>
    comparable(name).includes(search),
  );
  const selected = filter.assignee ?? ANY_ASSIGNEE;
  const people: PersonOption[] = [
    {
      value: ANY_ASSIGNEE,
      name: "Qualquer responsável",
      suffix: "",
      avatar: (
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border-control bg-card text-fg-muted"
        >
          <UsersRound className="size-[13px]" />
        </span>
      ),
    },
    {
      value: NO_ASSIGNEE,
      name: "Sem responsável",
      suffix: "",
      avatar: <MemberAvatar name={null} />,
    },
  ].concat(
    members.map((member) => ({
      value: member.id,
      name: member.name,
      suffix: member.isViewer ? " (você)" : "",
      avatar: <MemberAvatar name={member.name} />,
    })),
  );

  const toggleLabel = (labelId: string) => {
    replaceBoardFilter({
      labelIds: filter.labelIds.includes(labelId)
        ? filter.labelIds.filter((id) => id !== labelId)
        : [...filter.labelIds, labelId],
      assignee: filter.assignee,
      due: filter.due,
    });
  };

  return (
    <>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className={LEGEND}>Responsável</legend>
        <div className={LIST}>
          {people.map((person) => (
            <label key={person.value} className={OPTION}>
              <input
                type="radio"
                name={groupName}
                value={person.value}
                checked={selected === person.value}
                onChange={() => {
                  replaceBoardFilter({
                    labelIds: filter.labelIds,
                    assignee:
                      person.value === ANY_ASSIGNEE ? null : person.value,
                    due: filter.due,
                  });
                }}
                className="sr-only"
              />
              {person.avatar}
              <span className="min-w-0 flex-1 truncate">
                {person.name}
                {person.suffix !== "" && (
                  <span className="text-fg-muted">{person.suffix}</span>
                )}
              </span>
              {selected === person.value && (
                <Check
                  aria-hidden
                  className="size-4 shrink-0 text-brand-fg"
                  strokeWidth={2.5}
                />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border-t">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={LEGEND}>Etiquetas</legend>
          {labels.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-fg-secondary">
              Este quadro ainda não tem etiquetas. Crie pelo card.
            </p>
          ) : (
            <>
              <label className="flex h-12 shrink-0 items-center gap-2 border-y px-2.5 text-fg-muted sm:h-10">
                <Search aria-hidden className="size-4 shrink-0" />
                <input
                  value={query}
                  aria-label="Buscar etiqueta"
                  placeholder="Buscar etiqueta"
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground sm:text-sm"
                />
              </label>
              {matches.length === 0 && (
                <p className="px-3 pt-3 pb-2 text-sm text-fg-secondary">
                  Nenhuma etiqueta com esse nome.
                </p>
              )}
              <div className={cn(LIST, "pt-1")}>
                {matches.map((label) => {
                  const isChecked = filter.labelIds.includes(label.id);
                  return (
                    <label key={label.id} className={OPTION}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          toggleLabel(label.id);
                        }}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border border-border-control bg-card text-on-color",
                          isChecked && "border-brand bg-brand",
                        )}
                      >
                        {isChecked && (
                          <Check className="size-3" strokeWidth={3} />
                        )}
                      </span>
                      <LabelTag name={label.name} color={label.color} />
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </fieldset>
      </div>
    </>
  );
}
