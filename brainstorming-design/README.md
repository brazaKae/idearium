# Brainstorming de Design

> Arquivo vivo de explorações visuais do Idearium. Não é código de produção —
> é onde ideias de identidade, layout e marca foram experimentadas antes de
> uma direção ser escolhida e implementada em `apps/web/`.

## Estrutura

```
brainstorming-design/
├── editorial/                ← 5 explorações de direção editorial-cívica
│   ├── baseline.html         ← versão refinada com lente Emil Kowalski
│   ├── press.html            ← "Civic Press" — jornal cívico, multicoluna serifada
│   ├── codex.html            ← "RFC Codex" — documento técnico, mono-heavy
│   ├── atrium.html           ← "Atrium" — editorial arquitetônico, espaço generoso
│   └── periodico.html        ← "Periódico" — paper-skeuomorphism com grão SVG
│
└── kare-os/                  ← direção escolhida ✓ — System 1-era Mac OS reimagining
    ├── README.md             ← handoff doc original (Claude Web)
    ├── Idearium - Kare OS.html  ← entry point baseline
    ├── compare.html          ← navegador de variantes
    ├── kare-v1-sereno.html   ← variante: VT323 + paleta VISAO
    ├── kare-v2-phosphor.html ← variante: CRT terminal verde-fósforo
    ├── kare-v3-riso.html     ← variante: Silkscreen + zine print
    ├── kare-v4-workbench.html ← variante: Workbench + paleta original
    ├── design-canvas.jsx     ← shell pan/zoom dos artboards
    ├── kare-os-ui.jsx        ← componentes principais (8 telas)
    ├── kare-os-icons.jsx     ← 17 ícones pixel art 13×13
    ├── kare-os-logo.jsx      ← componente do logo final
    ├── kare-os-ui-v[1-4]-*.jsx ← componentes das 4 variantes
    ├── idearium-logo-final.svg ← LOGO OFICIAL (desenhado em Figma)
    ├── idearium-logo.svg     ← extração antiga (tentativa programática)
    └── logo-demo.html        ← demo de uso do logo
```

## Como abrir

Os arquivos `.jsx` são carregados via Babel inline no browser, o que exige
servir via HTTP local (não funciona com `file://` por causa de CORS):

```bash
cd brainstorming-design
python3 -m http.server 8000
# abrir http://localhost:8000/kare-os/Idearium%20-%20Kare%20OS.html
# ou    http://localhost:8000/editorial/baseline.html
```

## O que é direção escolhida vs arquivo histórico

- ✅ **`kare-os/`** — direção oficial. A versão original foi escolhida
  (não as variantes). Tudo aqui vai ser reimplementado em `apps/web/` com
  Astro + React. Ver `FRONTEND_DECISIONS.md` na raiz.
- 📦 **`editorial/`** — explorações arquivadas. **Não vão ser implementadas.**
  Ficam aqui pra referência caso futuras decisões precisem revisitar a
  abordagem editorial-cívica.

## Sobre o nome desta pasta

> "Brainstorming de design" é um nome provisório. O padrão na indústria
> de design/dev pra esse tipo de espaço varia:

| Termo | Quem usa | Conota |
|-------|----------|--------|
| **`design-explorations/`** | Linear, IDEO, Stripe | Processo iterativo de ideação |
| **`design-studies/`** | Mais acadêmico | Estudos formais comparativos |
| **`design-archive/`** | Mais comum em times maduros | Arquivo histórico de ideias |
| **`concepts/`** | Adobe XD, Figma | Conceitos antes de protótipo |
| **`prototypes/`** | Geral | Versões testáveis (geralmente high-fidelity) |
| **`mockups/`** | Anterior — limitado | Implica só artefato visual estático |
| **`brainstorming-design/`** | Atual — provisório | Quaisquer experimentos visuais |

**Recomendação minha**: quando for renomear pra padrão "permanente",
considera **`design-explorations/`** — é o termo mais comum em design teams
modernas e captura bem o espírito ("isto é exploração, não produto").
Mas a decisão é sua.

## Convenções de nomenclatura interna

Quando adicionar nova exploração visual:

1. **Pasta por direção/track**: cada conjunto coerente de mockups vai pra
   sua subpasta (ex: `editorial/`, `kare-os/`)
2. **Arquivos descritivos sem prefixo de versão na URL**: prefira
   `nome-da-direcao.html` em vez de `index.alt-X.html`
3. **`README.md` em cada subpasta** quando os arquivos exigem contexto pra
   serem entendidos (ex: kare-os tem README do handoff original)
4. **Não commitar dependências**: cada mockup é standalone (Tailwind via
   CDN, fontes via Google Fonts, JSX via Babel). Zero `node_modules/`
   nesta pasta

## Histórico

- 2026-04-30 — primeira home (`home/index.html`)
- 2026-05-01 — refinamento Emil + 4 alternativas editoriais (Press, Codex, Atrium, Periódico)
- 2026-05-01 — handoff Kare OS recebido + 4 variantes de fonte/paleta
- 2026-05-01 — direção Kare OS Original escolhida; logo finalizado em Figma
- 2026-05-01 — pasta renomeada de `mockups/` para `brainstorming-design/`,
  reestruturada em `editorial/` + `kare-os/`
