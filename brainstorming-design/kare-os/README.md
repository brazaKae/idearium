# Handoff: Idearium Kare OS

## Overview
"Idearium" is an open-policy/civic-discourse periodical reimagined as a **retro Macintosh-style operating system**. Each "RFC" is a public-policy proposal; each "Lab" is a thematic working group (Cidade, Economia, Educação, Digital, Cultura, Trabalho); each "carta" is a signed letter responding to an RFC. The Kare OS direction renders the entire product as a System-1-era Mac desktop — windows, dialogs, dock, pixel icons — to communicate that **ideas are software, RFCs are programs in execution**.

The design is in Portuguese (pt-BR).

## About the Design Files
The files in this bundle are **design references created in HTML** — React prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns and libraries. If no environment exists yet, choose the most appropriate framework and implement the designs there.

The reference HTML uses inline JSX transpiled by Babel in the browser — that is purely a prototyping technique, not a production pattern.

## Fidelity
**High-fidelity.** All colors, spacing, type scales, and pixel-icon grids are final. Recreate the UI pixel-perfectly. The 13×13 pixel-icon grid in particular must be preserved exactly — see `kare-os-icons.jsx` for the binary grids.

## Design System Foundations

### Color tokens
| Token | Value | Usage |
|---|---|---|
| `--bg-desktop` | `#3B82E0` | Desktop wallpaper (cobalt blue) |
| `--bg-desktop-dot` | `rgba(255,247,224,0.18)` | 4px halftone dot pattern over desktop |
| `--bg-window` | `#FFF7E0` | Window content background (cream) |
| `--bg-window-soft` | `#FFFBEF` | Inset/secondary surfaces inside windows |
| `--ink` | `#0A0A0A` | Borders, text, all line work |
| `--accent-yellow` | `#FFD43B` | Selected row highlight, primary-button drop-shadow, warning callouts |
| `--shadow-window` | `4px 4px 0 #0A0A0A` | Hard offset shadow under every window |
| `--shadow-button` | `2px 2px 0 #FFD43B` | Primary-button shadow only |

### Typography
| Family | Source | Used for |
|---|---|---|
| `Press Start 2P` | Google Fonts | Hero/RFC display titles (`ENCHENTES.URBANAS.exe`), boot logo |
| `Pixelify Sans` | Google Fonts (400/500/600/700) | All UI chrome — menus, buttons, labels, body copy |
| `JetBrains Mono` | Google Fonts | Metadata key/value pairs, RFC IDs, status bar text, file paths |
| `Silkscreen`, `VT323` | Google Fonts | Available but used sparingly |

Type scale (px, no rem in the prototype):
- Hero / RFC display: `18–20` Press Start 2P, `letter-spacing: -0.02em`, `line-height: 1.3`
- Window title: `12` bold
- Menu bar: `13`
- Body: `13–14`, `line-height: 1.5–1.55`
- Metadata rows: `10`, with `JetBrains Mono` for values
- Status / footer / breadcrumb: `9–10`, `letter-spacing: 0.05em`

### Window chrome (the canonical primitive)
Every window in the OS is a `KareWindow` — see `kare-os-ui.jsx`:
- `border: 2px solid #0A0A0A`
- `box-shadow: 4px 4px 0 #0A0A0A` (no blur, no spread, hard offset)
- Background `#FFF7E0`
- **Title bar** is 22px tall, with **horizontal hairline stripes** painted as a CSS background:
  ```css
  background-image: repeating-linear-gradient(0deg, #0A0A0A 0px, #0A0A0A 1px, transparent 1px, transparent 4px);
  ```
- The window title is centered in a solid cream box (`background: #FFF7E0; padding: 1px 8px; font-weight: 700`) that sits on top of the stripes — this is the iconic System 1 look.
- Optional left close-box (14×14 cream square with 2px ink border) and right zoom/minimize boxes (filled and unfilled variants).

### Buttons (`btnStyle`)
- Default: `background: #FFF7E0; color: #0A0A0A; border: 2px solid #0A0A0A; padding: 3px 12px; font-size: 11; font-weight: 700; font-family: 'Pixelify Sans'`
- Primary: same but `background: #0A0A0A; color: #FFF7E0; box-shadow: 2px 2px 0 #FFD43B`

### Selection / highlight
The selected row in any list (Lab Finder, RFC list) gets `background: #FFD43B` (yellow). No subtle hovers — this is a 1-bit OS, things are either on or off.

### Backgrounds
The desktop is **always** rendered with this combo (don't omit either layer):
```css
background: #3B82E0;
background-image: radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0);
background-size: 4px 4px;
```
This produces the classic Kare halftone wallpaper. Inside windows, never apply the dot pattern.

### Pixel icons
17 icons live in `kare-os-icons.jsx` as **13×13 binary grids** (arrays of `0`/`1`). The `<Icon>` component renders them as SVG `<rect>` cells at a configurable `scale` (default 3, so 39×39 px output). **Do not** rasterize them, recreate them, or feed them to a vector tracer — port the binary arrays verbatim and render with rect cells. Set `image-rendering: pixelated` on the SVG. Available icons: `floppy, mac, bomb, doc, folder, trash, brain, clock, stamp, envelope, feather, city, scale, book, flag, hand, apple`.

## Screens / Views

The handoff has 8 artboards arranged in 4 sections.

### 1. Boot screen (`BootScreen`)
- 900×680 viewport
- Solid cobalt `#3B82E0` background with 4px halftone dot overlay
- Center-stacked, vertical gap 30px:
  - HappyMac icon (`mac` glyph, scale 6, white fill)
  - "IDEARIUM" wordmark in Press Start 2P, 36px, white, hard `text-shadow: 4px 4px 0 #000`
  - "Bem-vindo ao Idearium" + blinking underscore (animation `blink-soft 1s infinite`)
  - 300×14 progress bar: 2px white border, inner fill at 72% painted with diagonal-stripe pattern (`repeating-linear-gradient(90deg, #FFF7E0 0 4px, transparent 4px 8px)`)
  - Caption: "carregando 64 RFCs · 12 labs · 412 cartas · system 4.7 ©2026" in JetBrains Mono 11, opacity 0.7
- Bottom-left: "v.4.7"; bottom-right: "licenciado para: leitor"

### 2. Desktop (full) (`Desktop`)
- 1280×800
- Top **menu bar** (`MenuBar`, 22px tall, ink-bordered bottom): apple icon · "Idearium" (bold) · Arquivo · Editar · Exibir · Lab · RFC · Janela · right-aligned "Quinta · 14:32 · 64 RFCs ativos"
- **Left desktop icons**, x=28, vertical gap 102px starting y=48: Lab.Cidade (`brain`), RFCs (`folder`), Manifesto (`doc`), Arquivo (`floppy`)
- **Right desktop icons**, x=1170: Pauta (`clock`), Carimbos (`stamp`), Polêmicas (`bomb`), Vetadas (`trash`, **selected** — has a translucent cream rectangle behind it and a solid cream label box with cobalt text)
- **Four overlapping windows** (visible z-order matters):
  1. RFC viewer (620×400 at 150,56) — see screen 3
  2. Lab.Cidade list (420×280 at 780,86) — small Lab Finder
  3. Aplicar Carimbo (300×220 at 200,480) — stamp dialog
  4. Carta · Sem título (380×260 at 620,420) — compose mini
- **Dock** centered at the bottom (`bottom: 14`): cream rounded box `border: 2px ink, shadow 4px 4px 0 ink`, `padding: 6px 12px`, gap 14, containing 8 icons at scale 2: brain, folder, doc, feather, envelope, stamp, clock, mac

### 3. RFC viewer (`RFCWindow`)
Standalone artboard 760×560 — the same window as in the desktop but at full attention.
- Wrapped in `KareWindow` titled "RFC-0011 — Enchentes urbanas e infra cinza"
- Two-column body: `1fr / 220px`, gap 18, padding `18px 22px`
- **Left column**:
  - Display title in Press Start 2P 18px, two lines: `ENCHENTES.` / `URBANAS.exe`
  - Yellow stamp pill: `background: #FFD43B; border: 1px solid ink; padding: 4px 8px; font-family: JetBrains Mono; font-size: 11`, content `"CARIMBO: EM DISCUSSÃO · 14 dias abertos"`
  - Body paragraph at 14px, `line-height: 1.55`
  - **Proposal box**: cream-soft (`#FFFBEF`), 1px ink border, padding 10. Header `// proposta em 3 passos`. Three numbered items, gap via `<br/>` or items.
  - **Pull-quote**: `background: #FFD43B; border-left: 3px solid ink; padding: 8px 10px; font-style: italic`. Text: *"se a chuva é o teste, a calçada é a interface. e nossa interface está obsoleta."* — m. brando, lab.cidade
- **Right column** (METADADOS panel):
  - Section header: black bar, cream text, centered, uppercase, letter-spacing 0.05em
  - 7 key/value rows (`autor`, `lab`, `status`, `aberto há`, `cartas em pé`, `endorses`, `tags`) — keys 60% opacity, values bold; each row separated by a 1px dotted ink line
  - Engagement chart: 180×40 SVG line chart with 0.15-opacity ink fill below the line; inset axis labels `04.04` / `hoje`
  - 4 stacked action buttons: "+ escrever carta", "★ endossar", "↗ compartilhar", and primary "aplicar carimbo"

### 4. Lab Finder (`LabFinder`)
- 760×560, wrapped in `KareWindow` titled "Lab Finder"
- Header row: "6 laboratórios encontrados" (bold) + two sort buttons ("nome ↓" default, "atividade" primary)
- Column headers (10px, opacity 0.6): icon · nome · RFCs · membros · status
- 6 rows, 5-column grid `auto 1fr auto auto auto`:
  - Lab.Cidade (`city`, 22 RFCs, 14 members) — **highlighted yellow**
  - Lab.Economia (`scale`, 18, 9)
  - Lab.Educação (`book`, 14, 11)
  - Lab.Digital (`floppy`, 11, 7)
  - Lab.Cultura (`feather`, 9, 6)
  - Lab.Trabalho (`hand`, 7, 8)
- Each row: lab name (13 bold) + path (`~/labs/lab-cidade` in JetBrains Mono 9, opacity 0.6); RFC and member counts in JetBrains Mono 12; status = pulsing 8×8 ink dot (`animation: blink-soft 2s infinite`) + "ativo" 10
- Footer: "81 RFCs · 55 membros · 6 laboratórios" + hint `> clique 2x para abrir`

### 5. Stamp dialog (`StampDialog`)
- 520×420 artboard, dialog centered (380×340)
- `KareWindow` with `tools=false` (no close box, no zoom box) — modal dialog
- Title: "Aplicar Carimbo · RFC-0011"
- Top: `stamp` icon at scale 3 + 2-line caption "Você está prestes a carimbar:" / "RFC-0011 · Enchentes urbanas · m. brando"
- "SELECIONE O CARIMBO" header (10px, letter-spacing 0.05em)
- 2×3 stamp grid. Each card: 2px ink border, padding 8×10, font-size 11 bold, letter-spacing 0.05em. **Selected** ("EM DISCUSSÃO") gets `background: #0A0A0A; color: #FFF7E0` and the inner checkbox switches to a yellow fill.
- Stamps: EM DISCUSSÃO (selected), APROVADA, VETADA, URGENTE, REVER, ARQUIVADA
- Yellow warning callout: `background: #FFD43B; border: 1px ink; font-size: 10`, copy: "**⚠ atenção:** carimbar uma RFC é uma ação editorial. Será registrado em log público com seu nome e horário."
- Footer-right buttons: "cancelar" (default) + "aplicar carimbo" (primary)

### 6. Compose window (`ComposeWindow`)
- 760×560 artboard
- `KareWindow` titled "Nova RFC · sem título.rfc"
- Top toolbar (`borderBottom: 1px dashed ink`, `padding-bottom: 8`): `B`, `I`, `H1`, `H2`, `" "`, `<>`, `fleuron`, `· lista`, spacer, `↶`, `↷` — all default-style buttons
- Two-column body `1fr / 180px`:
  - **Editor**: cream-soft surface (`#FFFBEF`), 1px ink border, padding `12px 16px`. Editable `<input>` for title (Press Start 2P 18, transparent bg, no border). Subtitle input (JetBrains Mono 11, opacity 0.7) under a 1px dashed separator. Body text at 13px, `line-height: 1.6`, ending with a blinking caret (`animation: blink-soft 1s infinite`).
  - **Side panel**: "RASCUNHO" black-bar header, 5 metadata rows (autor=você, lab=economia, words=247, auto-save=há 4s, versão=v.0.3). Then a "checklist" box with 5 items (3 ticked: título, 3+ parágrafos, pelo menos 1 citação). Bottom: "salvar rascunho" (default) + "publicar RFC" (primary).
- Status bar at bottom (`borderTop: 1px ink`, JetBrains Mono 9): "linha 18 · col 24" / "auto-save ativo" / "plain text · markdown"

### 7. About box (`AboutBox`)
- 520×420 artboard, modal centered (380×340), `tools=false`
- HappyMac icon scale 4
- "IDEARIUM" Press Start 2P 20px, letter-spacing -0.02em
- "System 4.7 · build 2026.04" 11px
- Tagline (opacity 0.7, line-height 1.5): "Periódico aberto." / "Um sistema operacional para ideias."
- Stats block (1px dashed top border, font-size 10, line-height 1.6): "64 RFCs ativas · 412 cartas trocadas / 6 laboratórios · 55 membros / licenciado para: leitor"
- Footer buttons: "créditos" + "OK" (primary)

### 8. Icon library (`IconLibrary`)
- 1100×620 artboard
- Cream `#FFF7E0` background, 30/36 padding
- Title "BIBLIOTECA DE ÍCONES" in Press Start 2P 18
- Caption (13, opacity 0.7): "17 glifos 13×13 px, desenhados em estilo Susan Kare. Todos rendered em SVG, sem assets externos."
- 6-column grid, every cell has `border-right: 2px ink; border-bottom: 2px ink`, with the outer container also providing top+left borders, so the grid reads as one heavy table. Cell padding `18px 14px`. Each cell: icon (scale 4) + label (11 bold, letter-spacing 0.05em) + technical name (9, opacity 0.5).
- Footer chips (11, opacity 0.7): "★ todos exportáveis em SVG/PNG" / "★ 13×13 pixel grid" / "★ sistema de uma única cor"

## Interactions & Behavior

The HTML prototype is mostly static, but the **intended behavior** in production:

- **Window dragging**: title bars are draggable handles. Clicking the close box (left) hides the window; the zoom box (right, filled black) maximizes within the desktop bounds.
- **Z-order**: clicking any window brings it to the front and updates its title-bar stripe pattern (active window has stripes; inactive windows show a plain cream title bar). The prototype renders all windows as if active — implement the inactive variant.
- **Desktop icons**: single click selects (cream halo + cream label box with cobalt text). Double click opens the corresponding app/window.
- **Lab Finder rows**: same pattern — single click highlights yellow, double click opens that Lab's window.
- **Stamp dialog**: clicking a stamp card moves the selection state (only one selected at a time). "aplicar carimbo" closes the dialog and writes a stamp pill onto the target RFC.
- **Compose window**:
  - The blinking caret is purely decorative in the prototype; in production this is a real `<textarea>`/contenteditable.
  - Auto-save fires every few seconds and updates the "auto-save: há Xs" row.
  - Checklist items tick automatically as the writer satisfies them (e.g., adding a quote ticks "pelo menos 1 citação").
- **Boot screen**: the progress bar should animate from 0% to 100% over ~2.5s, then dismiss into the Desktop.
- **Animations**:
  - `@keyframes blink-soft { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0; } }` — applied to caret characters and Lab Finder activity dots.
  - `@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` — defined but unused in current artboards; reserve for any "loading" indicator.

## State Management

State variables the front-end needs:

- `windows: Window[]` — list of open windows with `{ id, app, title, x, y, w, h, zIndex, active, minimized }`
- `selectedDesktopIcon: string | null`
- `selectedLab: string | null`
- `currentRFC: RFC` (for the RFC viewer window)
- `compose: { title, subtitle, body, lab, words, savedAt, version, checklist }`
- `stampDialog: { open: bool, targetRFCId, selectedStamp }`
- `boot: { progress: number, complete: bool }`

Data shapes:
- **RFC**: `{ id, code (e.g. "RFC-0011"), title, displayTitle, subtitle, body, authorId, labId, status: "discussão"|"aprovada"|"vetada"|"em_pauta"|"arquivada"|"urgente", openedAt, days, lettersCount, endorses, tags[], engagement: { date, value }[] }`
- **Lab**: `{ id, name, slug, icon (one of the 17), rfcCount, memberCount, active }`

## Design Tokens

```js
export const tokens = {
  color: {
    bgDesktop: '#3B82E0',
    bgWindow: '#FFF7E0',
    bgWindowSoft: '#FFFBEF',
    ink: '#0A0A0A',
    accentYellow: '#FFD43B',
  },
  shadow: {
    window: '4px 4px 0 #0A0A0A',
    primaryBtn: '2px 2px 0 #FFD43B',
  },
  border: {
    window: '2px solid #0A0A0A',
    inner:  '1px solid #0A0A0A',
    dashed: '1px dashed #0A0A0A',
    dotted: '1px dotted #0A0A0A',
  },
  font: {
    display: "'Press Start 2P', monospace",
    ui:      "'Pixelify Sans', monospace",
    mono:    "'JetBrains Mono', monospace",
  },
  size: {
    titleBar: 22,
    menuBar:  22,
    iconScale: { sm: 2, md: 3, lg: 4, xl: 6 },
  },
  pattern: {
    halftone: 'radial-gradient(circle at 1px 1px, rgba(255,247,224,0.18) 1px, transparent 0) 0 0 / 4px 4px',
    titleStripes: 'repeating-linear-gradient(0deg, #0A0A0A 0px, #0A0A0A 1px, transparent 1px, transparent 4px)',
  },
};
```

## Assets

No external image assets. Everything is:
- **SVG** — pixel icons (binary grid → `<rect>` cells) and small charts.
- **Web fonts** — loaded from Google Fonts: Press Start 2P, Pixelify Sans, JetBrains Mono, Silkscreen, VT323.

If your codebase already self-hosts fonts, swap the `<link>` tags for whatever pipeline you use; the family names are standard.

## Files in this bundle

- `Idearium - Kare OS.html` — entry point. Wires React + Babel + the design canvas + the two component bundles.
- `kare-os-icons.jsx` — `ICONS` map (17 binary 13×13 grids), `<PixelGrid>`, `<Icon>`, `<DesktopIcon>`, `<IconLibrary>`.
- `kare-os-ui.jsx` — `<KareWindow>`, `<MenuBar>`, `<BootScreen>`, `<Desktop>`, `<RFCWindow>`, `<LabFinder>`, `<StampDialog>`, `<ComposeWindow>`, `<AboutBox>`, `<Row>`, `btnStyle()`.
- `design-canvas.jsx` — pan/zoom canvas used to lay all 8 artboards out for review. **Not part of the production design** — drop this in production; it's just the presentation shell.

When porting, the natural component decomposition is:
- `<Window>` (was `KareWindow`)
- `<MenuBar>`, `<Dock>`, `<DesktopIcon>`, `<Icon>`
- One file per app: `<RFCViewer>`, `<LabFinder>`, `<StampDialog>`, `<ComposeApp>`, `<AboutBox>`, `<BootScreen>`
- A top-level `<DesktopShell>` that owns window state and renders them in z-order.

## Notes for the developer

- The prototype hard-codes content (RFC-0011 about urban flooding, etc.) for design clarity. Treat it as fixture data. Real content comes from the API.
- Keep the **2px / 4px / 8px** rhythm. Borders are 2px, internal hairlines are 1px, dot grid is 4px, title-stripe period is 4px. Don't drift to 3px or 6px — it breaks the OS feel.
- All hard-offset shadows are **non-blurred**. If your CSS-in-JS lib normalizes `box-shadow`, double-check it isn't injecting blur radii.
- The pixel icons must render with `image-rendering: pixelated` to stay crisp at any scale. If you generate retina assets, render them at 1× and let the browser scale.
- The product is in pt-BR. All copy strings are final; do not paraphrase.
