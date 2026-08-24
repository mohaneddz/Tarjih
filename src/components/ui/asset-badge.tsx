"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Types & Asset Paths
// ---------------------------------------------------------------------------

export type VerdictType =
  | "wajib"
  | "obligatory"
  | "mandub"
  | "recommended"
  | "mubah"
  | "permissible"
  | "permitted"
  | "makruh"
  | "disliked"
  | "discouraged"
  | "haram"
  | "prohibited"
  | "forbidden"
  | "non-obligatory"
  | "ghair_wajib";

export type EvidenceGradeType =
  | "authentic"
  | "sahih"
  | "mutawatir"
  | "hasan"
  | "good"
  | "weak"
  | "daif"
  | "disputed"
  | "mukhtalaf"
  | "fabricated"
  | "mawdu"
  | "unverified"
  | "majhul";

const VERDICT_ASSETS: Record<string, { src: string; label: string }> = {
  wajib: { src: "/assets/tarjih-verdict-obligatory.png", label: "Obligatory (واجب)" },
  obligatory: { src: "/assets/tarjih-verdict-obligatory.png", label: "Obligatory (واجب)" },
  mandub: { src: "/assets/tarjih-verdict-recommended.png", label: "Recommended (مندوب)" },
  recommended: { src: "/assets/tarjih-verdict-recommended.png", label: "Recommended (مندوب)" },
  mubah: { src: "/assets/tarjih-verdict-permissible.png", label: "Permissible (مباح)" },
  permissible: { src: "/assets/tarjih-verdict-permissible.png", label: "Permissible (مباح)" },
  permitted: { src: "/assets/tarjih-verdict-permissible.png", label: "Permissible (مباح)" },
  makruh: { src: "/assets/tarjih-verdict-disliked.png", label: "Disliked (مكروه)" },
  disliked: { src: "/assets/tarjih-verdict-disliked.png", label: "Disliked (مكروه)" },
  discouraged: { src: "/assets/tarjih-verdict-disliked.png", label: "Disliked (مكروه)" },
  haram: { src: "/assets/tarjih-verdict-prohibited.png", label: "Prohibited (حرام)" },
  prohibited: { src: "/assets/tarjih-verdict-prohibited.png", label: "Prohibited (حرام)" },
  forbidden: { src: "/assets/tarjih-verdict-prohibited.png", label: "Prohibited (حرام)" },
  "non-obligatory": { src: "/assets/tarjih-verdict-non-obligatory.png", label: "Non-obligatory (غير واجب)" },
  ghair_wajib: { src: "/assets/tarjih-verdict-non-obligatory.png", label: "Non-obligatory (غير واجب)" },
};

const EVIDENCE_ASSETS: Record<string, { src: string; label: string }> = {
  authentic: { src: "/assets/tarjih-evidence-authentic.png", label: "Authentic (صحيح)" },
  sahih: { src: "/assets/tarjih-evidence-authentic.png", label: "Authentic (صحيح)" },
  mutawatir: { src: "/assets/tarjih-evidence-authentic.png", label: "Mutawatir (متواتر)" },
  hasan: { src: "/assets/tarjih-evidence-good-hasan.png", label: "Hasan (حسن)" },
  good: { src: "/assets/tarjih-evidence-good-hasan.png", label: "Good / Hasan (حسن)" },
  weak: { src: "/assets/tarjih-evidence-weak.png", label: "Weak (ضعيف)" },
  daif: { src: "/assets/tarjih-evidence-weak.png", label: "Weak (ضعيف)" },
  disputed: { src: "/assets/tarjih-evidence-disputed.png", label: "Disputed (مختلف فيه)" },
  mukhtalaf: { src: "/assets/tarjih-evidence-disputed.png", label: "Disputed (مختلف فيه)" },
  fabricated: { src: "/assets/tarjih-evidence-fabricated.png", label: "Fabricated (موضوع)" },
  mawdu: { src: "/assets/tarjih-evidence-fabricated.png", label: "Fabricated (موضوع)" },
  unverified: { src: "/assets/tarjih-evidence-unverified.png", label: "Unverified (غير مراجع)" },
  majhul: { src: "/assets/tarjih-evidence-unverified.png", label: "Unverified (غير مراجع)" },
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface VerdictBadgeProps {
  verdict: VerdictType | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function VerdictBadge({ verdict, className, size = "md", showLabel = true }: VerdictBadgeProps) {
  const normalizedKey = verdict.toLowerCase().trim();
  const asset = VERDICT_ASSETS[normalizedKey] ?? VERDICT_ASSETS.permissible;

  const sizeClasses = {
    sm: "h-6 w-auto text-[12px]",
    md: "h-9 w-auto text-sm",
    lg: "h-14 w-auto text-sm font-bold",
  }[size];

  const imgDimensions = {
    sm: { width: 80, height: 24 },
    md: { width: 110, height: 36 },
    lg: { width: 160, height: 56 },
  }[size];

  return (
    <div className={cn("inline-flex items-center gap-2 select-none shrink-0", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0 drop-shadow-sm", sizeClasses)}>
        <Image
          src={asset.src}
          alt={asset.label}
          width={imgDimensions.width}
          height={imgDimensions.height}
          className="h-full w-auto object-contain transition-transform duration-200 hover:scale-105"
        />
      </div>
      {showLabel && (
        <span className="font-serif font-bold text-text-primary text-sm capitalize drop-shadow-2xs">
          {verdict}
        </span>
      )}
    </div>
  );
}

interface EvidenceBadgeProps {
  grade?: EvidenceGradeType | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function EvidenceBadge({ grade, className, size = "md", showLabel = true }: EvidenceBadgeProps) {
  const normalizedKey = grade ? grade.toLowerCase().trim() : "unverified";
  const asset = EVIDENCE_ASSETS[normalizedKey] ?? EVIDENCE_ASSETS.unverified;

  const sizeClasses = {
    sm: "h-5 w-auto text-[11px]",
    md: "h-7 w-auto text-sm",
    lg: "h-10 w-auto text-sm",
  }[size];

  const imgDimensions = {
    sm: { width: 70, height: 20 },
    md: { width: 100, height: 28 },
    lg: { width: 140, height: 40 },
  }[size];

  return (
    <div className={cn("inline-flex items-center gap-1.5 select-none shrink-0", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0 drop-shadow-xs", sizeClasses)}>
        <Image
          src={asset.src}
          alt={asset.label}
          width={imgDimensions.width}
          height={imgDimensions.height}
          className="h-full w-auto object-contain"
        />
      </div>
      {showLabel && (
        <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
          {grade || "Unverified"}
        </span>
      )}
    </div>
  );
}

interface AuthenticStampProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AuthenticStamp({ className, size = "md", showLabel = false }: AuthenticStampProps) {
  const dimensions = {
    sm: { width: 44, height: 44, container: "h-11 w-11" },
    md: { width: 64, height: 64, container: "h-16 w-16" },
    lg: { width: 96, height: 96, container: "h-24 w-24" },
  }[size];

  return (
    <div className={cn("inline-flex flex-col items-center gap-1 select-none shrink-0", className)}>
      <div className={cn("relative flex items-center justify-center drop-shadow-md transition-transform duration-300 hover:rotate-3 hover:scale-105", dimensions.container)}>
        <Image
          src="/assets/tarjih-authentic-stamp.png"
          alt="Tarjih Authentic Stamp"
          width={dimensions.width}
          height={dimensions.height}
          className="h-full w-full object-contain"
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-green">
          Verified Authentic
        </span>
      )}
    </div>
  );
}

interface WeighingScaleProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
}

export function WeighingScale({ className, size = "md", alt = "Tarjih Evidence Weighing Scale" }: WeighingScaleProps) {
  const dimensions = {
    sm: { width: 80, height: 80, container: "h-16 w-16" },
    md: { width: 140, height: 140, container: "h-28 w-28" },
    lg: { width: 220, height: 220, container: "h-44 w-44" },
    xl: { width: 320, height: 320, container: "h-64 w-64" },
  }[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center select-none shrink-0 drop-shadow-sm", dimensions.container, className)}>
      <Image
        src="/assets/tarjih-weighing-scale.png"
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        className="h-full w-full object-contain filter hover:brightness-105 transition-all duration-300"
      />
    </div>
  );
}

interface RulingRosetteProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RulingRosette({ className, size = "md" }: RulingRosetteProps) {
  const dimensions = {
    sm: { width: 20, height: 20, container: "h-5 w-5" },
    md: { width: 28, height: 28, container: "h-7 w-7" },
    lg: { width: 40, height: 40, container: "h-10 w-10" },
  }[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center select-none shrink-0 drop-shadow-xs", dimensions.container, className)}>
      <Image
        src="/assets/tarjih-ruling-rosette.png"
        alt="Tarjih Ruling Rosette Emblem"
        width={dimensions.width}
        height={dimensions.height}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
