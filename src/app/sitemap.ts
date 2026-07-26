import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tarjih.app";
  const currentDate = new Date().toISOString();

  const routes = ["", "/study", "/database", "/cases", "/profile", "/settings"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === "" || route === "/cases" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/study" || route === "/cases" ? 0.9 : 0.7,
  }));
}
