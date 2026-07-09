import React from "react";
import { featuresData } from "@/data/features-data";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Features Section component.
 * Maps mock structured data to atomic Card components with beautiful hover highlights and serif headings.
 */
export function Features() {
  return (
    <section id="features" className="py-24 bg-background border-y border-border-warm/60 select-none transition-colors duration-200">
      <div className="mx-auto max-w-[92rem] px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-brand-green">
            Engineered for Juristic Rigor
          </h2>
          <p className="mt-4 text-sm text-text-secondary leading-relaxed">
            Explore the advanced analytical tools designed to bring clarity, consistency, and depth to contemporary jurisprudential research.
          </p>
        </div>

        {/* Features Card Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuresData.map((feature) => (
            <Card key={feature.id} hoverable className="flex flex-col h-full group p-7">
              <CardHeader className="flex-1 p-0">
                {/* SVG Icon Container - Gold/Beige to Green micro-animation */}
                <div className="h-11 w-11 rounded-xl bg-brand-gold-light text-brand-gold border border-border-warm-light flex items-center justify-center mb-6 group-hover:bg-brand-green group-hover:text-white group-hover:border-brand-green transition-all duration-300 shadow-sm">
                  {renderIcon(feature.icon)}
                </div>

                <CardTitle className="mb-3">
                  {feature.title}
                </CardTitle>

                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Renders SVG icons statically to keep bundle dependencies zero-weight.
 */
function renderIcon(name: string) {
  switch (name) {
    case "layers":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m11.142 0L21.75 12l-4.179-2.25M2.25 12l9.75 5.25 9.75-5.25M2.25 12l9.75-5.25 9.75 5.25M9.75 17.25V21.75M14.25 17.25V21.75" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904ZM18 10.5l-.5 2.5-.5-2.5-2.5-.5 2.5-.5.5-2.5.5 2.5 2.5.5-2.5.5ZM21 6l-.25 1.25-.25-1.25L19.25 5.5l1.25-.25.25-1.25.25 1.25 1.25.25-1.25.25Z" />
        </svg>
      );
    case "route":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "accessibility":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      );
  }
}
