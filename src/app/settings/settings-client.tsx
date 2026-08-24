"use client";

import React, { useState } from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RulingRosette, WeighingScale, EvidenceBadge } from "@/components/ui/asset-badge";

export function SettingsClient() {
  const [defaultMadhhab, setDefaultMadhhab] = useState("Shafi'i");
  const [strictness, setStrictness] = useState(50); // 0 (Concessive) to 100 (Strict)
  const [maslahahWeight, setMaslahahWeight] = useState(60); // 0 to 100
  const [qiyasWeight, setQiyasWeight] = useState(80); // 0 to 100
  const [urfWeight, setUrfWeight] = useState(40); // 0 to 100

  const madhhabs = [
    {
      name: "Shafi'i",
      founder: "Imam al-Shafi'i",
      description: "Emphasizes strict textual synthesis of Qur'an and Sunnah, placing high authority on Qiyas and rejecting Istihsan (juristic preference).",
    },
    {
      name: "Hanafi",
      founder: "Imam Abu Hanifah",
      description: "Renowned for its rationalist approach, pioneering the use of Istihsan, custom (Urf), and sophisticated analogical reasoning.",
    },
    {
      name: "Maliki",
      founder: "Imam Malik ibn Anas",
      description: "Places unique weight on the practice of the people of Madinah (Amal ahl al-Madinah) and public welfare (Maslahah Mursalah).",
    },
    {
      name: "Hanbali",
      founder: "Imam Ahmad ibn Hanbal",
      description: "Characterized by its strict adherence to primary textual sources and Hadith, avoiding analogical extension unless absolutely necessary.",
    },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Repeating Arabesque Geometric Pattern */}
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-10 select-none">
        {/* Page Header */}
        <div className="border-b border-border-warm pb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RulingRosette size="md" />
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
                Juristic Configurations
              </h1>
            </div>
            <p className="text-sm text-text-secondary mt-2">
              Configure default legal methodologies, derivation weights, and analytical strictness parameters.
            </p>
          </div>
          <WeighingScale size="sm" className="hidden sm:flex" />
        </div>

        {/* Section 1: Madhhab Selection */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-text-primary">
              Default Madhhab (School of Law)
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Select the primary legal school whose Usul (principles) will govern the initial derivation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {madhhabs.map((m) => {
              const isSelected = defaultMadhhab === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => setDefaultMadhhab(m.name)}
                  className={`text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-card-warm border-brand-green ring-2 ring-brand-green/10 shadow-md"
                      : "bg-card-warm/60 border-border-warm hover:border-brand-gold/40 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-text-primary">
                      {m.name}
                    </span>
                    <span className="text-[12px] text-brand-gold font-semibold uppercase tracking-wider">
                      {m.founder}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Analytical Weights & Sliders */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-text-primary">
              Derivation Rigor & Source Weights
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Adjust the mathematical weights and strictness thresholds used by the Tarjih analytical engine.
            </p>
          </div>

          <Card hoverable={false} className="p-8 flex flex-col gap-8">
            {/* Slider 1: Strictness */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-text-primary">Juristic Strictness Filter</span>
                <span className="font-serif font-bold text-brand-gold">
                  {strictness < 35 ? "Concessive (Rukhshah)" : strictness > 70 ? "Strict (Azeemah)" : "Moderate"} ({strictness}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={strictness}
                onChange={(e) => setStrictness(Number(e.target.value))}
                className="w-full h-1 bg-border-warm rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
              <div className="flex justify-between text-[11px] text-text-secondary font-semibold uppercase tracking-wider">
                <span>Rukhshah</span>
                <span>Moderate</span>
                <span>Azeemah</span>
              </div>
            </div>

            {/* Slider 2: Qiyas */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-text-primary">Analogical Deduction Weight (Qiyas)</span>
                <span className="font-bold text-brand-green">{qiyasWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={qiyasWeight}
                onChange={(e) => setQiyasWeight(Number(e.target.value))}
                className="w-full h-1 bg-border-warm rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
            </div>

            {/* Slider 3: Maslahah */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-text-primary">Public Welfare Weight (Maslahah Mursalah)</span>
                <span className="font-bold text-brand-green">{maslahahWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={maslahahWeight}
                onChange={(e) => setMaslahahWeight(Number(e.target.value))}
                className="w-full h-1 bg-border-warm rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
            </div>

            {/* Slider 4: Urf */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-text-primary">Custom & Local Custom Weight (Urf)</span>
                <span className="font-bold text-brand-green">{urfWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={urfWeight}
                onChange={(e) => setUrfWeight(Number(e.target.value))}
                className="w-full h-1 bg-border-warm rounded-lg appearance-none cursor-pointer accent-brand-green"
              />
            </div>
          </Card>
        </div>

        {/* Save Controls */}
        <div className="flex items-center justify-end gap-4 border-t border-border-warm pt-6">
          <Button variant="outline" onClick={() => alert("Settings reset to defaults.")}>
            Reset Defaults
          </Button>
          <Button variant="primary" onClick={() => alert("Juristic configurations saved successfully.")}>
            Save Configurations
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
