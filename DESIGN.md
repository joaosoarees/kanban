# DESIGN.md · Kanbanary

> Se este arquivo e o código discordarem, vale o código até o João decidir. Anote o conflito em Perguntas abertas.

## Produto

Kanban por workspaces para times pequenos (2 a 10 pessoas). O time entra num workspace, abre um quadro e move cards entre colunas ao longo do dia. Uso principal no navegador de desktop, com o quadro aberto o dia todo; o celular precisa funcionar, mas não é o cenário principal. Tarefa principal: ver quem está fazendo o quê e mover o trabalho sem atrito.

- Hierarquia: Workspace → Quadro → Coluna → Card (título, descrição, responsável, etiquetas). Papéis fixos: Dono, Admin, Membro.
- Entrada com e-mail e senha, sem login social nem convite por e-mail: um admin adiciona quem já tem conta.
- Sem tempo real: o que outras pessoas mudam aparece ao recarregar ou navegar. Toda mudança no quadro aparece na hora, antes de o servidor confirmar; um erro desfaz a mudança com uma mensagem clara.
- Fora do escopo por enquanto: comentários, anexos, data de entrega, histórico de atividade, busca.
- Princípios: o quadro é o produto, e tudo o mais serve para chegar a ele rápido; simplicidade antes de recurso.
- Não há logo além da marca de barras, ilustrações, depoimentos nem dados reais: nenhuma tela inventa clientes, números ou depoimentos.

## Público e voz

Pessoas de times de produto e serviços, à vontade com ferramentas web. Português do Brasil, tratando por "você", frases curtas e diretas ("Entre na sua conta", "Crie seu workspace"). Erros dizem o que fazer a seguir. Datas 20/11, horas 18h30.

## Mood

Palavras: animada, moderna, amigável.
Nunca parecer: painel SaaS genérico, corporativo pesado (Jira/ERP), infantil (neon, emojis por toda parte), gradientes e brilho (glassmorphism, sombras coloridas).

## Marca

- Fonte do design system: `src/app/globals.css` (tokens), `src/components/ui/` (11 componentes shadcn base-nova sobre Base UI) e `src/components/` (22 componentes do app). O guia no canvas https://claude.ai/artifact/QQ4ykQjWJGbJjWLeDCeWu4 espelha o código (registro em `design-sync.json`).
- Nome: Kanbanary. Logo: marca de barras indigo em `src/components/logo.tsx`.
- Cor principal: indigo `#4f46e5` (`--brand`), com `--brand-strong` `#4338ca` no hover e `--brand-deep` `#3730a3`. Neutros zinc. Destrutivo `#dc2626`.
- Fonte: Geist Sans; Geist Mono só para endereços (`/w/slug`).
- Raio base 8px (`--radius: 0.5rem`); cards e caixas 12px.
- Cada workspace tem uma cor de identidade, escolhida pelo slug (`workspace-tile.tsx`).

## Referências

- Linear: pegar animações curtas, densidade e alinhamento, tipografia contida, atalhos de teclado. Evitar: escuro demais, frio e sério, texto pequeno.
- Trello: pegar cards amigáveis, cor por quadro, arrastar fácil, "+ Adicionar card" direto na coluna. Evitar: fundos de foto, botões demais, cores saturadas.
- Notion: pegar calma e respiro, estados vazios acolhedores, hover discreto, ícone por espaço. Evitar: ações escondidas, cinza demais, menus longos.
- Height / Plane: pegar etiquetas vivas, leveza (bordas finas, sombras quase invisíveis), avatares coloridos, microinterações. Evitar: excesso de recursos, ícones demais, cores sem padrão.

## Restrições

- Desktop primeiro (1440 e 1280px); celular funcionando a partir de 390px, sem rolagem lateral.
- WCAG AA; axe sem violações. Todo controle com os estados: repouso, hover, foco pelo teclado, pressionado, desabilitado, carregando, erro.
- Nada muda de tamanho ao carregar, trocar texto ou mostrar erro.
- Cursor de mãozinha em botões e itens clicáveis (convenção do projeto).
- Tema claro agora; tema escuro na fatia 8.
- Ícones Lucide, contorno, um só conjunto.
- Movimento curto e frequente: microinterações em quase tudo, entre 100 e 200ms, fechando mais rápido que abrindo, e desligadas com "reduzir movimento".

## Registro de decisões

- 2026-11-20 — Fluxo de design passa a ser o do plugin craft — o João quer revisar telas desenhadas antes de qualquer página.
- 2026-11-20 — Mood: animada, moderna, amigável — escolha do João na configuração do brief.
- 2026-11-20 — Movimento curto e frequente (100–200ms) e desligado com "reduzir movimento" — equilibra "animada" com a referência do Linear.
- 2026-11-20 — Ações de linha ficam sempre visíveis; o hover só as destaca — junta o "hover discreto" do Notion com o "evitar ações escondidas" pedido para o celular.
- 2026-11-20 — Importados para o canvas de Design: tokens, botão, campo, controle de papel, badge, tile, toast e movimento — são as peças que as correções da revisão usam.
- 2026-11-20 — Botão carregando mantém a largura (texto invisível sob o spinner) — nada pode mudar de tamanho ao carregar.
- 2026-11-20 — Vermelho cheio só no botão de confirmar dos diálogos; áreas de risco usam o destrutivo de contorno — a ação perigosa não pode ser o que mais chama atenção na página.
- 2026-11-20 — Ações repetidas em linhas usam o botão "de linha": neutro, vermelho só no hover — vermelho repetido em cada linha competia pela atenção.
- 2026-11-20 — Um só controle de papel (menu com descrições) no formulário e nas linhas — a mesma peça precisa ter a mesma cara.
- 2026-11-20 — Erros de campo e de credencial usam a linha reservada abaixo do campo, com ponto e o próximo passo — sem alertas que empurram o botão.
- 2026-11-20 — Conteúdo das páginas logadas com largura máxima de 1024px — a borda esquerda não pode pular entre páginas.
- 2026-11-20 — Endereços (`/w/slug`) sempre em Geist Mono, cortados com reticências — mesma peça em todo lugar.
- 2026-11-20 — Movimento: abrir 140–160ms com ease-out, fechar 90–100ms só com fade, nada com "reduzir movimento" — referência do Linear e regra do brief.

## Perguntas abertas

- Avatares coloridos por pessoa (referência Height/Plane): hoje todos os avatares são indigo claro. Mudar? (não decidido)
- Texto secundário em 12–13px aparece em vários lugares, e a referência pede evitar texto pequeno. Subir o mínimo para 13px? (assumido: 13px mínimo)
- Paleta das etiquetas de cards (fatia 7): tons claros com texto escuro, sem saturação forte. (assumido)
- Cor por quadro, além da cor por workspace (referência Trello)? (não decidido)
