import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// Initialize a separate Prisma client for the script with an absolute path
const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

interface RawHadith {
  hadithnumber: number;
  text: string;
}

interface HadithApiResponse {
  hadiths: RawHadith[];
}

const CATEGORY_TAGS = [
  { keywords: ["aunt", "mother", "father", "parents", "kinship", "relatives", "family"], tags: ["family", "kinship", "parents"] },
  { keywords: ["harm", "harming", "injure", "damage", "injury"], tags: ["harm", "prevention", "maxim"] },
  { keywords: ["riba", "interest", "usury", "loan", "debt", "finance", "money"], tags: ["riba", "interest", "finance", "loan"] },
  { keywords: ["picture", "image", "taswir", "draw", "painting", "sculpture", "creators"], tags: ["taswir", "draw", "picture", "image"] },
  { keywords: ["zakat", "charity", "poor", "wealth", "tax", "alms", "giving"], tags: ["zakat", "charity", "poor", "giving"] },
  { keywords: ["intention", "actions", "niyyah", "intended"], tags: ["intentions", "actions", "niyyah"] },
  { keywords: ["travel", "prayer", "combine", "shorten", "journey"], tags: ["travel", "prayer", "worship"] },
  { keywords: ["cleanliness", "purification", "faith", "hygiene", "wudu", "purity"], tags: ["cleanliness", "purification", "wudu"] },
  { keywords: ["contract", "condition", "agreement", "stipulation", "business", "trade"], tags: ["contracts", "business", "conditions"] },
  { keywords: ["cat", "animal", "dog", "bird", "kindness", "cruelty"], tags: ["animals", "cats", "kindness"] },
  { keywords: ["truth", "lie", "sincerity", "honesty"], tags: ["truthfulness", "morals"] }
];

function generateTags(text: string): string[] {
  const lowercaseText = text.toLowerCase();
  const matchedTags = new Set<string>();

  for (const group of CATEGORY_TAGS) {
    if (group.keywords.some(kw => lowercaseText.includes(kw))) {
      group.tags.forEach(tag => matchedTags.add(tag));
    }
  }

  // Fallback tag
  if (matchedTags.size === 0) {
    matchedTags.add("general");
  }

  return Array.from(matchedTags);
}

async function scrapeAndFill() {
  console.log("Starting Hadith scraping from fawazahmed0/hadith-api...");

  const editions = [
    { name: "bukhari", url: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari.json", sourceName: "Sahih al-Bukhari" },
    { name: "muslim", url: "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-muslim.json", sourceName: "Sahih Muslim" }
  ];

  try {
    let totalImported = 0;

    // Clear existing scraped Hadiths to avoid duplicates
    const deleteResult = await prisma.hadith.deleteMany({});
    console.log(`Cleared ${deleteResult.count} existing Hadith records from database.`);

    for (const edition of editions) {
      console.log(`Fetching ${edition.sourceName} collection...`);
      const response = await fetch(edition.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${edition.sourceName} from CDN.`);
      }

      const data: HadithApiResponse = await response.json();
      console.log(`Fetched ${data.hadiths.length} hadiths for ${edition.sourceName}. Filtering for atomic Hadiths...`);

      // Filter for "easy atomic ahadiths" (short, clear, and matching our legal keywords)
      const filteredHadiths = data.hadiths.filter(hadith => {
        const textLen = hadith.text.length;
        const matchesKeywords = CATEGORY_TAGS.some(group => 
          group.keywords.some(kw => hadith.text.toLowerCase().includes(kw))
        );
        // Short, concise hadiths under 500 characters containing relevant legal topics
        return textLen > 20 && textLen < 500 && matchesKeywords;
      });

      console.log(`Found ${filteredHadiths.length} relevant atomic Hadiths. Inserting into database...`);

      // Batch insert into sqlite database
      const insertPromises = filteredHadiths.map(h => {
        const tags = generateTags(h.text);
        return prisma.hadith.create({
          data: {
            hadithNumber: h.hadithnumber,
            book: edition.name,
            text: h.text.trim(),
            source: `${edition.sourceName} (Hadith ${h.hadithnumber})`,
            tags: JSON.stringify(tags)
          }
        });
      });

      // Execute insertions in small chunks to avoid database locking issues
      const chunkSize = 50;
      for (let i = 0; i < insertPromises.length; i += chunkSize) {
        const chunk = insertPromises.slice(i, i + chunkSize);
        await Promise.all(chunk);
      }

      totalImported += filteredHadiths.length;
      console.log(`Successfully imported ${filteredHadiths.length} hadiths from ${edition.sourceName}.`);
    }

    console.log(`\nScraping complete! Total imported atomic Hadiths: ${totalImported}`);

    // Verify count in database
    const dbCount = await prisma.hadith.count();
    console.log(`Verified count in database 'Hadith' table: ${dbCount}`);

  } catch (error) {
    console.error("Scraping failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

scrapeAndFill();
