/**
 * Evidence metadata: what a clause came from and how strong it is.
 *
 * Kept strictly out of the prover. The prover reports which clause ids fired;
 * this store says what those clauses are worth. Separating them means the
 * search cannot be biased by a clause claiming authority, and the weighing is
 * a distinct, inspectable step the UI can show the user rather than a hidden
 * thumb on the scale.
 */

// ---------------------------------------------------------------------------
// Source classification
// ---------------------------------------------------------------------------

/**
 * Where a clause's authority comes from, in the usual order of recourse.
 * The numeric rank is consumed by the tarjih layer.
 */
export const EVIDENCE_KINDS = [
  "quran",
  "sunnah",
  "ijma",
  "qiyas",
  "qaida",
  "usul",
  "istihsan",
  "urf",
  "ontology",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_KIND_RANK: Record<EvidenceKind, number> = {
  quran: 100,
  sunnah: 90,
  ijma: 85,
  qiyas: 60,
  qaida: 55,
  usul: 55,
  istihsan: 45,
  urf: 40,
  /**
   * Definitional scaffolding — "an aunt is kin", "wine is intoxicating".
   * Carries no independent juristic weight; it only lets real evidence
   * connect, so it must never strengthen a conclusion on its own.
   */
  ontology: 0,
};

// ---------------------------------------------------------------------------
// Transmission strength (thubut)
// ---------------------------------------------------------------------------

export const HADITH_GRADES = ["mutawatir", "sahih", "hasan", "daif", "mawdu"] as const;
export type HadithGrade = (typeof HADITH_GRADES)[number];

export const GRADE_RANK: Record<HadithGrade, number> = {
  mutawatir: 100, // mass-transmitted; yields certainty
  sahih: 80,
  hasan: 65,
  daif: 25,
  mawdu: 0, // fabricated; must never support a ruling
};

export const GRADE_LABELS: Record<HadithGrade, { en: string; ar: string }> = {
  mutawatir: { en: "Mass-transmitted", ar: "متواتر" },
  sahih: { en: "Rigorously authentic", ar: "صحيح" },
  hasan: { en: "Good", ar: "حسن" },
  daif: { en: "Weak", ar: "ضعيف" },
  mawdu: { en: "Fabricated", ar: "موضوع" },
};

// ---------------------------------------------------------------------------
// Usul attributes — the inputs the murajjihat compare
// ---------------------------------------------------------------------------

/**
 * Certainty is two separate questions, and conflating them is a classic error:
 * a text can be beyond doubt in its transmission yet ambiguous in what it
 * indicates, or vice versa. Both are recorded so the tarjih layer can prefer,
 * say, a definitively-indicating hasan report over an ambiguously-indicating
 * sahih one.
 */
export type Certainty = "qati" | "zanni";

/** Generality: khass (specific) overrides amm (general) on the shared subject. */
export type Scope = "amm" | "khass";

/** Qualification: muqayyad (restricted) overrides mutlaq (unrestricted). */
export type Restriction = "mutlaq" | "muqayyad";

/** Abrogation: a nasikh text supersedes the mansukh one it repealed. */
export type Abrogation = "nasikh" | "mansukh";

export const MADHAHIB = ["hanafi", "maliki", "shafii", "hanbali"] as const;
export type Madhhab = (typeof MADHAHIB)[number];

export const MADHHAB_LABELS: Record<Madhhab, { en: string; ar: string }> = {
  hanafi: { en: "Hanafi", ar: "حنفي" },
  maliki: { en: "Maliki", ar: "مالكي" },
  shafii: { en: "Shafi'i", ar: "شافعي" },
  hanbali: { en: "Hanbali", ar: "حنبلي" },
};

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

export interface Evidence {
  /** Joins to `Clause.id`. */
  readonly clauseId: string;
  readonly kind: EvidenceKind;

  /** Human-facing citation, e.g. "Qur'an 17:23" or "Sahih al-Bukhari 5971". */
  readonly reference: string;
  /** The source text in translation. */
  readonly text?: string;
  readonly textArabic?: string;

  /** Authenticity of transmission. Applies to sunnah; Qur'an is mutawatir by definition. */
  readonly grade?: HadithGrade;
  /** Certainty that the text is authentically transmitted. */
  readonly thubut?: Certainty;
  /** Certainty that the text indicates this particular ruling. */
  readonly dalala?: Certainty;

  readonly scope?: Scope;
  readonly restriction?: Restriction;
  readonly abrogation?: Abrogation;
  /** Clause id of the text this one abrogates, when known. */
  readonly abrogates?: string;

  /** Schools holding this position. Absent means agreed upon or not school-specific. */
  readonly madhahib?: readonly Madhhab[];

  /**
   * True when this clause was produced by the LLM formalisation pipeline and
   * no human has checked it. Surfaced in the UI, because an unreviewed
   * machine reading of a scriptural text is not the same kind of claim as a
   * hand-authored rule and must not be presented as though it were.
   */
  readonly unreviewed?: boolean;

  readonly notes?: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class EvidenceStore {
  private readonly byClause = new Map<string, Evidence>();

  constructor(records: readonly Evidence[] = []) {
    for (const r of records) this.add(r);
  }

  add(record: Evidence): this {
    this.byClause.set(record.clauseId, record);
    return this;
  }

  addAll(records: readonly Evidence[]): this {
    for (const r of records) this.add(r);
    return this;
  }

  get(clauseId: string): Evidence | undefined {
    return this.byClause.get(clauseId);
  }

  /**
   * Evidence for a clause, or a neutral placeholder.
   *
   * Never throws: a clause with no evidence record is a KB authoring gap, and
   * failing the whole query over it would be worse than proceeding with an
   * explicitly zero-weight record that shows up as such in the UI.
   */
  getOrUnknown(clauseId: string): Evidence {
    return (
      this.byClause.get(clauseId) ?? {
        clauseId,
        kind: "ontology",
        reference: "(no evidence record)",
        notes: "This clause has no evidence metadata; it contributes no juristic weight.",
      }
    );
  }

  has(clauseId: string): boolean {
    return this.byClause.has(clauseId);
  }

  get size(): number {
    return this.byClause.size;
  }

  all(): Evidence[] {
    return [...this.byClause.values()];
  }
}

// ---------------------------------------------------------------------------
// Derived strength
// ---------------------------------------------------------------------------

/**
 * A single 0-100 strength for one piece of evidence, before any comparison
 * against a competitor.
 *
 * This is a blunt summary and is used only for display and for breaking ties
 * that the murajjihat leave genuinely open. The substantive work is done by
 * the ordered preference rules in the tarjih layer, which compare two
 * evidences on specific grounds and can say *why* one won. A scalar cannot do
 * that, and presenting one as if it were the reasoning is what the previous
 * implementation did wrong.
 */
export function baseStrength(e: Evidence): number {
  // A fabricated report supports nothing, whatever else it has going for it.
  if (e.grade === "mawdu") return 0;

  const kindScore = EVIDENCE_KIND_RANK[e.kind];
  const gradeScore = e.grade ? GRADE_RANK[e.grade] : kindScore;

  // Transmission and indication both have to hold up.
  let score = 0.5 * kindScore + 0.5 * gradeScore;
  if (e.thubut === "zanni") score *= 0.9;
  if (e.dalala === "zanni") score *= 0.85;
  if (e.abrogation === "mansukh") score = 0; // repealed: no longer operative
  if (e.unreviewed) score *= 0.8;

  return Math.max(0, Math.min(100, Math.round(score)));
}
