/**
 * Blackout presentational primitives.
 *
 * Purely visual building blocks for the Blackout design language: registration
 * marks, section seams and hairline rules. No application logic, no state, no
 * data access -- these exist so the technical linework stays consistent across
 * pages without repeating markup.
 */

import React from "react";

/** A single plus-shaped registration mark. */
export function Mark({
  accent = false,
  className = "",
}: {
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`bo-mark ${accent ? "bo-mark-accent" : ""} ${className}`}
    />
  );
}

/** Four registration marks pinned to the corners of a relatively positioned panel. */
export function Corners({ accent = false }: { accent?: boolean }) {
  const cls = `bo-mark absolute ${accent ? "bo-mark-accent" : ""}`;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${cls} -left-[5px] -top-[5px]`} />
      <span className={`${cls} -right-[5px] -top-[5px]`} />
      <span className={`${cls} -bottom-[5px] -left-[5px]`} />
      <span className={`${cls} -bottom-[5px] -right-[5px]`} />
    </span>
  );
}

/** A section seam: one hairline terminated by registration marks. */
export function Seam({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center ${className}`}
    >
      <Mark />
      <span className="h-px flex-1 bg-line-1" />
      <Mark />
    </div>
  );
}

/** An eyebrow: live dot, technical label, trailing rule. */
export function Eyebrow({
  children,
  live = false,
  className = "",
}: {
  children: React.ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {live ? (
        <span className="bo-pulse" aria-hidden="true" />
      ) : (
        <Mark accent />
      )}
      <span className="bo-label text-teal">{children}</span>
      <span className="h-px flex-1 bg-line-1" aria-hidden="true" />
    </div>
  );
}

/** A labelled readout row -- the system's atom for key/value technical data. */
export function Readout({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2.5 ${className}`}
    >
      <span className="bo-label-sm shrink-0 pt-0.5">{label}</span>
      <div className="min-w-0 text-right text-sm text-ink">{children}</div>
    </div>
  );
}
