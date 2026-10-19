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

101 hand-authored clauses (63 facts, 38 rules) over a fixed vocabulary of 25
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
| `/database` | Browse the knowledge base: every hand-authored clause and its evidence, plus a review queue for approving or rejecting LLM-formalized hadith clauses. |
| `/console` | A Prolog console. Type a raw goal, optionally assume circumstances, and get every solution with its proof tree, a filterable step-by-step search trace, and where a failed query stalled. No LLM involved, so it works without an API key. |
| `/cases` | A ledger of past resolved questions. |
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
pnpm test             # 398 tests
pnpm lint
```

You'll need a `GROQ_API_KEY` in `.env` for the question-answering pipeline on
`/study` — it's the only external call the engine depends on, and only for
translating the question in and narrating the answer out. The reasoning itself
never leaves the machine, and `/console` runs it without any key at all.

To grow the knowledge base:

```bash
pnpm scrape:hadith tirmidhi 1 50      # scrape hadiths 1-50 from a collection
pnpm formalize:hadith 20              # run 20 pending hadiths through formalization
```

Formalized clauses land in the review queue at `/database` — nothing is added
to live queries automatically.

## Known limitations

- **Coverage is the binding constraint.** The engine and the weighing logic
  are real and tested; the knowledge base is 101 clauses over eight domains. A
  question outside them says so rather than guessing, which is the intended
  behaviour but is still a gap.
- **No negation as failure, on purpose.** The engine cannot conclude anything
  from the absence of evidence. That rules out presumptive principles like
  *al-asl fi'l-ashya' al-ibaha* (the default in things is permissibility),
  since under negation-as-failure "nothing in the corpus forbids this" would
  silently become "this is permitted" — the KB's own gaps served as rulings.
  Every rule fails closed instead.
- **Madhhab-neutral.** Inter-school variation isn't modelled. The madhhab and
  strictness controls on `/study` are recorded with the question and change
  nothing the engine derives; the answer says so. Every applicable concession
  is applied, with the original ruling shown beside it.
- **Reconciliation follows the majority.** A specific text qualifying a
  general one (*jam'*) is applied after abrogation and before any preference
  between them (*tarjih*), so a probable specific text can qualify a certain
  general one. The Hanafi view, that a certain general text can only be
  specified by something as certain, isn't modelled.
- **Concessions are modelled as applying, not as extending.** The engine
  decides whether a concession is available. How far it reaches — *al-darura
  tuqaddar bi-qadariha* — is not modelled, and neither are the classical
  thresholds of travel distance or duration — the numeric builtins exist for
  that, but the grounding stage does not yet extract distances.
- **Not a mufti.** It answers what the clauses in it entail. That is a
  different thing from what you should do.
