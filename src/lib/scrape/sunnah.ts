/**
 * sunnah.com scraper.
 *
 * Replaces the old fawazahmed0-based scrape (`src/scripts/scrape.ts`,
 * deleted), which pulled English-only translations with no isnad and no
 * grading — meaning nothing in that corpus could be weighed by the tarjih
 * layer at all. sunnah.com carries an explicit per-hadith authenticity grade
 * for every collection except Bukhari and Muslim, whose contents are Sahih by
 * scholarly consensus rather than graded individually; that per-hadith grade
 * is exactly what `EvidenceStore`/`baseStrength` need to do their job.
 *
 * sunnah.com's `robots.txt` allows crawling everything except
 * `/selectiondata/*`, which this module never touches, and specifies no
 * crawl-delay — the caller (`run-scrape.ts`) still rate-limits requests as a
 * matter of courtesy, not because it is required to.
 *
 * There is also a sanctioned API (sunnah.stoplight.io), but it requires an
 * API key requested by filing a GitHub issue and waiting for manual approval
 * — an unpredictable, human-gated step outside what a scraper can do for
 * itself. Scraping the public HTML pages, within the terms robots.txt
 * already grants, is the available path until a key is issued.
 */

import * as cheerio from "cheerio";
import type { HadithGrade } from "../kb/evidence";

export interface HadithCollection {
  readonly slug: string;
  readonly displayName: string;
  /**
   * Whether sunnah.com prints an explicit per-hadith grade box for this
   * collection. False for Bukhari and Muslim, whose contents are treated as
   * uniformly Sahih rather than individually graded.
   */
  readonly explicitlyGraded: boolean;
}

export const COLLECTIONS: readonly HadithCollection[] = [
  { slug: "bukhari", displayName: "Sahih al-Bukhari", explicitlyGraded: false },
  { slug: "muslim", displayName: "Sahih Muslim", explicitlyGraded: false },
  { slug: "abudawud", displayName: "Sunan Abi Dawud", explicitlyGraded: true },
  { slug: "tirmidhi", displayName: "Jami` at-Tirmidhi", explicitlyGraded: true },
  { slug: "nasai", displayName: "Sunan an-Nasa'i", explicitlyGraded: true },
  { slug: "ibnmajah", displayName: "Sunan Ibn Majah", explicitlyGraded: true },
];

export function findCollection(slug: string): HadithCollection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export interface ParsedHadith {
  readonly collection: string;
  readonly number: number;
  readonly reference: string;
  readonly textEn: string;
  readonly textAr: string | null;
  /** Raw grade text as printed, e.g. "Sahih (Darussalam)". Undefined when the collection prints no grade box. */
  readonly rawGrade: string | undefined;
  readonly grade: HadithGrade | undefined;
}

const WORD_TO_GRADE: readonly { pattern: RegExp; grade: HadithGrade }[] = [
  // Order matters: check the most severe classification first, since a grade
  // string can combine words (e.g. "Da'if Isnad, Munkar Matan" should read as
  // da'if, not accidentally match something milder first).
  { pattern: /\bmawdu|\bfabricated\b/i, grade: "mawdu" },
  { pattern: /da\W?if|weak/i, grade: "daif" },
  { pattern: /\bmutawatir/i, grade: "mutawatir" },
  // "Hasan Sahih" is a classical compound grade (roughly: hasan by strict
  // criteria, sahih by lenient ones); read conservatively as hasan rather
  // than crediting it with the stronger claim.
  { pattern: /\bhasan\b/i, grade: "hasan" },
  { pattern: /\bsahih\b/i, grade: "sahih" },
];

/**
 * Maps sunnah.com's free-text grade string to our grade vocabulary.
 *
 * Deliberately conservative: a grade string that matches nothing recognised
 * returns `undefined` rather than a guess, since an ungraded text must not be
 * silently treated as any particular strength (see `baseStrength`, which
 * refuses to score evidence with no grade the same as one explicitly marked
 * strong).
 */
export function classifyGrade(rawGrade: string | undefined): HadithGrade | undefined {
  if (!rawGrade) return undefined;
  for (const { pattern, grade } of WORD_TO_GRADE) {
    if (pattern.test(rawGrade)) return grade;
  }
  return undefined;
}

/** Collapses runs of whitespace (including newlines from HTML source formatting) to single spaces. */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parses a sunnah.com hadith page into its component fields.
 *
 * Returns `null` when the page does not contain a hadith (the out-of-range
 * case returns HTTP 404 before this is even called, but a page can 200 while
 * still lacking the expected markup if sunnah.com's template changes) —
 * callers must treat `null` as "nothing here", not throw.
 */
export function parseHadithHtml(html: string, collection: string, number: number): ParsedHadith | null {
  const $ = cheerio.load(html);
  const container = $(".actualHadithContainer").first();
  if (container.length === 0) return null;

  const englishBlock = container.find(".english_hadith_full").first();
  const narrated = normalizeWhitespace(englishBlock.find(".hadith_narrated").first().text());
  const details = normalizeWhitespace(englishBlock.find(".text_details").first().text());
  const textEn = [narrated, details].filter(Boolean).join("\n\n").trim();
  if (!textEn) return null;

  const arabicBlock = container.find(".arabic_hadith_full").first();
  const textAr = arabicBlock.length > 0 ? normalizeWhitespace(arabicBlock.text()) : null;

  const rawGradeText = normalizeWhitespace(container.find(".gradetable .english_grade").eq(1).text());
  // The cell exists but is empty (just "&nbsp;") for ungraded collections.
  const rawGrade = rawGradeText || undefined;

  const referenceLink = container.find(".hadith_reference a").first().text().trim();
  const reference = referenceLink || `${collection} ${number}`;

  return {
    collection,
    number,
    reference,
    textEn,
    textAr,
    rawGrade,
    grade: classifyGrade(rawGrade),
  };
}

export interface FetchOptions {
  readonly userAgent?: string;
  readonly timeoutMs?: number;
}

const DEFAULT_USER_AGENT =
  "TarjihResearchBot/0.1 (+https://github.com/mohaneddz/Tarjih; offline hadith formalisation research, low request rate)";

/**
 * Fetches one hadith page. Returns `null` for a 404 (out of range for that
 * collection — the normal way iteration ends), throws for anything else so
 * the caller can distinguish "no more hadiths" from "something is wrong".
 */
export async function fetchHadithHtml(
  collection: string,
  number: number,
  options: FetchOptions = {}
): Promise<string | null> {
  const { userAgent = DEFAULT_USER_AGENT, timeoutMs = 15_000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://sunnah.com/${collection}:${number}`, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`sunnah.com returned ${res.status} for ${collection}:${number}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetches and parses one hadith in a single call. */
export async function fetchHadith(
  collection: string,
  number: number,
  options: FetchOptions = {}
): Promise<ParsedHadith | null> {
  const html = await fetchHadithHtml(collection, number, options);
  if (html === null) return null;
  return parseHadithHtml(html, collection, number);
}
