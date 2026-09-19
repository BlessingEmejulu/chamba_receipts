/**
 * The Chamba Receipts mark.
 *
 * A receipt drawn as a technical object: square shoulders, a torn base, two
 * hairline ledger rules and a third, shorter rule in gold -- the total, the
 * thing being proven. Built on a 24-unit grid so the strokes land on whole
 * pixels at 24px, 32px and 48px.
 *
 * Colour is inherited from `currentColor`, so the mark takes the colour of
 * whatever it sits in. The accent rule is styled by `.chamba-mark-accent`
 * in globals.css, which turns it deep teal for print.
 */

export function ChambaMark({
  className = "",
  accent = true,
  title,
}: {
  className?: string;
  accent?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}

      {/* Receipt body, torn along the base */}
      <path
        d="M4.75 3.75h14.5v15.25l-1.8 1.9-1.82-1.9-1.81 1.9-1.82-1.9-1.81 1.9-1.82-1.9-1.81 1.9-1.8-1.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Ledger rules */}
      <path
        d="M8 8.75h8M8 12.25h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />

      {/* The total */}
      <path
        d="M8 15.75h4.5"
        className={accent ? "chamba-mark-accent" : undefined}
        stroke={accent ? undefined : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
