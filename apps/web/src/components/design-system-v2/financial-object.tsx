import styles from "./financial-object.module.css";
import type { FinancialObjectDatum, FinancialObjectKind } from "./types";

const glyphDescriptions: Record<FinancialObjectKind, string> = {
  business: "A central business node connected to operating terminals",
  revenue: "A source line entering a measured financial object",
  profit: "Revenue passing through layers to a retained result",
  "cash-flow": "A continuous flow entering and leaving a central object",
  "financial-position": "Balanced assets and claims around a central axis",
  "per-share": "A whole amount divided across individual share units",
  valuation: "A measured value compared with a reference axis",
};

function InnerMark({ kind }: { kind: FinancialObjectKind }) {
  switch (kind) {
    case "business":
      return <><circle cx="24" cy="24" r="5" /><path d="M24 19V9M19 24H9M29 24h10M24 29v10" /></>;
    case "revenue":
      return <><path d="M9 15h20l6 9-6 9H9" /><path d="M16 20h11M16 25h15M16 30h9" /></>;
    case "profit":
      return <><path d="M10 12h28M13 19h22M17 26h14M20 33h8" /><circle cx="24" cy="37" r="2.5" /></>;
    case "cash-flow":
      return <><path d="M8 18h27l-5-5M40 30H13l5 5" /><circle cx="24" cy="24" r="4" /></>;
    case "financial-position":
      return <><path d="M24 10v28M10 18h28M13 18l-4 10h10l-4-10M33 18l-4 10h10l-4-10" /></>;
    case "per-share":
      return <><circle cx="17" cy="24" r="7" /><circle cx="31" cy="17" r="4" /><circle cx="31" cy="31" r="4" /><path d="M24 24h11" /></>;
    case "valuation":
      return <><path d="M10 34V12M10 34h28M15 29l7-8 6 4 8-11" /><circle cx="36" cy="14" r="2.5" /></>;
  }
}

type GlyphProps = { kind: FinancialObjectKind; size?: number } & (
  | { decorative: true; label?: never }
  | { decorative?: false; label: string }
);

export function FinancialObjectGlyph({ kind, label, size = 48, decorative = false }: GlyphProps) {
  return (
    <svg className={styles.glyph} width={size} height={size} viewBox="0 0 48 48" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} focusable="false" data-optical-size={size <= 20 ? "compact" : "default"}>
      {decorative ? null : <title>{label}</title>}
      {decorative ? null : <desc>{glyphDescriptions[kind]}</desc>}
      <rect x="3" y="3" width="42" height="42" rx="10" />
      <InnerMark kind={kind} />
    </svg>
  );
}

export function FinancialObject({ object, selected = false }: { object: FinancialObjectDatum; selected?: boolean }) {
  return (
    <span className={styles.object} data-selected={selected} data-tone={object.tone} data-unavailable={object.unavailable || undefined}>
      <FinancialObjectGlyph kind={object.id} decorative />
      <span><strong>{object.label}</strong><small>{object.summary}</small></span>
    </span>
  );
}
