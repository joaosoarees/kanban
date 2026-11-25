type PreviewCard = {
  title: string;
  label?: { text: string; className: string };
  assignee?: { initials: string; className: string };
  done?: boolean;
};

type PreviewColumn = { title: string; count: number; cards: PreviewCard[] };

const columns: PreviewColumn[] = [
  {
    title: "A fazer",
    count: 3,
    cards: [
      {
        title: "Revisar onboarding",
        label: {
          text: "UX",
          className: "bg-label-purple-bg text-label-purple-fg",
        },
        assignee: { initials: "MA", className: "bg-identity-sky" },
      },
      {
        title: "Exportar quadro em CSV",
        label: {
          text: "API",
          className: "bg-label-green-bg text-label-green-fg",
        },
      },
      { title: "Atalhos de teclado" },
    ],
  },
  {
    title: "Fazendo",
    count: 2,
    cards: [
      {
        title: "Tela de membros",
        label: {
          text: "Front",
          className: "bg-label-blue-bg text-label-blue-fg",
        },
        assignee: { initials: "JS", className: "bg-identity-amber" },
      },
      {
        title: "Migrar etiquetas",
        assignee: { initials: "RL", className: "bg-identity-rose" },
      },
    ],
  },
  {
    title: "Feito",
    count: 8,
    cards: [
      { title: "Login e cadastro", done: true },
      { title: "Criar workspace", done: true },
    ],
  },
];

export function BoardPreview() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <p className="text-sm font-medium text-on-color">
        Sprint 14 · Time de produto
      </p>
      <div className="flex gap-4">
        {columns.map((column) => (
          <div
            key={column.title}
            className="flex w-60 shrink-0 flex-col gap-2 rounded-xl bg-brand-strong p-3"
          >
            <p className="px-1 text-sm font-medium text-on-color">
              {column.title}{" "}
              <span className="text-on-color/70">{column.count}</span>
            </p>
            {column.cards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-2 rounded-lg bg-card p-3 text-sm"
              >
                <span
                  className={
                    card.done === true
                      ? "text-muted-foreground line-through"
                      : "font-medium text-foreground"
                  }
                >
                  {card.title}
                </span>
                {(card.label !== undefined || card.assignee !== undefined) && (
                  <div className="flex items-center justify-between">
                    {card.label ? (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${card.label.className}`}
                      >
                        {card.label.text}
                      </span>
                    ) : (
                      <span />
                    )}
                    {card.assignee && (
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-on-color ${card.assignee.className}`}
                      >
                        {card.assignee.initials}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
