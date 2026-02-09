export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 border-2 border-current border-t-transparent rounded-full animate-spin-slow ${className}`}
      aria-hidden
    />
  );
}

export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex gap-1 ${className}`} aria-hidden>
      <span className="size-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: "0ms" }} />
      <span className="size-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: "150ms" }} />
      <span className="size-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
