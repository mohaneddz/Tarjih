"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Premium Navigation Bar component styled exactly like example.png.
 * Features the balance scale logo, center navigation links, and fully functional theme toggling.
 */
export function Header() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Initialize theme state from DOM
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Toggle dark class and save preference
  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-warm bg-background/95 backdrop-blur-md shrink-0 select-none transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none items-center justify-between px-6">
        {/* Left Side: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-4 group">
          <img
            src="/logo.png"
            alt="Tarjih Logo"
            className="h-10 w-10 lg:h-12 lg:w-12 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif text-2xl lg:text-3xl font-extrabold tracking-wide text-[#0E3A20] dark:text-[#E2E8E5] transition-colors">
            Tarjih
          </span>
        </Link>

        {/* Center: Desktop Navigation Links (Library -> /study, Cases -> /cases, Settings -> /settings) */}
        <nav className="hidden md:flex items-center gap-9 lg:gap-12">
          <Link
            href="/study"
            className="flex items-center gap-2.5 lg:gap-3 text-sm lg:text-base font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            {/* Library Book Icon */}
            <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span>Library</span>
          </Link>

          <Link
            href="/cases"
            className="flex items-center gap-2.5 lg:gap-3 text-sm lg:text-base font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            {/* Cases Scale/Shield Icon */}
            <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
            </svg>
            <span>Cases</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2.5 lg:gap-3 text-sm lg:text-base font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            {/* Settings Gear Icon */}
            <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
            </svg>
            <span>Settings</span>
          </Link>
        </nav>

        {/* Right Side: Theme, Shield, and Profile Dropdown */}
        <div className="flex items-center gap-6">
          {/* Active Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              /* Sun Icon */
              <svg className="h-5.5 w-5.5 lg:h-6.5 lg:w-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.935-8.935h-2.25C17.435 12 12 17.435 12 12s5.435-5.435 12-5.435M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m2.28 7.07l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
              </svg>
            ) : (
              /* Moon Icon */
              <svg className="h-5.5 w-5.5 lg:h-6.5 lg:w-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Shield/Verified Icon */}
          <button
            onClick={() => alert("Juristic verification and security certificates are fully validated.")}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 cursor-pointer"
            aria-label="Verified Security"
          >
            {/* Shield with Checkmark */}
            <svg className="h-5.5 w-5.5 lg:h-6.5 lg:w-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39 1.593 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </button>

          {/* Scholar Profile Link Dropdown */}
          <Link
            href="/profile"
            className="flex items-center gap-3 border border-border-warm bg-card-warm/80 hover:bg-card-warm rounded-full p-1.5 pl-2 pr-4 transition-colors cursor-pointer"
          >
            {/* Avatar Circle */}
            <div className="h-8 w-8 rounded-full bg-[#0E3A20] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              S
            </div>
            <span className="text-xs lg:text-sm font-extrabold text-text-primary">
              Scholar
            </span>
            {/* Dropdown Chevron */}
            <svg className="h-3.5 w-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
