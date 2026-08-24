import React from "react";
import { siteConfig } from "@/config/site";

/**
 * Footer Section component.
 * Integrates global metadata config info to output clear navigation references,
 * legal details, and branding signatures.
 */
export function Footer() {
  return (
    <footer className="border-t border-border-warm bg-background py-10 mt-auto select-none transition-colors duration-200">
      <div className="mx-auto max-w-[92rem] px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        {/* Copyright branding */}
        <p className="text-sm font-medium text-text-secondary">
          &copy; {new Date().getFullYear()} {siteConfig.name}™ — Juristic Weighing & Analytical Engine. All rights reserved.
        </p>

        {/* Configurations Social navigation links */}
        <div className="flex gap-6">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            GitHub
          </a>
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
