import React from "react";
import Link from "next/link";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Button } from "@/components/ui/button";
import { WeighingScale } from "@/components/ui/asset-badge";

export default function NotFound() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center text-center gap-6 px-6 py-24">
        <WeighingScale size="lg" alt="" />
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
            No ruling found here.
          </h1>
          <p className="text-sm text-text-secondary max-w-md">
            There&rsquo;s no clause covering this page — reported, not guessed. It may have moved or never existed.
          </p>
        </div>
        <Link href="/study">
          <Button variant="primary" size="md">
            Ask a question instead
          </Button>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
