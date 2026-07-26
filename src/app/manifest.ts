import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tarjih — Juristic Weighing & Analysis Engine",
    short_name: "Tarjih",
    description:
      "A premium analytical workspace for Islamic jurisprudence, weighing juristic opinions using structured reasoning trees and scholarly consensus.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#090d16",
    icons: [
      {
        src: "/logo/tarjih-icon-transparent.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/tarjih-icon-transparent.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
