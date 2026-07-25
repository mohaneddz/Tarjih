import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { classifyGrade, findCollection, parseHadithHtml, COLLECTIONS } from "./sunnah";

function fixture(name: string): string {
  return readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
}

describe("classifyGrade", () => {
  it("returns undefined for no grade text at all", () => {
    expect(classifyGrade(undefined)).toBeUndefined();
  });

  it("classifies a plain Sahih grade", () => {
    expect(classifyGrade("Sahih (Darussalam)")).toBe("sahih");
  });

  it("classifies a plain Hasan grade", () => {
    expect(classifyGrade("Hasan (Darussalam)")).toBe("hasan");
  });

  it("reads the compound 'Hasan Sahih' conservatively as hasan", () => {
    expect(classifyGrade("Hasan Sahih (Al-Albani)")).toBe("hasan");
  });

  it("classifies da'if regardless of the apostrophe style", () => {
    expect(classifyGrade("Da'if (Al-Albani)")).toBe("daif");
    expect(classifyGrade("Daif (Al-Albani)")).toBe("daif");
  });

  it("classifies weak as da'if", () => {
    expect(classifyGrade("Weak")).toBe("daif");
  });

  it("classifies fabricated / mawdu correctly", () => {
    expect(classifyGrade("Mawdu' (fabricated)")).toBe("mawdu");
  });

  it("classifies mutawatir", () => {
    expect(classifyGrade("Mutawatir")).toBe("mutawatir");
  });

  it("prioritises a weak classification over an incidental sahih mention", () => {
    // A grade note that discusses the isnad in prose could mention "sahih"
    // in passing while still being fundamentally weak; the severe reading
    // must win.
    expect(classifyGrade("Da'if, though Al-Tirmidhi called a similar report Sahih")).toBe("daif");
  });

  it("returns undefined for unrecognised free text rather than guessing", () => {
    expect(classifyGrade("Disputed among scholars")).toBeUndefined();
  });
});

describe("COLLECTIONS", () => {
  it("marks Bukhari and Muslim as not individually graded", () => {
    expect(findCollection("bukhari")?.explicitlyGraded).toBe(false);
    expect(findCollection("muslim")?.explicitlyGraded).toBe(false);
  });

  it("marks the four Sunan collections as individually graded", () => {
    for (const slug of ["abudawud", "tirmidhi", "nasai", "ibnmajah"]) {
      expect(findCollection(slug)?.explicitlyGraded).toBe(true);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = COLLECTIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("parseHadithHtml against real sunnah.com pages", () => {
  it("extracts English text, Arabic text, grade, and reference for a graded Tirmidhi hadith", () => {
    const parsed = parseHadithHtml(fixture("tirmidhi-1-sahih.html"), "tirmidhi", 1);
    expect(parsed).not.toBeNull();
    expect(parsed!.textEn).toContain("Salat will not be accepted without purification");
    expect(parsed!.textAr).toContain("لاَ تُقْبَلُ صَلاَةٌ");
    expect(parsed!.rawGrade).toBe("Sahih (Darussalam)");
    expect(parsed!.grade).toBe("sahih");
    expect(parsed!.reference).toBe("Jami` at-Tirmidhi 1");
  });

  it("extracts a Hasan-graded Tirmidhi hadith", () => {
    const parsed = parseHadithHtml(fixture("tirmidhi-1005-hasan.html"), "tirmidhi", 1005);
    expect(parsed!.grade).toBe("hasan");
  });

  it("extracts a compound Hasan-Sahih grade from Abu Dawud", () => {
    const parsed = parseHadithHtml(fixture("abudawud-1-hasan-sahih.html"), "abudawud", 1);
    expect(parsed!.rawGrade).toContain("Hasan");
    expect(parsed!.grade).toBe("hasan");
  });

  it("leaves grade undefined for Bukhari, which prints no grade box at all", () => {
    const parsed = parseHadithHtml(fixture("bukhari-1-no-grade.html"), "bukhari", 1);
    expect(parsed).not.toBeNull();
    expect(parsed!.textEn).toContain("The reward of deeds depends upon the intentions");
    expect(parsed!.rawGrade).toBeUndefined();
    expect(parsed!.grade).toBeUndefined();
  });

  it("returns null for a page with no hadith container (out-of-range 404 page)", () => {
    const parsed = parseHadithHtml(fixture("tirmidhi-out-of-range-404.html"), "tirmidhi", 999999);
    expect(parsed).toBeNull();
  });

  it("never mixes up which hadith's number and collection are recorded", () => {
    const parsed = parseHadithHtml(fixture("tirmidhi-1005-hasan.html"), "tirmidhi", 1005);
    expect(parsed!.collection).toBe("tirmidhi");
    expect(parsed!.number).toBe(1005);
  });
});
