# DESIGN.md · Kanbanary

> Se este arquivo e o código discordarem, vale o código até o João decidir. Anote o conflito em Perguntas abertas.

## Produto

Kanban por workspaces para times pequenos (2 a 10 pessoas). O time entra num workspace, abre um quadro e move cards entre colunas ao longo do dia. Uso principal no navegador de desktop, com o quadro aberto o dia todo; o celular precisa funcionar, mas não é o cenário principal. Tarefa principal: ver quem está fazendo o quê e mover o trabalho sem atrito.

- Hierarquia: Workspace → Quadro → Coluna → Card (título, descrição, responsável, etiquetas). Papéis fixos: Dono, Admin, Membro.
- Entrada com e-mail e senha, sem login social nem convite por e-mail: um admin adiciona quem já tem conta.
- Sem tempo real: o que outras pessoas mudam aparece ao recarregar ou navegar. Mover uma coluna aparece na hora, antes de o servidor confirmar, e um erro desfaz o movimento com uma mensagem clara. Criar, renomear e excluir aparecem quando o servidor confirma.
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
- 2026-11-21 — A página do quadro usa a largura total, com rolagem horizontal só na área das colunas — exceção aos 1024px, porque as colunas precisam do espaço e o cabeçalho não pode se mover.
- 2026-11-21 — A lista de quadros é uma grade de tiles com nome e data de criação — repete o padrão da tela inicial.
- 2026-11-21 — Mover coluna para a esquerda e a direita fica no mesmo menu no desktop e no celular — dá uma alternativa ao arraste para toque e teclado.
- 2026-11-21 — Sem cor por quadro por enquanto — a cor continua sendo do workspace.
- 2026-11-22 — Telas de cards desenhadas em https://claude.ai/artifact/TTG9TsGjnmSzBWKA8CqrCH — canvas próprio da fatia 6, aprovado.
- 2026-11-22 — "Mover para" no celular e em telas de toque maiores fica dentro do diálogo do card — o card continua limpo, o toque sempre abre e tablets também conseguem mover.
- 2026-11-22 — Indicador de descrição é só um ícone discreto, sem prévia — mantém a coluna densa e fácil de ler.
- 2026-11-22 — Título do card aparece em até 3 linhas e a rolagem fica só na lista da coluna — cabeçalho e "Adicionar card" não saem do lugar.
- 2026-11-23 — Telas de etiquetas e responsável desenhadas em https://claude.ai/artifact/JkNNHZ4uxdCtgEFqKXEpHS — canvas próprio da fatia 7, aprovado.
- 2026-11-23 — Etiquetas usam 8 cores em tons claros com texto escuro — identificam o card sem competir com o título e mantêm o contraste.
- 2026-11-23 — Avatares continuam indigo claro — a cor do card fica reservada às etiquetas.
- 2026-11-23 — O card mostra até 3 etiquetas e "+N" — a altura continua previsível em colunas cheias.
- 2026-11-23 — Responsável e etiquetas ficam numa faixa abaixo do título do diálogo — ficam perto do que identifica o card e a descrição mantém o espaço.
- 2026-11-23 — Popover entra no sistema para o seletor de etiquetas — busca, lista e edição precisam de um painel que não feche ao marcar.
- 2026-11-23 — Excluir etiqueta, remover membro e sair do workspace informam quantos cards serão afetados — a pessoa decide sabendo o impacto.

## Perguntas abertas

- Texto secundário em 12–13px aparece em vários lugares, e a referência pede evitar texto pequeno. Subir o mínimo para 13px? (assumido: 13px mínimo)
