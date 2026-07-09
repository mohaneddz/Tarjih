import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Hero Section component.
 * Features warm academic highlights, a decorative badge, serif typography,
 * and calls to action pointing to the study workspace.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36 bg-transparent select-none">
      {/* Dynamic Background Highlights (Gold & Green soft glow) */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-25 pointer-events-none">
        <div className="h-[300px] md:h-[450px] w-[300px] md:w-[450px] rounded-full bg-brand-green blur-[100px] md:blur-[140px] animate-float" />
        <div className="ml-32 h-[250px] md:h-[350px] w-[250px] md:w-[350px] rounded-full bg-brand-gold blur-[80px] md:blur-[110px] animate-float [animation-delay:2.5s]" />
      </div>

      <div className="mx-auto max-w-[92rem] px-6 text-center flex flex-col items-center">
        {/* Decorative Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold-light px-4 py-1.5 text-xs md:text-sm font-serif font-bold text-brand-gold mb-8 select-none shadow-sm">
          ⚖️ Juristic Analytical & Weighing Engine
        </div>

        {/* Heading title using the premium EB Garamond/Lora serif styles */}
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight max-w-4xl leading-tight text-text-primary">
          Weighing Scholarly Opinions with <span className="text-gradient-academic">Analytical Precision</span>
        </h1>

        {/* Description/Subtitle */}
        <p className="mt-6 text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          An interactive academic platform utilizing structured reasoning trees (Qiyas) to visualize, evaluate, and resolve complex contemporary jurisprudential inquiries.
        </p>

        {/* Calls to Action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4.5 w-full sm:w-auto">
          <Link href="/study" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-xs md:text-sm font-bold shadow-md hover:shadow-lg">
              Enter Study Workspace
            </Button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-xs md:text-sm font-bold">
              Explore Features
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
