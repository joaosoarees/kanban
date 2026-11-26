# DESIGN.md · Kanbanary

> Se este arquivo e o código discordarem, vale o código até o João decidir. Anote o conflito em Perguntas abertas.

## Produto

Kanban por workspaces para times pequenos (2 a 10 pessoas). O time entra num workspace, abre um quadro e move cards entre colunas ao longo do dia. Uso principal no navegador de desktop, com o quadro aberto o dia todo; o celular precisa funcionar, mas não é o cenário principal. Tarefa principal: ver quem está fazendo o quê e mover o trabalho sem atrito.

- Hierarquia: Workspace → Quadro → Coluna → Card (título, descrição, responsável, etiquetas). Papéis fixos: Dono, Admin, Membro.
- Entrada com e-mail e senha, sem login social. Quem administra convida pelo e-mail, e a pessoa entra depois de aceitar, com ou sem conta.
- Sem tempo real: o que outras pessoas mudam aparece ao recarregar ou navegar. Mover uma coluna aparece na hora, antes de o servidor confirmar, e um erro desfaz o movimento com uma mensagem clara. Criar, renomear e excluir aparecem quando o servidor confirma.
- Fora do escopo por enquanto: anexos, histórico de atividade, busca.
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
- Cores só por papel: superfícies (`canvas`, `card`, `muted`, `muted-strong`), texto (`foreground`, `fg-secondary`, `fg-muted`, `muted-foreground`, `fg-faint`), bordas (`border`, `border-strong`, `border-control`), marca (`brand-fg` para texto e ícones, `accent*`), perigo (`destructive*`, `danger-*`), texto sobre cor cheia (`on-color`), etiquetas (`label-<cor>-bg/-fg`) e identidade (`identity-<cor>`). Classes de paleta (`zinc-600`, `red-700`) não entram nos componentes.
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
- Tema claro e escuro, com a escolha Claro, Escuro ou Sistema no menu da conta.
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
- 2026-11-24 — Filtros desenhados no canvas da fatia 7 (pranchas 7.11 a 7.14), aprovados — mesma fatia, mesmo canvas.
- 2026-11-24 — Um só botão "Filtrar" com popover de Responsável e Etiquetas, igual no desktop e no celular — cabe no cabeçalho de 390px e segue o padrão de Linear e Trello.
- 2026-11-24 — Responsável no filtro é escolha única, com "Qualquer responsável" como padrão e "Sem responsável" — espelha `assignee=id|none` da URL.
- 2026-11-24 — O botão mostra quantos filtros estão ativos, somando cada etiqueta e o responsável — a pessoa vê de longe que o quadro está filtrado.
- 2026-11-24 — Card que deixa de bater com o filtro não ganha marca e só some quando o filtro muda — simplicidade antes de recurso.
- 2026-11-24 — Com filtro, a coluna mostra "3 de 12", a recolhida mostra só o número filtrado e o desktop avisa "Limpe os filtros para arrastar cards" — o arraste desligado não fica sem explicação.
- 2026-11-24 — Tokens semânticos de cor substituem as classes de paleta em 52 arquivos, com os mesmos valores no tema claro — o tema escuro troca os valores dos papéis sem mexer nos componentes.
- 2026-11-24 — Fusões aprovadas: `zinc-800` vira `foreground`, `zinc-500` de borda vira `border-control`, `indigo-200` de borda vira `accent-border`; o vermelho cheio dos botões destrutivos passa a usar o `--destructive` (`#dc2626`) — um valor por papel.
- 2026-11-24 — Tema escuro desenhado no canvas da fatia 8 (pranchas 8.1 a 8.14) — os componentes não mudam, só os valores dos papéis dentro de `.dark`.
- 2026-11-24 — Escolha Claro, Escuro ou Sistema no menu da conta, padrão Sistema, guardada no navegador; sem login segue o navegador ou o sistema operacional — sem coluna nova no banco e sem piscar na entrada.
- 2026-11-24 — Fundo escuro em zinco (`#121214` a `#27272c`), nunca preto puro; a superfície sobe um degrau por camada (página, coluna, card, popover) — profundidade sem sombra pesada.
- 2026-11-24 — Etiquetas no escuro com fundo tingido escuro e texto claro da mesma cor; cores de identidade dos workspaces não mudam — a etiqueta continua reconhecível nos dois temas.
- 2026-11-24 — Novo papel `brand-fg` (claro `#4f46e5`, escuro `#a5b4fc`) para links, ícones e checks; texto em `brand-strong` e `brand-deep` passa a `accent-foreground` — o indigo cheio não lê como texto sobre fundo escuro.
- 2026-11-24 — A prévia do quadro na entrada usa os tokens de etiqueta (UX roxo, API verde, Front azul) e o número das colunas em branco 70% — sem classes de paleta, legível nos dois temas.
- 2026-11-24 — Hover de item em menu e popover afunda para `muted` também no escuro, e as variantes `dark:` geradas pelo shadcn ficam como vieram — mesma regra nos dois temas, arquivos gerados intocados.
- 2026-11-24 — Barra lateral desenhada no canvas da fatia 8 (pranchas 8.15 a 8.24), opção C da rodada de opções — escolha do João entre três direções.
- 2026-11-24 — Dentro do workspace não há cabeçalho: a barra ocupa a altura toda com logo, seletor de workspace, quadros, Membros, Configurações e a conta no rodapé; o início mantém o cabeçalho — o quadro ganha 56px de altura e tudo do workspace fica num lugar só.
- 2026-11-24 — Recolhida (botão de painel ou tecla `[`), a barra vira um trilho de 56px; o ícone Quadros abre a lista num popover — trocar de quadro continua a um clique sem reabrir a barra.
- 2026-11-24 — Abaixo de 1024px, uma faixa de 56px com botão de menu e workspace abre a barra como gaveta; o nome do quadro fica só no título logo abaixo — uma barra fixa roubaria espaço das colunas, e o nome repetido gastaria a largura do celular.
- 2026-11-24 — Recolhida, o popover de quadros mostra a lista, o erro e o vazio, mas não cria quadro; criar fica na barra aberta e na página do workspace — o diálogo de criar não pode viver dentro de um popover que fecha ao clicar fora.
- 2026-11-24 — Membro não vê "+ Novo quadro" nem Configurações na barra; Membros leva à aba Membros — a barra só mostra o que o papel pode usar.
- 2026-11-24 — Ícone do app desenhado em https://claude.ai/artifact/FXRbLd6CJcp1tRU7tUGZ4Q, aprovado — `icon.svg`, `favicon.ico` (16, 32, 48) e `apple-icon.png` (180) saem da marca de barras, sem logo novo.
- 2026-11-24 — Ícone numa grade de 32 com barras de 4, espaço de 2, alturas 16/10/6 e margem de 8 — toda borda cai em pixel inteiro em 16, 32 e 48px; a marca fica um pouco menor que no logo de 28px (50% contra 57%).
- 2026-11-24 — Barras sem arredondamento no favicon; o `apple-icon` mantém o raio do logo — meio pixel de raio borrava o topo das barras em 16px.
- 2026-11-24 — Uma versão do ícone para navegador claro e escuro; `apple-icon` com cantos retos e fundo cheio — o quadrado indigo separa o ícone dos dois cromos, e o iOS aplica a própria máscara.
- 2026-11-24 — Sem manifest de PWA e sem imagem Open Graph por enquanto — o uso é no navegador de desktop; a prévia de link fica para uma rodada própria.
- 2026-11-25 — Erros de carregamento desenhados em https://claude.ai/artifact/Gm9kyW7aUhwRfRsHiurtcY (pranchas 11.1 a 11.3), aprovados — canvas próprio da fatia 11.
- 2026-11-25 — Falha numa página do workspace mostra o erro ao lado da barra lateral, só com "Tentar de novo" — a barra já leva aos quadros e às configurações, e um "Voltar aos quadros" apontaria para a própria página quando é ela que falha.
- 2026-11-25 — Falha fora do workspace (o layout da entrada, por exemplo) vira "Algo deu errado" em tela cheia, com fontes e tema, sem o logo nem o painel da entrada — o `error.tsx` não cobre o layout do próprio segmento, e mover a checagem de sessão para cada página custaria mais que o caso raro.
- 2026-11-25 — "Tentar de novo" das telas de erro novas tem 44px no celular e 40px a partir de `sm` — alvo de toque mínimo; as telas de erro antigas seguem com 40px.
- 2026-11-25 — E-mails desenhados em https://claude.ai/artifact/ECdeYrVh5Wd6Bb5FftPmoL (pranchas 12.1 a 12.4), aprovados — canvas próprio da fatia 12.
- 2026-11-25 — Marca dos e-mails: as três barras em células com cor de fundo, ao lado de "Kanbanary" em texto — aparece mesmo com imagens bloqueadas e não depende de uma URL pública do app.
- 2026-11-25 — E-mails só no tema claro, com `color-scheme: light` — Gmail e Outlook invertem as cores por conta própria; a variante invertida foi conferida no canvas.
- 2026-11-25 — E-mails sem links nem botões, e o código fora do assunto e da prévia — a tela de código depende de um cookie do navegador do cadastro, link em e-mail tem cara de phishing, e o código não aparece na tela de bloqueio.
- 2026-11-25 — Cores dos e-mails são os tokens zinc e indigo em hex, e a fonte é a do sistema — clientes de e-mail não leem `oklch` nem variáveis CSS, e a Geist não carrega no Gmail nem no Outlook.
- 2026-11-25 — O e-mail de verificação termina em "Se você não criou uma conta, ignore este e-mail.", sem o prazo de 3 dias — a conta pendente deixou de expirar; um novo cadastro com o mesmo e-mail a substitui.
- 2026-11-25 — O código do e-mail tem 8 dígitos, mostrados em dois grupos de 4 separados por espaço visual (`4829 1375`); o texto puro e a cópia trazem os 8 dígitos juntos — 8 dígitos substituíram a janela de tentativas por conta, e os grupos facilitam ler e digitar.
- 2026-11-25 — A caixa do código ocupa a largura do cartão, com os dígitos centralizados, no computador e no celular — o código é o centro do e-mail, e a mesma caixa nas duas larguras dispensa a regra de celular.
- 2026-11-25 — Tela `/verify-email` desenhada no canvas da fatia 13 (https://claude.ai/artifact/XtSnssDmDRLW5exph1onZW, pranchas 13.1 a 13.4, claro e escuro): mesmo layout do login, campo único com teclado numérico, código enviado só pelo botão, reenvio com contagem na mesma largura e "Usar outro e-mail" levando a `/sign-in` — segue as telas de entrada e evita as caixinhas, que atrapalham colar e o leitor de tela.
- 2026-11-25 — Telas de "Esqueci a senha" desenhadas no canvas da fatia 14 (https://claude.ai/artifact/LJf4wocJmG26Rdq9r8f1mm, pranchas 14.1 a 14.6, claro e escuro) — mesmo layout das telas de entrada; o código reaproveita o formulário do `/verify-email`.
- 2026-11-25 — "Esqueci a senha" fica na linha do rótulo Senha e leva o e-mail digitado — o `TextField` ganhou um espaço opcional à direita do rótulo, só usado no login por enquanto.
- 2026-11-25 — `/reset-password` mostra o código ou a senha nova conforme o cookie, e o texto do código diz "Se houver uma conta" — uma rota a menos, e a tela não revela se a conta existe.
- 2026-11-25 — A senha nova avisa que as outras sessões serão encerradas — explica por que outro aparelho pede login de novo.
- 2026-11-25 — Texto tem no mínimo 13px; só etiquetas e contadores podem ter 12px — a referência pede evitar texto pequeno, e etiquetas e contadores precisam caber no card e na coluna.
- 2026-11-25 — Sem preferência de densidade por enquanto — quadros de times pequenos têm poucos cards, e um modo compacto dobraria as versões do card nos dois temas.
- 2026-11-26 — Telas de convite desenhadas no canvas da fatia 15 (https://claude.ai/artifact/E894WS7A1kDnbWz6WUePhz, pranchas 15.1 a 15.8, claro e escuro), aprovadas — `/invite/[token]` usa a casca das telas de entrada, fora do grupo `(auth)`, porque abre com ou sem sessão.
- 2026-11-26 — Sem sessão, "Criar conta" é a ação principal do convite e "Entrar" a secundária — o caso comum é quem ainda não tem conta, e a tela não pode revelar se o e-mail já tem.
- 2026-11-26 — Aviso do convite: faixa na cor de destaque acima do título de entrar, criar conta e confirmar o e-mail, com "Seguir sem o convite" — lembra por que a pessoa está ali e dá uma saída. No cadastro, o e-mail vem travado, em cinza com cadeado.
- 2026-11-26 — O e-mail do convite tem um botão "Ver convite" e o endereço em texto embaixo, exceção à regra dos e-mails sem links — o convite precisa abrir em outro navegador ou aparelho, e não traz código.
- 2026-11-26 — "Convites pendentes" fica entre "Convidar" e a lista de membros, que ganha o título "Membros"; some quando vazio; revogar não pede confirmação — convidar de novo desfaz o engano. A linha começa pelo prazo ("Vence em 6 dias · enviado por…"), que é o que importa quando o texto é cortado.
- 2026-11-26 — Página `/account` desenhada no canvas da fatia 16 (https://claude.ai/artifact/3ZwoX5NK5dGgN6JXViQttf, pranchas 16.1 a 16.5), aprovada — três cartões (Nome, Senha, E-mail) numa coluna de 672px, com o cabeçalho do início; entra pelo item "Conta" do menu da conta, marcado quando a página está aberta.
- 2026-11-26 — A troca de e-mail acontece dentro do próprio cartão, em dois passos (e-mail novo e senha, depois o código), e volta ao passo do código ao recarregar — sem rota nova, e quem saiu no meio continua de onde parou.
- 2026-11-26 — Dentro de um cartão, o passo do código põe "Reenviar" e "Usar outro e-mail" à esquerda e "Confirmar" à direita; as telas de entrada mantêm o botão na largura toda e os links embaixo — o mesmo formulário com duas disposições, para os erros e o reenvio ficarem num lugar só.
- 2026-11-26 — O código errado mostra uma só mensagem, "Código inválido ou vencido. Peça um novo.", e não as tentativas restantes do canvas — igual às outras telas de código.
- 2026-11-26 — Prazo no card desenhado no canvas da fatia 17 (https://claude.ai/artifact/69GUz4Hss9diKNZjCCktZY, peças 17.0 e telas 17.1 a 17.5, claro e escuro), aprovado — o prazo é um dia, sem hora, comparado com o dia de quem vê; "Concluído" é uma marca do card, separada da coluna.
- 2026-11-26 — No card do quadro, o selo de prazo vem primeiro na linha de baixo, com a forma da etiqueta: neutro, "Hoje" em destaque, atrasado em vermelho e "✓ Concluído" em verde no lugar da data. Os tokens `success-fg` e `success-bg` entram para o verde.
- 2026-11-26 — No diálogo, Prazo e Concluído ficam entre Responsável e Etiquetas. O campo de prazo é o botão de propriedade do responsável; a data atrasada lê "24 nov 2026 · atrasado" e a de hoje "Hoje, 26 nov". A caixa "Concluído" é o checkbox de 16px do filtro, sem rótulo de linha.
- 2026-11-26 — O calendário abre em popover sob o campo no desktop e dentro do diálogo, em largura total e com dias de 40px, no celular. Escolher um dia salva e fecha; não há atalhos; a semana começa no domingo; um "×" ao lado do campo remove o prazo.
- 2026-11-26 — O filtro ganha o grupo "Prazo", de escolha única, entre Responsável e Etiquetas: Qualquer prazo, Atrasados, Vencem em 7 dias e Sem prazo. Todo membro edita prazo e conclusão, então não há estado só leitura.
- 2026-11-26 — Comentários no card desenhados no canvas da fatia 18 (https://claude.ai/artifact/TBdShY7xnJkdRDnmtwMWcU, telas 18.1 a 18.4, claro e escuro), aprovados — texto puro, sem formatação nem menções.
- 2026-11-26 — A seção "Comentários" fica entre a descrição e a linha "Excluir card / Mover para": o campo no topo, o mais novo primeiro e "Ver anteriores" no fim. Sem rolagem própria: o diálogo inteiro rola — quem abre o card vê o último comentário sem rolar, e duas áreas de rolagem uma dentro da outra prendem a roda e o dedo.
- 2026-11-26 — Comentar não é otimista: o texto fica no campo, só leitura, com o spinner no botão até a action terminar. Ctrl/⌘+Enter envia e Enter quebra a linha; um rascunho ou uma edição não enviados usam o aviso "Descartar as alterações?" da descrição.
- 2026-11-26 — A data do comentário é "hoje, 18h30", "ontem, 9h12" ou "20/11, 18h30", com o ano só fora do ano atual — sem "há 5 min", para o texto não mudar sozinho com a tela aberta.
- 2026-11-26 — "Editar" e "Excluir" ficam no cabeçalho do comentário, sempre visíveis; no celular descem para baixo do texto. O autor edita e exclui; ADMIN e OWNER só excluem os dos outros. Excluir pede confirmação.
- 2026-11-26 — No card do quadro, o número de comentários vem com o ícone `MessageSquare` em 12px ao lado do avatar e some quando é zero.

## Perguntas abertas

Nenhuma no momento.
