import { prisma } from "./db";

export interface Hadith {
  id: string;
  text: string;
  source: string;
  tags: string[];
}

/**
 * Searches the database-backed Hadith table using keywords.
 * Returns matching Hadiths. If no matches are found, returns a fallback set.
 */
export async function searchHadiths(keywords: string[]): Promise<Hadith[]> {
  try {
    if (!keywords || keywords.length === 0) {
      // Fallback: fetch a few default ones
      const list = await prisma.hadith.findMany({
        take: 3,
      });
      return list.map(h => ({
        id: h.id,
        text: h.text,
        source: h.source,
        tags: JSON.parse(h.tags),
      }));
    }

    const normalizedKeywords = keywords
      .map(kw => kw.toLowerCase().trim())
      .filter(kw => kw.length > 2); // Filter out very short keywords

    if (normalizedKeywords.length === 0) {
      const list = await prisma.hadith.findMany({
        take: 3,
      });
      return list.map(h => ({
        id: h.id,
        text: h.text,
        source: h.source,
        tags: JSON.parse(h.tags),
      }));
    }

    // Query SQLite database for rows containing any of the keywords in their text
    const orConditions = normalizedKeywords.map(kw => ({
      text: {
        contains: kw
      }
    }));

    let list = await prisma.hadith.findMany({
      where: {
        OR: orConditions
      },
      take: 8, // Limit context size so the LLM prompt remains concise and relevant
    });

    // If no exact match is found, do a fallback to some general maxims/actions hadiths
    if (list.length === 0) {
      // Look for generic tags like 'maxim' or 'actions' or fetch first 3
      list = await prisma.hadith.findMany({
        where: {
          OR: [
            { text: { contains: "intentions" } },
            { text: { contains: "harm" } }
          ]
        },
        take: 3
      });

      if (list.length === 0) {
        list = await prisma.hadith.findMany({
          take: 3
        });
      }
    }

    return list.map(h => ({
      id: h.id,
      text: h.text,
      source: h.source,
      tags: JSON.parse(h.tags),
    }));
  } catch (error) {
    console.error("[Tarjih Hadiths] searchHadiths failed, falling back to basic array", error);
    return [];
  }
}
