import React from "react";
import { Header } from "@/sections/header";
import { Hero } from "@/sections/hero";
import { Features } from "@/sections/features";
import { Footer } from "@/sections/footer";

/**
 * Main application homepage.
 * Replaces default boilerplate with a clean compositional layout assembly.
 */
export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Repeating Arabesque Geometric Pattern */}
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />
      
      {/* Composited Sections */}
      <Header />
      
      <main className="flex-1">
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
}
