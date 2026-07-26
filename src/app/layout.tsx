import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora, EB_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tarjih.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tarjih — Juristic Weighing & Analysis Engine",
    template: "%s | Tarjih",
  },
  description:
    "A premium analytical workspace for Islamic jurisprudence, weighing juristic opinions using structured reasoning trees, scholarly consensus, and evidence strength.",
  applicationName: "Tarjih",
  authors: [{ name: "Tarjih Team", url: siteUrl }],
  generator: "Next.js",
  keywords: [
    "Tarjih",
    "Juristic Weighing",
    "Usul al-Fiqh",
    "Islamic Jurisprudence",
    "Scholarly Consensus",
    "Ijma",
    "Qiyas",
    "Fiqh Analysis Engine",
    "Hadith Evidence Analysis",
    "Islamic Law AI",
    "Reasoning Trees",
    "Madhhab Analysis",
  ],
  creator: "Tarjih Team",
  publisher: "Tarjih",
  category: "Islamic Technology & Legal Analysis",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tarjih — Juristic Weighing & Analysis Engine",
    description:
      "A premium analytical workspace for Islamic jurisprudence, weighing opinions using structured reasoning trees and scholarly consensus.",
    url: siteUrl,
    siteName: "Tarjih",
    images: [
      {
        url: "/logo/tarjih-lockup-dark.png",
        width: 1200,
        height: 630,
        alt: "Tarjih Juristic Weighing Engine Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarjih — Juristic Weighing & Analysis Engine",
    description:
      "A premium analytical workspace for Islamic jurisprudence, weighing opinions using structured reasoning trees and scholarly consensus.",
    images: ["/logo/tarjih-lockup-dark.png"],
    creator: "@tarjih",
  },
  icons: {
    icon: [
      { url: "/logo/tarjih-icon-transparent.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo/tarjih-icon-transparent.png",
    apple: [
      { url: "/logo/tarjih-icon-transparent.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Tarjih",
      "description": "Juristic Weighing & Analysis Engine for Islamic Jurisprudence",
      "publisher": {
        "@id": `${siteUrl}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Tarjih",
      "url": siteUrl,
      "logo": `${siteUrl}/logo/tarjih-icon-transparent.png`,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#application`,
      "name": "Tarjih Juristic Engine",
      "operatingSystem": "All",
      "applicationCategory": "EducationalApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
