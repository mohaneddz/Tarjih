import { cn } from "@/utils/cn";

const KIND_BADGE: Record<string, string> = {
  quran: "bg-brand-green-light text-brand-green",
  sunnah: "bg-brand-red-light text-brand-red",
  ijma: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
  qiyas: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  qaida: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
  usul: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  istihsan: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300",
  urf: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  ontology: "bg-border-warm-light text-text-secondary",
};

const KIND_ICON_PATH: Record<string, string> = {
  // Open book — a primary scriptural text.
  quran: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  // Speech bubble — a narrated saying.
  sunnah: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  // People — the scholarly consensus of a generation.
  ijma: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  // Crossed arrows — reasoning by analogy from one case to another.
  qiyas: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  // Ruler/document — a codified legal maxim.
  qaida: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  // Academic cap — foundational methodology (usul al-fiqh).
  usul: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443",
  // Sparkles — juristic preference, a discretionary departure from strict analogy.
  istihsan: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
  // Globe — recognised custom of a people (urf).
  urf: "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3s4.5 4.03 4.5 9-2.015 9-4.5 9zM3.6 9h16.8M3.6 15h16.8",
  // Branching hierarchy — structural ontology (subclass/instance links).
  ontology: "M13.5 4.5L21 12l-7.5 7.5M3 12h18M3 6h6M3 18h6",
};

export function KindIcon({ kind, className }: { kind: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={KIND_ICON_PATH[kind] ?? KIND_ICON_PATH.ontology} />
    </svg>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0", KIND_BADGE[kind] ?? KIND_BADGE.ontology)}>
      <KindIcon kind={kind} className="h-3 w-3 shrink-0" />
      {kind}
    </span>
  );
}
