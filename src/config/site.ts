/**
 * Global site configuration.
 */
export const siteConfig = {
  name: "Tarjih",
  links: {
    github: "https://github.com/mohaneddz/Tarjih",
  },
};

/**
 * The public origin, for the sitemap, robots.txt and share-card URLs. An
 * explicit NEXT_PUBLIC_APP_URL wins; on Vercel the production domain is known
 * without configuration; the last fallback is only a placeholder.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:1919";
}

export type SiteConfig = typeof siteConfig;
