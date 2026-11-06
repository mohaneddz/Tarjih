import { cn } from "@/utils/cn";
import { SourceBadge } from "@/components/ui/asset-badge";
import { KindBadge } from "./kindBadge";
import type { CoreClauseView } from "./database-client";

export type ViewId = "cards" | "dev" | "titles" | "explanations" | "evidence";

export interface ViewOption {
  readonly id: ViewId;
  readonly label: string;
  readonly hint: string;
}

export const VIEW_OPTIONS: readonly ViewOption[] = [
  { id: "cards", label: "Cards", hint: "Every field of each clause" },
  { id: "dev", label: "Dev view", hint: "Clause ids and code, nothing else" },
  { id: "titles", label: "Titles", hint: "One line per clause" },
  { id: "explanations", label: "Explanations", hint: "The notes that explain each clause" },
  { id: "evidence", label: "Evidence", hint: "References and quoted source texts" },
];

export function isViewId(value: string | null): value is ViewId {
  return VIEW_OPTIONS.some((v) => v.id === value);
}

/** "Definitional" names no source, so the clause id says more than it does. */
function clauseTitle(c: CoreClauseView): string {
  return c.reference === "Definitional" ? c.id : c.reference;
}

function HiddenNote({ count, reason }: { count: number; reason: string }) {
  if (count === 0) return null;
  return (
    <p className="text-[12px] text-text-secondary text-center">
      {count} clause{count === 1 ? "" : "s"} without {reason} {count === 1 ? "is" : "are"} hidden in this view.
    </p>
  );
}

interface ClauseListProps {
  readonly clauses: readonly CoreClauseView[];
  readonly onOpen: (clause: CoreClauseView) => void;
}

const rowClass =
  "text-left w-full bg-card-warm border border-border-warm rounded-xl cursor-pointer transition-colors hover:border-brand-red/40";

export function DevList({ clauses, onOpen }: ClauseListProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
      {clauses.map((c) => (
        <button key={c.id} type="button" onClick={() => onOpen(c)} className={cn(rowClass, "p-3 flex flex-col gap-1.5")}>
          <span className="font-mono text-[11px] text-text-secondary">{c.id}</span>
          <code className="font-mono text-[13px] text-text-primary whitespace-pre-wrap break-words">{c.source}</code>
        </button>
      ))}
    </div>
  );
}

export function TitleList({ clauses, onOpen }: ClauseListProps) {
  return (
    <div className="bg-card-warm border border-border-warm rounded-2xl divide-y divide-border-warm-light/60 overflow-hidden">
      {clauses.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpen(c)}
          className="w-full text-left flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-border-warm-light/40"
        >
          <KindBadge kind={c.kind} />
          <span className="text-sm font-semibold text-text-primary truncate">{clauseTitle(c)}</span>
          <span className="font-mono text-[12px] text-text-secondary ml-auto shrink-0">{c.head}</span>
        </button>
      ))}
    </div>
  );
}

export function ExplanationList({ clauses, onOpen }: ClauseListProps) {
  // A clause with no recorded note still has something to say if it quotes a
  // text; one with neither would only be a bare reference, so it is left out.
  const explained = clauses.filter((c) => c.notes || c.text);
  const omitted = clauses.length - explained.length;
  return (
    <div className="flex flex-col gap-3">
      {explained.map((c) => (
        <button key={c.id} type="button" onClick={() => onOpen(c)} className={cn(rowClass, "p-4 flex flex-col gap-1.5")}>
          <span className="text-sm text-brand-red font-semibold">{clauseTitle(c)}</span>
          {c.notes ? (
            <p className="text-sm text-text-primary leading-relaxed">{c.notes}</p>
          ) : (
            <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{c.text}&rdquo;</p>
          )}
        </button>
      ))}
      <HiddenNote count={omitted} reason="a note or quoted text" />
    </div>
  );
}

export function EvidenceList({ clauses, onOpen }: ClauseListProps) {
  // Definitional clauses cite no source; showing them would be rows of "none".
  const cited = clauses.filter((c) => c.reference !== "Definitional" || c.text);
  return (
    <div className="flex flex-col gap-3">
      {cited.map((c) => (
        <button key={c.id} type="button" onClick={() => onOpen(c)} className={cn(rowClass, "p-4 flex flex-col gap-2")}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <KindBadge kind={c.kind} />
              <span className="text-sm text-brand-red font-semibold truncate">{c.reference}</span>
            </div>
            <SourceBadge kind={c.kind} grade={c.grade} size="sm" />
          </div>
          {c.text ? (
            <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{c.text}&rdquo;</p>
          ) : (
            <p className="text-[13px] text-text-secondary/70">No source text quoted.</p>
          )}
        </button>
      ))}
      <HiddenNote count={clauses.length - cited.length} reason="a cited source" />
    </div>
  );
}
