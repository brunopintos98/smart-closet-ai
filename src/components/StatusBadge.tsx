import { copy } from "@/copy/es-AR";

export type Status = "working" | "simulated" | "comingSoon";

const STYLES: Record<Status, string> = {
  working: "bg-status-working-bg text-status-working ring-status-working/25",
  simulated: "bg-status-simulated-bg text-status-simulated ring-status-simulated/25",
  comingSoon: "bg-status-soon-bg text-status-soon ring-status-soon/25",
};

const DOT: Record<Status, string> = {
  working: "bg-status-working",
  simulated: "bg-status-simulated",
  comingSoon: "bg-status-soon",
};

/**
 * Required on every feature surface: shows whether it really works,
 * is simulated, or is only a concept ("Próximamente").
 */
export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ring-1 ring-inset ${STYLES[status]} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      {copy.status[status]}
    </span>
  );
}
