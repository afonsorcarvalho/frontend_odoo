# Supervisório Odoo — Interface de Nova Geração

> Um front-end de supervisório industrial construído sobre Odoo 16,
> repensado do zero para ter a cara de um dashboard de centro de
> controle moderno — sem abandonar a profundidade do ERP por trás.

---

## A proposta

Odoo é um ERP robusto, mas sua interface nativa é pensada para
operação administrativa, não para salas de monitoramento. Este projeto
entrega uma **camada de apresentação totalmente nova**, que conversa
com o Odoo via JSON-RPC e WebSocket/SSE em tempo real, e apresenta os
dados do chão de fábrica (ciclos de esterilização, ordens de serviço,
equipamentos, contatos) numa linguagem visual próxima do que se vê hoje
em produtos como Linear, Vercel, Supabase e dashboards de SRE.

**Objetivo para quem for iterar no design:** manter a sensação de
"produto de tecnologia premium" mesmo quando o público é um operador de
esterilização na ponta. Nada de cinza corporativo. Nada de gradiente
decorativo vazio. Cada brilho tem significado.

---

## Linguagem visual

### Paleta

- **Fundo**: `dark-900` / `dark-800` profundo, tendendo ao azul-petróleo,
  com stops intermediários para glass morphism.
- **Acentos neon**, usados como sinalização semântica (nunca só decoração):
  - `neon-blue` (`#00D4FF`) → estado informacional, marca do produto,
    elementos interativos em repouso.
  - `neon-green` (`#10B981`) → sucesso, ciclo em andamento saudável,
    fase atual.
  - `neon-pink` (`#EC4899`) → alerta, atraso, aborto.
  - `neon-orange` (`#FB923C`) → atenção, OS programada para hoje.
- **Texto** em branco com cascatas de opacidade (`white/90` → `white/40`),
  para criar hierarquia sem precisar trocar de cor.

### Glass morphism consistente

Componentes reutilizáveis (`GlassCard`, panels modais, headers sticky)
aplicam `backdrop-blur-xl` sobre fundos semi-transparentes, com bordas
hairline em `white/5–10%`. O efeito não é genérico: ele cria a
sensação de que os painéis estão "flutuando acima do fundo vivo" do
dashboard.

### Tipografia

- Interface em sans-serif do sistema.
- **Números em `font-mono` + `tabular-nums`** sempre que representam
  tempo ou contagem, para manter a leitura estável enquanto os valores
  mudam em tempo real. Timer piscante com caracteres alinhados é um
  dos detalhes que mais "vendem" a interface.
- Labels de fase em `uppercase tracking-wider` para o clima industrial.

---

## Sistema de movimento

Animação nunca é enfeite — é feedback funcional. O projeto usa
Framer Motion + keyframes CSS dedicadas, e todas as animações
respeitam `prefers-reduced-motion`.

### Glows que comunicam

- **`in-progress-glow`** (ciclos/OS em andamento): halo ciano pulsante
  de 2.2s, em torno do card inteiro. Você entra numa lista e
  imediatamente vê *o que está vivo*.
- **`overdue-glow` / `overdue-card-glow`** (atrasado): mesma ideia em
  rosa-choque de 1.8s — mais rápido, mais urgente.
- **`scheduled-today-glow`** (OS do dia): laranja, ritmo calmo —
  lembrete, não urgência.
- **`phase-active-glow`** (segmento ativo da barra de fases): halo
  verde-neon pulsando, com inset brilhante, confinado ao segmento.
- **`phase-label-breathe`** (nome da fase atual): **respiração lenta
  de 3.6s** que anima opacidade e text-shadow simultaneamente. É o
  detalhe mais "cinematográfico" da interface — o texto literalmente
  respira.

### Animação funcional

- Cards entram com spring staggered (delay por índice), saem com
  fade + scale discreto. Nunca >150ms para a saída.
- Timers ao vivo usam `AnimatePresence` por segundo/minuto para
  dar um tick visual sem tremer o layout (graças ao `tabular-nums`).
- Transições de layout (`layout` prop do motion) suavizam reordenações
  quando o bus de tempo real invalida a lista.

---

## Componentes de destaque

### 1. **CyclePhaseBar** — barra segmentada de fases

O protagonista da interface. Substitui a típica barra linear de
progresso por uma **barra dividida em segmentos proporcionais às
fases planejadas do ciclo** (ex.: Pré-vácuo → Aquecimento →
Esterilização → Secagem → Resfriamento).

- Fases são definidas no Odoo via JSON no modelo `afr.cycle.features`
  (`{"pre-vacuo": 5, "aquecimento": 12, ...}` em minutos), então é
  configurável por receita — sem código.
- Cada segmento tem largura proporcional à sua duração.
- Estados visuais por segmento:
  - **Concluída**: verde-neon fosco (`neon-green/25`).
  - **Atual**: verde-neon sólido com o halo `phase-active-glow`, um
    **fill interno branco-verde animado** crescendo conforme o tempo
    avança *dentro* da fase, e uma varredura `phase-shimmer` cruzando
    o segmento a cada 2.6s.
  - **Futura**: cinza-azul com borda tracejada.
- Três linhas na versão `full` (detalhe e lista de ciclos em andamento):
  - **Nome da fase** em cima (com `phase-label-breathe` na ativa).
  - Barra colorida no meio.
  - **Tempo planejado** embaixo, tipografia maior (~16 px).
- Versão `compact` (cards): apenas a barra fininha de 12 px, sem labels.
- **Fallback inteligente**: se a receita ainda não tem fases
  configuradas, o componente renderiza a barra clássica de progresso
  linear — nada quebra.

### 2. **Tempo de ciclo ao vivo**

No detalhe, o campo "Duração" vira um **timer mono-espaçado
verde-neon** atualizando a cada segundo enquanto o ciclo está em
andamento. Formato `Xh YYmin ZZs (em andamento)`. Junto da barra de
fases, o cabeçalho mostra `MM:SS / MM:SS` com o elapsed pulsando.

### 3. **Modo Dashboard**

Clique no botão flutuante (canto superior). A sidebar sai com
animação spring, todos os `max-w-*` das páginas caem para 100% e a
interface **ocupa a tela inteira** — ideal para TVs de sala de
controle ou monitores widescreen. Preferência persiste no browser.

### 4. **Sincronismo em tempo real**

Todo evento de `create`/`update` em Ciclos e OS no Odoo dispara uma
notificação no `bus.bus` via PostgreSQL `pg_notify`. Um bridge no
Next.js traduz WebSocket → SSE (pra evitar cross-origin) e o React
Query invalida caches automaticamente. **O operador não precisa dar
F5 nunca** — a lista se reorganiza sozinha, os glows mudam sozinhos,
os timers continuam correndo.

### 5. **Sidebar adaptativa**

No topo, a **logo e nome da empresa** (puxados do `res.company` do
Odoo em base64). No rodapé, a marca do produto e o usuário ativo.
Em mobile, vira drawer com overlay blur.

### 6. **Galeria de estados por card**

Cada card de ciclo/OS combina badges, glows e meta-info com
hierarquia clara:

- Status badge com cor semântica.
- Chips discretos para assinatura, resultado IB, materiais, atraso.
- Hover revela um "Ver detalhes" inferior com gradiente ciano.
- Click → transição suave pra página de detalhe com header sticky
  e navegação prev/next por contagem.

---

## Princípios de design em prática

1. **Sinal > ruído**: cada elemento visual só está lá porque comunica
   um estado operacional. Se você remover e ninguém sentir falta, era
   decoração.
2. **Dark-first, mas nunca preto puro**: os fundos têm profundidade e
   cor. Preto chapado seria chato e cansa a vista em sala 24/7.
3. **Números sempre mono**: tempo, contagem, lote. A interface precisa
   ser "olhada de longe" e números dançando quebram isso.
4. **Animação com propósito**: pulsar = ativo, respirar = atenção
   contínua, shimmer = progresso linear dentro do segmento. Nunca
   "só porque ficou bonito".
5. **Configurável via ERP, não via código**: fases, receitas, tipos
   de ciclo — tudo vem do Odoo. O front-end é **pura apresentação**
   em cima de um schema vivo.
6. **Graceful degradation**: se o backend ainda não tem um campo
   novo (p. ex. `phases_planned`), a UI cai pra versão simples.
   Nunca quebra.

---

## Stack

- **Next.js 14** (App Router, Server Components onde faz sentido).
- **TypeScript** estrito, tipos compartilhados entre hooks/componentes.
- **Tailwind CSS** + tokens customizados de cor/glow.
- **Framer Motion** para animações de layout e entrada/saída.
- **React Query** para cache, invalidação e refetch inteligente.
- **Zustand** para preferências de UI (modo dashboard, filtros, etc.).
- **Lucide** como família de ícones — traço fino, coerente com a
  linguagem.
- **SSE bridge Node** conectando ao `websocket` gevent do Odoo 16.

---

## O que mostrar no pitch

- Um **ciclo em andamento** na listagem, card pulsando ciano, barra
  segmentada compact embaixo, badge de estado.
- O **detalhe desse ciclo**, com barra `full` — nomes respirando em
  cima, segmento atual com fill crescendo e shimmer passando, tempos
  grandes embaixo, timer ao vivo no cabeçalho.
- **Entrar em modo dashboard** — sidebar desliza pra fora, conteúdo
  estica pro widescreen. É o momento "uau".
- **Atualizar um registro direto no Odoo** — e ver o card correspondente
  se reorganizar no front sem reload.

---

## Para o time de design iterar

Pontos abertos / oportunidades:

- Uma **visão "parede de TVs"** — um modo que mostra apenas os ciclos
  em andamento, ampliados, com a barra `full` ocupando largura
  cheia por ciclo.
- **Gráfico ao vivo** de temperatura/pressão inline no card durante o
  ciclo (hoje o gráfico aparece só no detalhe).
- **Transições entre estados** (pausado → em andamento → concluído)
  com micro-animação dedicada no próprio card, não só no badge.
- **Paleta opcional para daltônicos** — o par verde/rosa é central na
  semântica; uma paleta azul/amarelo seria um bom complemento.
- **Sonic cues** opcionais para eventos críticos (atraso, aborto),
  com toggle no perfil do usuário.

O ponto de partida é sólido — dark, neon, vivo, responsivo, em tempo
real. O próximo salto é transformar isso num produto que um operador
de sala de controle **prefere** usar a qualquer sistema legado.
