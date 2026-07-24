/**
 * The clause store the prover resolves against.
 *
 * Holds only logic. Everything juristic — which hadith a clause came from,
 * how strong its chain is, whether it is `amm` or `khass` — lives in the
 * separate evidence store, keyed by clause id. The prover therefore cannot
 * prefer a clause because it looks authoritative; weighing happens after the
 * proofs exist, in the tarjih layer, where it can be shown to the user.
 */

import { literalKey, predicateKey } from "../logic/types";
import type { Clause, Literal, PredicateKey } from "../logic/types";

export class KnowledgeBase {
  /**
   * Clauses bucketed by predicate/arity. Without this, every goal would scan
   * the whole store; with thousands of formalised hadiths that is the
   * difference between a responsive query and a timeout.
   */
  private readonly index = new Map<PredicateKey, Clause[]>();
  private readonly byId = new Map<string, Clause>();

  constructor(clauses: readonly Clause[] = []) {
    this.addAll(clauses);
  }

  add(clause: Clause): this {
    if (this.byId.has(clause.id)) {
      throw new Error(
        `duplicate clause id ${JSON.stringify(clause.id)}; ids must be unique to join evidence correctly`
      );
    }
    this.byId.set(clause.id, clause);
    const key = literalKey(clause.head);
    const bucket = this.index.get(key);
    if (bucket) bucket.push(clause);
    else this.index.set(key, [clause]);
    return this;
  }

  addAll(clauses: readonly Clause[]): this {
    for (const c of clauses) this.add(c);
    return this;
  }

  /** Candidate clauses whose head could match this goal. */
  clausesFor(goal: Literal): readonly Clause[] {
    return this.index.get(literalKey(goal)) ?? [];
  }

  byClauseId(id: string): Clause | undefined {
    return this.byId.get(id);
  }

  get size(): number {
    return this.byId.size;
  }

  /** Every predicate/arity defined, for diagnostics and KB linting. */
  predicates(): PredicateKey[] {
    return [...this.index.keys()].sort();
  }

  /**
   * Body goals that no clause head can ever satisfy.
   *
   * Almost always a typo or an arity slip in hand-authored KB source. Such a
   * rule fails silently and invisibly — it simply never fires — so surfacing
   * these is the difference between a KB that is wrong and one that is
   * knowably wrong.
   */
  danglingReferences(): { clauseId: string; goal: PredicateKey }[] {
    const defined = new Set(this.index.keys());
    const dangling: { clauseId: string; goal: PredicateKey }[] = [];
    for (const clause of this.byId.values()) {
      for (const b of clause.body) {
        const key = predicateKey(b.predicate, b.args.length);
        if (!defined.has(key)) dangling.push({ clauseId: clause.id, goal: key });
      }
    }
    return dangling;
  }
}
