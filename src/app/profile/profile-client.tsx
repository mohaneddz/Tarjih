"use client";

import React from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card } from "@/components/ui/card";
import { AuthenticStamp, WeighingScale, RulingRosette } from "@/components/ui/asset-badge";

export function ProfileClient() {
  const stats = [
    { title: "Cases Resolved", value: "142", desc: "Successfully resolved juristic inquires", badge: <AuthenticStamp size="sm" showLabel={false} /> },
    { title: "Weighed Opinions", value: "512", desc: "Total nodes mapped in reasoning trees", badge: <WeighingScale size="sm" /> },
    { title: "Juristic Accuracy", value: "98%", desc: "Consistency rating across schools", badge: <RulingRosette size="sm" /> },
  ];

  const expertises = [
    "Muamalat (Transactions & Finance)",
    "Fiqh al-Nawazil (Contemporary Issues)",
    "Ibadah (Rituals of Worship)",
    "Family Inheritance (Mirath)",
    "Usul al-Fiqh (Jurisprudential Methodology)",
  ];

  const activities = [
    {
      action: "Resolved inquiry using Qiyas",
      target: "Is mistreating aunts haram?",
      date: "Today at 09:24 AM",
      details: "Extended the prohibition from mother to maternal aunt based on ties of kinship ('Illah).",
    },
    {
      action: "Calculated stock Zakat weights",
      target: "Zakat calculation on corporate shares",
      date: "2 days ago",
      details: "Applied AAOIFI Standard 35, distinguishing active traders (2.5%) and long-term holders (10% of dividends).",
    },
    {
      action: "Investigated cryptocurrency Gharar",
      target: "Jursitic ruling on digital currency transactions",
      date: "1 week ago",
      details: "Weighed blocking the means (Sadd al-Dhara'i) maxims against public utility arguments.",
    },
    {
      action: "Validated travel prayers Rukhshah",
      target: "Combining prayers while traveling",
      date: "2 weeks ago",
      details: "Mapped journey distance thresholds and intent criteria across major legal schools.",
    },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Repeating Arabesque Geometric Pattern */}
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-10 select-none">
        {/* Scholar Profile Header Card */}
        <div className="relative overflow-hidden border border-border-warm rounded-2xl p-8 bg-card-warm shadow-premium flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          {/* Avatar Circle */}
          <div className="h-24 w-24 rounded-full bg-[#0E3A20] text-white flex items-center justify-center font-serif font-bold text-4xl shadow-md border-2 border-brand-gold shrink-0">
            S
          </div>

          {/* Profile Details */}
          <div className="flex-grow flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <RulingRosette size="sm" />
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-text-primary">
                  Scholar S. al-Ansari
                </h1>
              </div>
              <AuthenticStamp size="sm" showLabel={false} />
            </div>
            <p className="text-sm text-brand-gold font-bold font-serif">
              Tarjih Juristic Assembly • Fiqh al-Nawazil Division
            </p>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mt-1">
              Dedicated to evaluating contemporary legal issues and synthesizing classical Usul al-Fiqh principles with modern societal realities, ensuring authentic, consistent, and balanced legal resolutions.
            </p>
          </div>
        </div>

        {/* Section 1: Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, idx) => (
            <Card key={idx} hoverable={false} className="p-6 flex items-center justify-between gap-4 text-left relative overflow-hidden">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">
                  {s.title}
                </span>
                <span className="text-3xl font-serif font-bold text-brand-green leading-tight">
                  {s.value}
                </span>
                <span className="text-[12px] text-text-secondary mt-1">
                  {s.desc}
                </span>
              </div>
              <div className="shrink-0">{s.badge}</div>
            </Card>
          ))}
        </div>

        {/* Section 2: Split Layout (Expertise vs Activity) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Panel: Areas of Expertise */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              Juristic Expertise
            </h2>
            <div className="flex flex-col gap-2.5">
              {expertises.map((exp, idx) => (
                <div
                  key={idx}
                  className="bg-card-warm/60 border border-border-warm rounded-xl p-3 text-sm font-semibold text-[#1E2A22] dark:text-[#E2E8E5] flex items-center gap-2.5 shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-brand-gold shrink-0" />
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Recent Juristic Activity Timeline */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              Recent Juristic Activity
            </h2>
            
            <div className="relative border-l border-border-warm pl-5 ml-2.5 flex flex-col gap-6">
              {activities.map((act, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline node */}
                  <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-background border border-brand-gold flex items-center justify-center">
                    <span className="h-1 w-1 rounded-full bg-brand-gold" />
                  </span>
                  
                  {/* Activity Details */}
                  <div className="flex flex-col gap-1.5 bg-card-warm/40 hover:bg-card-warm/80 border border-transparent hover:border-border-warm p-4 rounded-xl transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[12px] font-extrabold text-brand-green uppercase tracking-wider">
                        {act.action}
                      </span>
                      <span className="text-[11px] text-text-secondary font-semibold">
                        {act.date}
                      </span>
                    </div>
                    <h4 className="font-serif text-sm font-bold text-text-primary leading-snug">
                      {act.target}
                    </h4>
                    <p className="text-[13px] text-text-secondary leading-relaxed">
                      {act.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
