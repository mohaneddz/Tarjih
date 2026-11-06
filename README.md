![Tarjih](screenshots/cover.avif)

# Tarjih

Tarjih (ترجيح, "weighing") is an experiment in explainable Islamic legal
reasoning. Instead of asking an LLM to guess a fatwa, it takes a question,
converts it into a formal logical goal, and proves it against a hand-built
knowledge base using a real backward-chaining inference engine — the same
family of technique as classical Prolog/expert systems. When the evidence
conflicts, it resolves the conflict using the classical rules jurists
themselves use for weighing conflicting evidence (*al-murajjihat*), and only
then asks an LLM to explain the result in plain language.

The LLM never decides the ruling. It only translates the question into
something the engine can prove, and narrates the answer the engine already
computed.

## Tech stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Reasoning**

![Backward chaining](https://img.shields.io/badge/Backward--chaining_prover-7F2625?style=for-the-badge)
![Horn clauses](https://img.shields.io/badge/Horn--clause_KB-7F2625?style=for-the-badge)
![Murajjihat](https://img.shields.io/badge/Murajjihat_weighing-7F2625?style=for-the-badge)

**Data and AI**

![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge)
![gpt-oss-120b](https://img.shields.io/badge/gpt--oss--120b-412991?style=for-the-badge)
![Cheerio](https://img.shields.io/badge/Cheerio-E88C1F?style=for-the-badge)

**Tooling**

![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/app/01-landing.jpg" width="280"/><br/>Landing</td>
    <td align="center"><img src="screenshots/app/02-landing-two-systems.jpg" width="280"/><br/>Two systems, one answer</td>
    <td align="center"><img src="screenshots/app/03-landing-comparison.jpg" width="280"/><br/>Compared with a chatbot</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/app/04-study-verdict.jpg" width="280"/><br/>Study: verdict and premises</td>
    <td align="center"><img src="screenshots/app/05-study-proof-tree.jpg" width="280"/><br/>Study: proof tree</td>
    <td align="center"><img src="screenshots/app/06-study-interpretation.jpg" width="280"/><br/>Study: interpretation</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/app/07-study-sources.jpg" width="280"/><br/>Study: cited sources</td>
    <td align="center"><img src="screenshots/app/08-study-conflicts.jpg" width="280"/><br/>Study: conflicts and weighing</td>
    <td align="center"><img src="screenshots/app/09-study-dark.jpg" width="280"/><br/>Study in dark mode</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/app/10-console-solutions.jpg" width="280"/><br/>Console: solutions</td>
    <td align="center"><img src="screenshots/app/11-console-proof.jpg" width="280"/><br/>Console: proof</td>
    <td align="center"><img src="screenshots/app/12-console-trace.jpg" width="280"/><br/>Console: search trace</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/app/13-console-why-what-if.jpg" width="280"/><br/>Console: why it failed</td>
    <td align="center"><img src="screenshots/app/14-database-core-kb.jpg" width="280"/><br/>Knowledge base</td>
    <td align="center"><img src="screenshots/app/15-database-rules.jpg" width="280"/><br/>Knowledge base: rules</td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/app/16-cases.jpg" width="280"/><br/>Cases ledger</td>
    <td align="center"><img src="screenshots/app/17-saved.jpg" width="280"/><br/>Saved cases</td>
    <td></td>
  </tr>
</table>

## How it works

```
question
  → LLM grounds it into a goal, e.g. ruling(mistreat(aunt_maternal), H)
  → engine proves every way that goal can be derived from the knowledge base
  → if derivations disagree, they're weighed against each other
    (abrogation, then specific qualifies general, then certain beats probable, text beats analogy, ...)
  → LLM narrates the already-decided verdict and cites the real sources used
```

Every step is inspectable: which clauses fired, which source text backs each
one, and — when derivations disagree — exactly which rule decided it and why.

### The question supplies its own premises

A concession belongs to a person, not to an act. Eating carrion is forbidden;
eating carrion when you would otherwise die is not. Both are true, and the
difference is a fact about whoever is asking.

So facts about the asker are kept strictly out of the knowledge base and
injected per query as `circumstance/1` premises, drawn from a fixed
vocabulary. "Is eating carrion permitted?" and "may I eat carrion, I'm
starving?" ground to different goals and get different answers, and the
premise the concession rests on is shown above the verdict — it is the one
part of the result a reader can only check against their own situation rather
than against a text.

### Concessions are shown beside what they relax

When a verdict rests on something you said about yourself, the result also
shows the ruling *without* it — the original ruling (*'azima*) next to the
concession (*rukhsa*). "Permitted" for a traveller breaking the fast and
"permitted" as the general ruling on an act look identical otherwise.

### Why it failed, and what would change it

The prover records which goals it stalled on: not every failed branch, only
the *leaves* where no clause head matched at all, together with the rule that
needed them. That gives two things a bare "no derivation" cannot:

- **Where the reasoning stopped** — e.g. qiyas was tried but no *'illa* is
  recorded for this act.
- **What would change the answer** — a rule waiting on an unstated
  circumstance (`circumstance(travel)`) becomes "if you were travelling, the
  ruling would be *permitted*, via Qur'an 2:184". The engine confirms each one
  by re-running the question with that premise added, so a what-if is computed,
  never guessed.

### Two ruling axes

Some questions have two answers. "May I enter this contract" (al-hukm
al-taklifi — sinful or not) and "does this contract transfer ownership"
(al-hukm al-wad'i — valid, defective, or void) come apart routinely: a sale
can be forbidden to enter and still binding once entered. Where the knowledge
base speaks to both, both are reported.

## The knowledge base

280 hand-authored clauses (187 facts, 93 rules) over a fixed vocabulary of 25
predicates, plus five builtins. Each clause is a Horn clause in a small
Prolog-like syntax —

```prolog
ruling(mistreat(Relative), haram) :- instance_of(Relative, rahim).
ruling(Act, mubah) :- excepted(Act, R), necessity(R), circumstance(R).
ruling(New, H) :- illah(New, Illa), illah(Asl, Illa), dif(New, Asl), generalisable(Asl), ruling(Asl, H).
```

The builtins — `dif/2` and the numeric comparisons `gt/2`, `ge/2`, `lt/2`,
`le/2` — are **fail-closed**: a call the engine can't decide yet (an argument
still unbound) fails and is counted rather than guessed at, and the KB linter
rejects a rule that checks a variable before binding it.

— paired with the evidence that backs it: its source (Qur'an, hadith,
consensus, analogy, legal maxim, custom), authenticity grade, and the
attributes classical usul al-fiqh weighs on (general vs. specific, certain vs.
probable in transmission, certain vs. probable in indication, abrogating vs.
abrogated).

| Domain | Covers |
|---|---|
| `taxonomy.ts` | Class hierarchy and kinship; the transitive closure rules everything else chains through |
| `usul.ts` | Qiyas, and the two concession mechanisms (darura, mashaqqa) kept deliberately apart |
| `qawaid.ts` | Legal maxims |
| `scripture.ts` | Kinship duties, forbidden foods, the necessity exception |
| `intoxicants.ts` | Khamr and beyond — the domain where a stated ruling, a defining text, and an analogy sit side by side |
| `transactions.ts` | Riba, gharar, gambling, and the sales that are sound |
| `worship.ts` | Prayer, fasting, purification, and the concessions attached to each |
| `relations.ts` | Kinship standing, blocking the means, custom, presumption of continuity |
| `food.ts` | Sea carrion and locusts, the blood 6:145 qualifies, predators, donkeys and horse meat |
| `hajj.ts` | The obligation on the able, tawaf during menstruation, hunting in ihram |
| `zakat.ts` | Who owes zakat, and which payments discharge it |
| `family.ts` | Who may be married: mahram by blood, nursing and marriage; cousins; unlawful combinations |
| `conduct.ts` | Backbiting and lying and their exceptions; gold and silk |
| `prayer.ts` | Friday prayer (men and women), praying seated when ill, combining on a journey, witr and night prayer, wiping over khuffs, the mushaf and purity, whether a prayer without wudu counts, making up a missed prayer |
| `fasting.ts` | Eating forgetfully (the fast stands), kissing while fasting, pregnancy and nursing, the Eid fast (forbidden and void), 'Arafa, 'Ashura, Shawwal, Mondays and Thursdays, Friday alone |
| `marriage.ts` | Women of the Book, a non-Muslim husband, polytheists, a fifth wife, the waiting period — each with its validity; divorce, including during menstruation (forbidden, still effective); contraception; orphans and adoption |
| `ethics.ts` | Life and property, magic and fortune-telling, spying and mockery, salam, tattoos, contracts and oaths, gold and silver vessels, tobacco through the harm maxim, parents and the limit of obedience, slander, hijab, ihram restrictions |
| `trade.ts` | Sale of wine, swine and carrion; selling what one does not have (distinct from salam); hoarding, concealed defects, undercutting a sale |
| `animals.ts` | Livestock, fowl, fish, rabbit and dabb; birds of prey and more predators; the meat of the People of the Book; shellfish as a spread between the schools |
| `charity.ts` | Zakat al-fitr and voluntary charity |

Two ways clauses get added:

- **Hand-authored** — the core above, in `src/lib/kb/core/`. Every clause
  carries a note explaining what the text says and what the clause claims on
  its behalf, because reviewing a rule means asking whether the second really
  follows from the first.
- **Formalized from hadith** — hadiths are scraped from sunnah.com (which
  includes authenticity grading) and run through an LLM that proposes a
  candidate clause. Every candidate is validated against the fixed logical
  vocabulary before it's even stored, and it sits in a review queue — nothing
  an LLM proposes reaches a live query until a human approves it.

## Pages

| Page | What it's for |
|---|---|
| `/study` | The main interface. Ask a question, see the verdict, the proof tree, the premises taken from your question, the cited sources, and — if the evidence conflicted — exactly how it was resolved. |
| `/database` | Browse the knowledge base: every hand-authored clause and its evidence, in five views (cards, dev view for code only, titles, explanations, evidence; `?view=dev` links straight to one), plus a review queue for approving or rejecting LLM-formalized hadith clauses. |
| `/console` | A Prolog console. Type a raw goal, optionally assume circumstances, and get every solution with its proof tree, a filterable step-by-step search trace, and where a failed query stalled. No LLM involved, so it works without an API key. |
| `/cases` | A ledger of past resolved questions. |
| `/api/health` | Database, demo content and model configuration at a glance. |
| `/saved` | Cases bookmarked on this device (no accounts — kept in localStorage). |
| `/` | Landing page explaining the proof-of-concept and how the engine reasons. |

## Project layout

```
src/lib/logic/       terms, unification, the clause parser
src/lib/engine/      the backward-chaining prover, builtins, failure explanation
src/lib/kb/          predicate vocabulary, evidence model, the knowledge base itself
src/lib/tarjih/      conflict detection + evidence weighing
src/lib/pipeline/    question → goal → prove → weigh → narrate, and the console
src/lib/scrape/      the sunnah.com scraper
src/scripts/         CLI scripts: scrape hadiths, run them through formalization
```

## Running it

```bash
pnpm install          # also generates the Prisma client and creates prisma/dev.db
pnpm dev              # http://localhost:1919
pnpm test             # 453 tests
pnpm lint
```

You'll need a `GROQ_API_KEY` in `.env` for the question-answering pipeline on
`/study` — it's the only external call the engine depends on, and only for
translating the question in and narrating the answer out. The reasoning itself
never leaves the machine, and `/console` runs it without any key at all.

### Deploying (Vercel) and demo content

The database is a SQLite file. On Vercel the build creates it, seeds it, and
ships it with the server functions; at startup each instance copies it to the
writable `/tmp`. So a deployment always opens with the seeded demo cases, and
questions asked on the site are kept for as long as that instance lives — not
across redeploys. A hosted database is the step after this for real
persistence.

- The seed (`src/scripts/seed-demo.ts`) runs in the build when `VERCEL` is set
  and `GROQ_API_KEY` is available. It resolves the questions in
  `src/lib/demo.ts` through the real pipeline and formalizes a few hadiths from
  sunnah.com into the review queue. It never fails the build; run it locally
  with `pnpm seed:demo`.
- `GET /api/health` reports whether the database is there, how many cases and
  review items it holds, and whether the model is configured. Check it before
  a demo.
- Set `REVIEW_TOKEN` to require a reviewer token for approving, rejecting or
  revoking clauses (the review page asks for it once per tab). Unset, anyone
  can change the review queue.
- `/api/ground` and `/api/resolve` cap questions at 500 characters and
  rate-limit each IP (per server instance).

### Evidence strength

Every line of argument carries an evidence strength out of 100: the strength
of its weakest link, so a definitive Qur'anic text scores higher than a
probable hadith, a maxim, or an analogy. It is not a probability that the
verdict is right. The verdict is chosen by the weighing rules, and a specific
text can rightly prevail over a stronger general one.

Rules of inference — clauses that only restate what their premises establish,
such as "omitting what is wajib is haram" or the darura rule that is the
mechanism of 2:173 — are marked `inference` on their evidence. They are
skipped by the weakest link and looked through when a derivation is credited
to its source, so a certain obligation in the Qur'an reads as 100, not as the
rank of the usul rule that restates it.

When two *compatible* positions (makruh beside mubah, fasid beside batil) tie
on every rule, the position of the majority of schools is named first and
recorded as such in the trail; two *contradictory* rulings that tie are
reported as unresolved, never settled by a headcount.

To grow the knowledge base:

```bash
pnpm scrape:hadith tirmidhi 1 50      # scrape hadiths 1-50 from a collection
pnpm formalize:hadith 20              # run 20 pending hadiths through formalization
```

Formalized clauses land in the review queue at `/database` — nothing is added
to live queries automatically.

## Known limitations

- **Coverage is the binding constraint.** The engine and the weighing logic
  are real and tested; the knowledge base is 280 clauses over twenty domains, citing 133 distinct verses and hadith. A
  question outside them says so rather than guessing, which is the intended
  behaviour but is still a gap.
- **No negation as failure, on purpose.** The engine cannot conclude anything
  from the absence of evidence. That rules out presumptive principles like
  *al-asl fi'l-ashya' al-ibaha* (the default in things is permissibility),
  since under negation-as-failure "nothing in the corpus forbids this" would
  silently become "this is permitted" — the KB's own gaps served as rulings.
  Every rule fails closed instead.
- **Madhhab-aware only as a spread.** Where the schools differ by one step —
  the Hanafi *fasid* beside the majority's *batil* for a ribawi sale, the
  Maliki *makruh* on predators — both positions are in the KB, tagged with
  their schools, and the answer shows the other beside the verdict. Nothing
  lets you pick a school: the madhhab and strictness controls on `/study` are
  recorded with the question and change nothing the engine derives; the
  answer says so. Every applicable concession is applied, with the original
  ruling shown beside it.
- **Reconciliation follows the majority.** A specific text qualifying a
  general one (*jam'*) is applied after abrogation and before any preference
  between them (*tarjih*), so a probable specific text can qualify a certain
  general one. The Hanafi view, that a certain general text can only be
  specified by something as certain, isn't modelled.
- **Concessions are modelled as applying, barely as extending.** The engine
  decides whether a concession is available and what it leaves owed (the
  fast is made up, the elderly ransom it). How far it reaches is modelled in
  one place only — eating forbidden food past the need stays forbidden to the
  starving — and the classical thresholds of travel distance, the nisab, and
  the amount of nursing that makes kin are not: the numeric builtins exist
  for them, but the grounding stage does not extract quantities.
- **Each side is represented by its strongest line.** When two answers are
  weighed, each is represented by its strongest derivation. A weaker line on
  the same side that carries a specific text is not consulted on its own.
  No case in the current KB depends on it, but a group-level comparison
  would be more faithful.
- **Sub-goals are not weighed.** Only the ruling a query asks for goes
  through the murajjihat. A class-level claim that a later text overrides
  would keep firing for every rule chaining on that class, so overrides are
  written to meet at the ruling — which is why sea carrion is not classed as
  forbidden food and then excepted.
- **Not a mufti.** It answers what the clauses in it entail. That is a
  different thing from what you should do.
