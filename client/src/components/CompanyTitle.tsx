import { Link } from "react-router-dom";

const defaultTagline = "Inversiones y desarrollo";

export function CompanyTitle({
  tagline = defaultTagline,
  asLink = false,
  size = "default",
}: {
  tagline?: string;
  asLink?: boolean;
  size?: "default" | "compact";
}) {
  const className = size === "compact"
    ? "text-xl font-bold tracking-tight"
    : "text-3xl font-extrabold tracking-tight sm:text-4xl";

  const content = (
    <>
      <span
        className={`bg-linear-to-r from-stone-800 via-stone-700 to-emerald-800 bg-clip-text text-transparent ${className}`}
        style={{ fontFamily: '"Syne", system-ui, sans-serif' }}
      >
        Desarrollos Palo Blanco
      </span>
      {tagline && (
        <p className={size === "compact" ? "text-xs text-stone-500 mt-0.5" : "text-sm text-stone-500 mt-2"}>
          {tagline}
        </p>
      )}
    </>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 rounded-lg">
        {content}
      </Link>
    );
  }

  return <div className="text-center">{content}</div>;
}
