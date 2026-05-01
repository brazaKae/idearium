# Idearium — Visão SSOT

> Documento canônico do projeto. Este é o **single source of truth** sobre o que Idearium é, o que não é, e por que existe.
>
> Tudo que estiver em conflito com este documento — incluindo brainstorms antigos, conversas anteriores, ou ideias soltas — deve ser ignorado.
>
> Versão 1.0 · 2026-04-30

---

## 1. Em uma frase

**Idearium é o espaço público onde ideias com potencial de impacto social viram propostas estruturadas (RFCs) e atraem voluntários dispostos a co-construí-las abertamente.**

---

## 2. Missão

Pôr fim à morte silenciosa de ideias boas.

Há gente com **repertório de problema** — vê o problema todo dia, conhece quem sofre, intuí a solução — mas não constrói. Há gente com **repertório de solução** — sabe programar, projetar, escrever, desenhar — mas vive desorientada sobre no que aplicar isso. Idearium é a infraestrutura que conecta esses dois repertórios sem precisar passar por gatekeeper comercial, fundo de investimento ou rede social.

---

## 3. Visão de longo prazo (5 anos)

Em 5 anos, Idearium é a **referência lusófona em civic tech aberta**: a plataforma onde fundações, universidades, coletivos e voluntários prototipam soluções para problemas locais. Funciona em pt-BR e en. Tem milhares de RFCs publicadas, centenas viraram código real, dezenas viraram organizações persistentes. É sustentado por apoiadores individuais e grants institucionais, **nunca por taxas sobre seus usuários**.

Idearium não vira startup. Idearium vira instituição.

---

## 4. Valores fundadores

| Valor | O que significa na prática |
|-------|---------------------------|
| **Abertura radical** | Todo conteúdo publicado em CC BY-SA 4.0. Nenhuma RFC tem "dono" após publicação; tem autor original com crédito permanente. |
| **Crédito compartilhado** | Quem propõe, quem comenta construtivamente, quem constrói — todos aparecem nos créditos da implementação final. Sem hierarquia de mérito. |
| **Pseudônimo respeitado** | Identidade real é sempre opcional. `@username` é a única coisa que pedimos. |
| **Sem mediação financeira** | A plataforma nunca toca dinheiro de transações entre usuários. Não há fee, não há revenue share, não há bounties intermediados. |
| **Voluntariado como base** | Builders contribuem porque querem, não porque são pagos. Quem quiser ser pago, faz fora da plataforma — e isso é ok. |
| **Sustento por apoio** | Modelo Wikimedia: doadores individuais + grants institucionais. Nunca usuário pagante. |
| **Estética editorial** | Não somos startup nem rede social. Somos mais perto de Wikipedia, IETF e arXiv do que de Product Hunt. |
| **Decisões públicas** | Governança transparente. Mudanças importantes são RFCs também. |

---

## 5. Modelo mental

### 5.1. Unidades primárias

- **Laboratório (Lab)** — recorte temático que organiza RFCs (e.g. *Lab. Educação*, *Lab. Cidades*). Não é silo — uma RFC pertence a um lab, mas qualquer pessoa transita entre eles.
- **RFC (Request For Comments)** — proposta de ideia formalizada. Ganha um número permanente ao ser publicada (`RFC-0007`). Tem autor, lab, status, corpo em markdown, idioma, e histórico de versões.
- **Inscrição (Enrollment)** — registro **leve** de que alguém quer contribuir numa RFC. Sem aprovação. Sem promessa. Quem se inscreve pode sair quando quiser, e a saída é pública.
- **Comentário** — mensagem na discussão linear de uma RFC.
- **Versão (RfcVersion)** — toda edição em uma RFC publicada gera entrada no histórico. RFCs evoluem, mas nada se perde.
- **Reporte** — qualquer usuário sinaliza conteúdo para revisão de maintainers.

### 5.2. Comportamentos, não papéis

A documentação anterior dicotomizava "creators" e "builders". Estava errado. **Idearium tem comportamentos, não classes de usuário**:

- **Propor** — escrever uma RFC.
- **Discutir** — comentar, refinar, contestar.
- **Construir** — se inscrever em uma RFC e contribuir com código, design, texto.

A mesma pessoa faz os três em momentos diferentes. Não há "perfil de creator" separado de "perfil de builder". Há `User` com `BuilderProfile` opcional — para quem quer ser **encontrável** como construtor disponível.

### 5.3. Identidade

**Pseudônima por padrão.** O `@username` é o identificador público canônico, exibido em toda parte. Campos `fullName` e `bio` são opcionais. Não pedimos documento, telefone, ou ligação a redes externas obrigatórias.

GitHub e Google são opções de **login**, não de identidade. Conectar GitHub não importa o nome real para a UI.

---

## 6. Fluxo canônico de uma RFC

```
                         ┌──────────────┐
                         │   Rascunho   │  só autor vê
                         │   (DRAFT)    │
                         └──────┬───────┘
                                │ publish
                                ▼
                  ┌───────────────────────────┐
                  │   RFC-XXXX publicada      │
                  │   IN_DISCUSSION           │ ◄── comentários, inscrições
                  └─────┬─────────────────────┘
                        │ primeiro builder se inscreve
                        ▼
                  ┌───────────────────────────┐
                  │   IN_BUILDING             │
                  │   tem builders ativos     │ ◄── updates de progresso
                  └─────┬─────────────────────┘
                        │ implementação publicada
                        ▼
                  ┌───────────────────────────┐
                  │   PUBLISHED               │
                  │   virou produto/projeto   │
                  └───────────────────────────┘

Estados terminais alternativos: ARCHIVED (sem atividade) — reversível.
```

Nada se deleta. Tudo é reversível. Estados expressam **a temperatura atual da ideia**, não seu valor.

---

## 7. Personas

### Luísa, 31, professora de bairro
Tem uma ideia faz 3 anos sobre uma biblioteca cooperativa entre vizinhos. Não programa. Idearium oferece a ela um lugar onde a ideia vira RFC concreta e atrai gente real, sem precisar de pitch ou conexão pessoal.

### Rafael, 28, dev backend
Já abandonou 4 side projects por falta de propósito. Quer fazer algo "que importa". Encontra `RFC-0011: Rastreamento Anônimo de Enchentes Urbanas`, com escopo já discutido por outras pessoas. Inscreve-se. Não está sozinho.

### Marina, 24, estudante de saúde coletiva
Não é dev e não pretende ser. Mas conhece o problema da farmácia solidária por dentro. Idearium oferece a ela uma forma de contribuir com **conteúdo** (RFCs, comentários estruturados) sem precisar virar tech.

### Coletivos / fundações / universidades
Encontram em Idearium uma forma de **publicar pautas como RFCs** e mobilizar voluntários sem manter infraestrutura própria de fórum, gestão e moderação.

---

## 8. Diferenciais

### 8.1. O que Idearium **É**
- Plataforma editorial-cívica de RFCs comunitárias
- Espaço de matchmaking voluntário entre proponentes e construtores
- Repositório aberto com licença livre (CC BY-SA 4.0)
- Bilíngue (pt-BR / en) desde o lançamento
- Bem de comum digital, não produto

### 8.2. O que Idearium **NÃO é**
- ❌ Não é Product Hunt (vitrine de produtos lançados)
- ❌ Não é IndieHackers (foco em lucro / MRR)
- ❌ Não é marketplace de freelancers
- ❌ Não é rede social com feed algorítmico
- ❌ Não é incubadora / aceleradora
- ❌ Não tem gamificação (pontos, badges, leaderboards, streaks)
- ❌ Não cobra de usuários (não tem premium tier)
- ❌ Não tem anúncios
- ❌ Não medeia transações financeiras
- ❌ Não pretende escalar para milhões de DAUs

---

## 9. Princípios de produto — anti-features

Lista de coisas que **não serão adicionadas** sem antes revisar este documento e a missão. Toda vez que alguém sugerir uma destas, a pergunta é: *"Em qual lógica de Idearium isso faz sentido?"*. Se não há resposta clara, está fora.

- Sistema de pontos com decay e multiplicadores
- Badges, achievements, troféus
- Leaderboard global ou por lab
- Tier premium ou paywall
- Revenue share, smart contracts, bounties intermediados
- Anúncios contextuais ou patrocinados
- Notificações de engagement estilo Instagram (likes, "alguém viu seu perfil")
- Feed algorítmico opaco
- "Verificação azul" / hierarquia de identidade
- Métricas de vaidade públicas (followers, profile views)

Esta lista é viva. Adicionar item exige consenso entre maintainers + RFC explicando por quê.

---

## 10. Decisões fundadoras

As 8 decisões críticas que travavam o início do projeto, agora resolvidas:

| # | Decisão | Resposta | Implicação |
|---|---------|----------|-------------|
| 1 | Visão A (marketplace) ou B (community labs)? | **B** | Visão A está completamente descartada. |
| 2 | Estratégias de login? | **email/senha + GitHub OAuth + Google OAuth** | Três providers desde o MVP final. Email/senha é o canônico. |
| 3 | RFCs editáveis após publicadas? | **Sim** | Toda edição gera entrada em `RfcVersion`. Histórico público. URL imutável. |
| 4 | Identidade real ou pseudônima? | **Pseudônima** | `@username` é canônico. `fullName` opcional. Sem verificação de identidade. |
| 5 | Moderação pré ou pós-publicação? | **Pós, com botão reportar** | Sem fila de aprovação. Maintainers respondem reportes. Suspensão é reversível, conteúdo histórico permanece anonimizado. |
| 6 | Comentários aninhados ou lineares? | **Lineares** (segue recomendação) | Schema simples, sem `parent_id` em comments. |
| 7 | Idiomas no MVP? | **pt-BR + en desde o início** | Interface bilíngue (i18n). Conteúdo (RFCs/comentários) tem campo `locale`. Tradução de conteúdo é opcional e comunitária. |
| 8 | Hospedagem? | **Serviço gerenciado** | Postgres gerenciado (Neon/Supabase/Railway) + app em Railway ou Fly.io. Dev local via `docker-compose`. |

---

## 11. Modelo de sustentabilidade

### Princípio
**O dinheiro nunca vem do usuário.** Idearium é gratuito para sempre, e gratuito significa gratuito — não freemium, não "gratuito com limitações".

### Fases

**0–6 meses (lançamento):** zero receita. Custo total ~$20–30/mês (Postgres gerenciado + Railway/Fly + domínio + email transacional). Pago do bolso.

**6–12 meses (apoiadores):** página pública de apoio via OpenCollective ou Liberapay. Transparência total dos custos. Meta realista: R$ 200–500/mês com 30–50 apoiadores. Cobre infra com folga.

**12+ meses (institucional):** aplicação para grants pequenos:
- Mozilla MOSS / Open Source Support
- Open Source Collective
- Fundações lusófonas com agenda de open source / civic tech
- Editais de extensão universitária

Realista: R$ 30k–80k em um ano se houver tração visível e relatório decente.

### Anti-modelos
- Cobrar dos usuários
- Tirar % de transações
- Vender dados ou anúncios
- Tier premium
- Patrocínio que comprometa neutralidade editorial

---

## 12. Identidade visual e tom

### Tipografia
- **Lora** — serifa, headlines e títulos de RFCs
- **Inter** — sans, corpo de UI e navegação
- **IBM Plex Mono** — monospace, metadados, identificadores (RFC-0007), nomes de usuário (`@luisa`)

### Paleta
| Cor | Hex | Uso |
|-----|-----|-----|
| Cream | `#FAFAF7` | Background principal |
| Card | `#FFFFFF` | Cartões e elementos destacados |
| Panel | `#F5F2EB` | Áreas secundárias |
| Ink | `#1C1C1B` | Texto principal |
| Muted | `#6B6560` | Texto secundário, metadados |
| Accent (Navy) | `#1E3A5F` | Links, CTAs, foco |
| Gold | `#C8A04A` | Detalhes ornamentais, números RFC |
| Rule | `#E5E2DB` | Bordas, divisórias |

### Glyphs dos labs
Caracteres usados como "selo" de cada laboratório:
- ◈ Lab. Educação
- ◇ Lab. Cidades
- ✚ Lab. Saúde
- ♪ Lab. Cultura
- ⌘ Lab. Tec. Cívica
- ◆ Lab. Econ. Solidária

### Tom de voz
- **Editorial e direto.** Frases curtas. Pontuação convencional. Nada de jargão de startup.
- **Levemente formal**, no estilo de RFC ou ensaio acadêmico — mas sempre acessível.
- **Microcopy memorável.** *"não precisa saber fazer. precisa só querer que aconteça."* É a frase âncora.
- **Sem emoji** na UI principal. Glyphs sim, emojis não.
- **Sem hype.** "Revolucionário", "game-changer", "o futuro de X" — fora.

---

## 13. Governança preliminar

### Co-criadores e mantenedores iniciais

Idearium é mantido por duas pessoas desde o início:

- **Kae Brazauskas** — backend, infraestrutura, modelagem de dados, este documento e `ROADMAP_BACKEND.md`.
- **Gabriele** — frontend, identidade visual, design da home (`brainstorming-design/editorial/baseline.html`), tom editorial e microcopy.

Não usamos o termo *founder* por escolha — soa startup. Aqui somos **co-criadores** e **mantenedores iniciais** de um bem comum digital. As decisões de produto, identidade e governança são tomadas em conjunto.

### Expansão
- Após primeiros 100 usuários ativos, considerar convidar 1–2 maintainers adicionais por escolha explícita.
- Critério: contribuição construtiva visível + alinhamento com este documento.

### Decisões
- **Produto, identidade e visão:** consenso entre Kae e Gabriele.
- **Backend / infra:** Kae lidera, alinhamento com Gabriele em decisões que afetam UX (shape de respostas da API, fluxos, performance).
- **Frontend / design / tom:** Gabriele lidera, alinhamento com Kae em decisões que afetam contrato com a API.
- **Moderação:** maintainers + processo de apelação documentado (suspenso pode contestar).
- **Adição de novo lab:** RFC pública discutida no `Lab. Meta` (a criar).
- **Mudanças neste documento:** RFC pública. Mudanças importantes não acontecem por decisão unilateral.

### Imutáveis
- Licença CC BY-SA 4.0 do conteúdo público
- Princípio de "sem mediação financeira"
- Princípio de pseudônimo respeitado

Estes três pontos não mudam sem refundação do projeto.

---

## 14. Glossário canônico

| Termo | Definição |
|-------|-----------|
| **Lab** | Laboratório temático. Recorte de domínio (Educação, Cidades, etc). |
| **RFC** | Request For Comments. Proposta de ideia formalizada. Tem número (`RFC-0007`), autor, lab, status, corpo em markdown, idioma. |
| **Inscrição (Enrollment)** | Registro leve de interesse em contribuir numa RFC. Sem aprovação, reversível. |
| **Builder** | Usuário com `Enrollment` ativa em uma ou mais RFCs. |
| **BuilderProfile** | Subperfil opcional. Marca o usuário como "encontrável" na lista de builders disponíveis (sidebar do mockup). |
| **Maintainer** | Usuário com permissão de moderação. Não é hierarquia — é responsabilidade. |
| **Átrio** | Nome interno da home/landing. |
| **Salão** | Layout de 3 colunas (sidebar esquerda + feed central + sidebar direita) do átrio. |
| **Glyph** | Caractere símbolo do lab (◈, ◇, etc). |
| **Locale** | Idioma do conteúdo (`pt-BR`, `en`). |

---

## 15. O que muda agora

### Arquivos do repositório
- `lixo/` foi removida. Tudo lá representava a Visão A descartada.
- Documentos vivos:
  - `VISAO.md` (este) — SSOT do projeto
  - `ROADMAP_BACKEND.md` — plano operacional do backend
  - `ANALISE_PROJETO.md` — análise estratégica (snapshot do momento do pivô; histórico)
  - `README.md` — apresentação pública (a atualizar conforme o projeto avança)
  - `brainstorming-design/editorial/baseline.html` — referência de design da home

### Próximos passos
1. **Backend (Kae):** iniciar `ROADMAP_BACKEND.md` Etapa 0 (setup esqueleto).
2. **Frontend (Gabriele):** confirmar stack final (Angular, Sveltekit, Next.js, etc) e abrir um `ROADMAP_FRONTEND.md` espelhando a estrutura do backend, com etapas alinhadas.
3. Em conjunto, escrever as primeiras 5–10 RFCs seed (uma por lab) — material de teste e de demonstração.
4. Atualizar `README.md` com tagline, créditos a Kae e Gabriele, e ponteiros para `VISAO.md`.

---

*Documento vivo. Mudanças significativas devem ser propostas por RFC pública após o lançamento.*
