/**
 * Global site configurations and navigation schema.
 */
export const siteConfig = {
  name: "Tarjih",
  description: "A premium Next.js codebase structure showing atomic component composition into page sections.",
  url: "https://tarjih.example.com",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Features", href: "#features" },
    { title: "Docs", href: "/docs" },
    { title: "Contact", href: "#contact" },
  ],
  links: {
    github: "https://github.com/mohaneddz/Tarjih",
    twitter: "https://twitter.com/tarjih",
    docs: "/docs",
  },
};

export type SiteConfig = typeof siteConfig;
