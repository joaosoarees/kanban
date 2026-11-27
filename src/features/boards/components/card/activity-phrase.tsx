import {
  AlignLeft,
  ArrowRight,
  Calendar,
  CircleCheck,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { LabelTag } from "@/features/boards/components/label/label-tag";
import type { CardActivity } from "@/features/boards/lib/card-activity";
import { formatDueDay } from "@/features/boards/lib/card-due";

export type ActivityPhrase = {
  icon: LucideIcon;
  isSuccess: boolean;
  text: ReactNode;
  rename: { from: string; to: string } | null;
};

export function Name({ children }: { children: ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

function phrase(icon: LucideIcon, text: ReactNode): ActivityPhrase {
  return { icon, isSuccess: false, text, rename: null };
}

function dueText(from: string | null, to: string | null, today: string | null) {
  if (to === null) {
    return from === null ? (
      "removeu o prazo"
    ) : (
      <>
        removeu o prazo <Name>{formatDueDay(from, today)}</Name>
      </>
    );
  }
  if (from === null) {
    return (
      <>
        definiu o prazo para <Name>{formatDueDay(to, today)}</Name>
      </>
    );
  }
  return (
    <>
      mudou o prazo de <Name>{formatDueDay(from, today)}</Name> para{" "}
      <Name>{formatDueDay(to, today)}</Name>
    </>
  );
}

function assigneeText(
  from: string | null,
  to: string | null,
  actorName: string,
) {
  if (to === null) {
    return from === null ? (
      "tirou o responsável"
    ) : (
      <>
        tirou <Name>{from}</Name> de responsável
      </>
    );
  }
  if (from === null) {
    return to === actorName ? (
      "assumiu o card"
    ) : (
      <>
        atribuiu a <Name>{to}</Name>
      </>
    );
  }
  return (
    <>
      trocou o responsável de <Name>{from}</Name> para <Name>{to}</Name>
    </>
  );
}

export function describeActivity(
  activity: CardActivity,
  today: string | null,
): ActivityPhrase {
  if (activity.type === "CARD_CREATED") {
    return phrase(
      Plus,
      <>
        criou o card em <Name>{activity.column}</Name>
      </>,
    );
  }
  if (activity.type === "CARD_MOVED") {
    return phrase(
      ArrowRight,
      <>
        moveu de <Name>{activity.from}</Name> para <Name>{activity.to}</Name>
      </>,
    );
  }
  if (activity.type === "TITLE_CHANGED") {
    return {
      ...phrase(Pencil, "renomeou o card"),
      rename: { from: activity.from, to: activity.to },
    };
  }
  if (activity.type === "DESCRIPTION_CHANGED") {
    return phrase(AlignLeft, "editou a descrição");
  }
  if (activity.type === "DUE_CHANGED") {
    return phrase(Calendar, dueText(activity.from, activity.to, today));
  }
  if (activity.type === "COMPLETION_CHANGED") {
    return activity.completed
      ? { ...phrase(CircleCheck, "concluiu o card"), isSuccess: true }
      : phrase(RotateCcw, "reabriu o card");
  }
  if (activity.type === "ASSIGNEE_CHANGED") {
    return phrase(
      UserRound,
      assigneeText(activity.from, activity.to, activity.actorName),
    );
  }
  if (activity.type === "LABEL_ADDED" || activity.type === "LABEL_REMOVED") {
    return phrase(
      Tag,
      <>
        {activity.type === "LABEL_ADDED" ? "adicionou" : "removeu"} a etiqueta{" "}
        <LabelTag
          name={activity.name}
          color={activity.color}
          className="max-w-[200px] align-top"
        />
      </>,
    );
  }
  return phrase(
    ListChecks,
    <>
      {activity.completed ? "concluiu" : "reabriu"} o item{" "}
      <Name>“{activity.text}”</Name>
    </>,
  );
}
