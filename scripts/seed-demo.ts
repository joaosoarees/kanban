import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { initialPositions } from "@/features/boards/lib/position";
import {
  PrismaClient,
  type LabelColor,
  type Role,
} from "@/generated/prisma/client";

export const DEMO_PASSWORD = "demo-kanbanary";
export const DEMO_EMAIL = "ana@demo.kanbanary.dev";

const people = [
  { key: "ana", name: "Ana Beatriz Rocha", email: DEMO_EMAIL },
  { key: "carlos", name: "Carlos Mendes", email: "carlos@demo.kanbanary.dev" },
  {
    key: "juliana",
    name: "Juliana Ferreira de Albuquerque",
    email: "juliana@demo.kanbanary.dev",
  },
  { key: "rafael", name: "Rafael Souza", email: "rafael@demo.kanbanary.dev" },
  { key: "marina", name: "Marina Costa", email: "marina@demo.kanbanary.dev" },
] as const;

type PersonKey = (typeof people)[number]["key"];

const roles: Record<PersonKey, Role> = {
  ana: "OWNER",
  carlos: "ADMIN",
  juliana: "MEMBER",
  rafael: "MEMBER",
  marina: "MEMBER",
};

const labels: { name: string; color: LabelColor }[] = [
  { name: "UX", color: "PURPLE" },
  { name: "API", color: "GREEN" },
  { name: "Front", color: "BLUE" },
  { name: "Bug", color: "RED" },
  { name: "Urgente", color: "ORANGE" },
  { name: "Pesquisa", color: "TEAL" },
];

type DemoCard = {
  title: string;
  description?: string;
  assignee?: PersonKey;
  labels?: string[];
};

const columns: { name: string; cards: DemoCard[] }[] = [
  {
    name: "A fazer",
    cards: [
      {
        title: "Entrevistar cinco pessoas que usam o quadro o dia todo",
        description:
          "Roteiro no documento da pesquisa. Foco em como elas organizam a semana e onde o arraste atrapalha.",
        assignee: "juliana",
        labels: ["Pesquisa", "UX"],
      },
      {
        title: "Exportar o quadro em CSV",
        labels: ["API"],
      },
      {
        title: "Atalho de teclado para criar card na coluna em foco",
        assignee: "rafael",
        labels: ["Front"],
      },
      { title: "Revisar textos dos estados vazios" },
    ],
  },
  {
    name: "Em andamento",
    cards: [
      {
        title: "Filtro por responsável e etiquetas no cabeçalho do quadro",
        description:
          "Um botão Filtrar com popover. O número de filtros ativos aparece no botão.",
        assignee: "ana",
        labels: ["Front", "UX"],
      },
      {
        title: "Card some ao mover para outra coluna no Safari",
        description: "Acontece só com a coluna de destino recolhida.",
        assignee: "rafael",
        labels: ["Bug", "Urgente", "Front"],
      },
      {
        title: "Paginação da lista de membros do workspace",
        assignee: "carlos",
        labels: ["API"],
      },
    ],
  },
  {
    name: "Em revisão",
    cards: [
      {
        title: "Tema escuro em todas as telas",
        assignee: "marina",
        labels: ["UX", "Front"],
      },
      {
        title: "Limite de tentativas no login e no cadastro",
        description: "Dez por minuto por IP, aplicado no proxy.",
        assignee: "carlos",
        labels: ["API", "Urgente"],
      },
    ],
  },
  {
    name: "Concluído",
    cards: [
      {
        title: "Barra lateral com quadros, membros e configurações",
        assignee: "marina",
        labels: ["UX"],
      },
      { title: "Etiquetas com oito cores", assignee: "ana", labels: ["Front"] },
      {
        title: "Backup diário do banco",
        assignee: "carlos",
        labels: ["API"],
      },
    ],
  },
];

const workspaces = [
  {
    name: "Produto",
    slug: "produto-demo",
    boards: ["Lançamento do app", "Roadmap 2027", "Bugs em produção"],
  },
  {
    name: "Marketing e Conteúdo",
    slug: "marketing-demo",
    boards: ["Calendário editorial"],
  },
];

async function createPeople(db: PrismaClient) {
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  const created = await Promise.all(
    people.map(async ({ key, name, email }) => {
      const user = await db.user.create({
        data: { name, email, passwordHash },
        select: { id: true },
      });
      return [key, user.id] as const;
    }),
  );
  return new Map<PersonKey, string>(created);
}

async function fillBoard(
  db: PrismaClient,
  boardId: string,
  userIds: Map<PersonKey, string>,
) {
  const createdLabels = await db.label.createManyAndReturn({
    data: labels.map(({ name, color }) => ({ boardId, name, color })),
    select: { id: true, name: true },
  });
  const labelIds = new Map(createdLabels.map(({ id, name }) => [name, id]));
  const columnPositions = initialPositions(columns.length);

  await Promise.all(
    columns.map(async (column, columnIndex) => {
      const cardPositions = initialPositions(column.cards.length);
      return db.column.create({
        data: {
          boardId,
          name: column.name,
          position: columnPositions[columnIndex],
          cards: {
            create: column.cards.map((card, cardIndex) => ({
              title: card.title,
              description: card.description,
              position: cardPositions[cardIndex],
              assigneeId: card.assignee && userIds.get(card.assignee),
              labels: {
                create: (card.labels ?? []).flatMap((name) => {
                  const labelId = labelIds.get(name);
                  return labelId === undefined ? [] : [{ labelId }];
                }),
              },
            })),
          },
        },
      });
    }),
  );
}

async function seed(db: PrismaClient) {
  await db.workspace.deleteMany({
    where: { slug: { in: workspaces.map(({ slug }) => slug) } },
  });
  await db.user.deleteMany({
    where: { email: { in: people.map(({ email }) => email) } },
  });

  const userIds = await createPeople(db);
  const createdWorkspaces = await Promise.all(
    workspaces.map(async (workspace) =>
      db.workspace.create({
        data: {
          name: workspace.name,
          slug: workspace.slug,
          memberships: {
            create: [...userIds].map(([key, userId]) => ({
              userId,
              role: roles[key],
            })),
          },
          boards: { create: workspace.boards.map((name) => ({ name })) },
        },
        select: { boards: { select: { id: true, name: true } } },
      }),
    ),
  );

  const demoBoard = createdWorkspaces[0].boards.find(
    ({ name }) => name === workspaces[0].boards[0],
  );
  if (demoBoard) {
    await fillBoard(db, demoBoard.id, userIds);
  }
}

if (import.meta.main) {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  await seed(db);
  await db.$disconnect();
  process.stdout.write(`demo data ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}
