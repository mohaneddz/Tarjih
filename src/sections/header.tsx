"use client";

import React, { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/study", label: "Study" },
  { href: "/database", label: "Knowledge Base" },
  { href: "/cases", label: "Cases" },
] as const;

/*
 * The theme is not React state. It lives as a class on <html>, put there by
 * the pre-hydration script in layout.tsx before React runs at all, so the
 * button reads it as an external store rather than keeping a copy that has to
 * be pushed back into sync on mount.
 *
 * Subscribing rather than snapshotting once also keeps the icon honest when
 * the class changes without going through this button — which is what
 * happens on a back/forward restore.
 */
function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function readTheme(): boolean {
  return document.documentElement.classList.contains("dark");
}

/**
 * There is no document on the server and no way to know the reader's
 * preference before the script runs, so the markup is rendered light and the
 * first client read corrects it.
 */
function readThemeOnServer(): boolean {
  return false;
}

/**
 * Site navigation. Matches the white/burgundy identity in design/*.png:
 * a slim three-item nav (Study / Knowledge Base / Cases) with a red
 * underline on the active section, and a plain icon cluster on the right
 * rather than the earlier profile-chip/shield decoration.
 */
export function Header() {
  const pathname = usePathname();
  const isDark = useSyncExternalStore(subscribeToTheme, readTheme, readThemeOnServer);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    // No setState: the class change is the state, and the observer above
    // reports it back.
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-warm bg-background/95 backdrop-blur-md shrink-0 select-none transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo/tarjih-icon-transparent.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-9 w-9 lg:h-10 lg:w-10 object-contain transition-transform group-hover:scale-105 dark:brightness-0 dark:invert"
          />
          <span className="font-serif text-xl lg:text-2xl font-bold tracking-wide text-text-primary transition-colors">
            Tarjih
            <span className="text-text-secondary font-normal mx-2">|</span>
            <span className="text-text-secondary text-lg lg:text-xl">ترجيح</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 lg:gap-10 h-full">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative h-full flex items-center text-sm lg:text-base font-semibold transition-colors",
                  active ? "text-brand-red" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {item.label}
                {active && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-brand-red rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            className="text-text-secondary hover:text-text-primary transition-colors p-2.5 rounded-lg hover:bg-border-warm-light cursor-pointer"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            className="text-text-secondary hover:text-text-primary transition-colors p-2.5 rounded-lg hover:bg-border-warm-light cursor-pointer"
            aria-label="Bookmarks"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>

          <button
            onClick={toggleTheme}
            className="text-text-secondary hover:text-text-primary transition-colors p-2.5 rounded-lg hover:bg-border-warm-light cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
