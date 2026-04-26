"use client";

export function PublicCasePrintButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      Print flyer
    </button>
  );
}
