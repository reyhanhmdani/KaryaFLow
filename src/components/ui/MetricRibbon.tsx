import React from "react";

export interface MetricRibbonItem {
  label: string;
  value: React.ReactNode;
  helper?: string;
  accent?: "neutral" | "emerald" | "amber" | "rose" | "blue";
  icon?: React.ReactNode;
  /** Force full-width row on mobile/tablet when value is long (e.g. IDR currency) */
  wide?: boolean;
}

interface MetricRibbonProps {
  items: MetricRibbonItem[];
  className?: string;
}

const dotColorMap: Record<NonNullable<MetricRibbonItem["accent"]>, string> = {
  neutral: "bg-[#1B1C1E]",
  emerald: "bg-emerald-600",
  amber: "bg-[#D99B06]",
  rose: "bg-rose-600",
  blue: "bg-blue-600",
};

const valueColorMap: Record<NonNullable<MetricRibbonItem["accent"]>, string> = {
  neutral: "text-[#1B1C1E]",
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  rose: "text-rose-800",
  blue: "text-blue-800",
};

function isWideValue(item: MetricRibbonItem): boolean {
  if (typeof item.wide === "boolean") return item.wide;
  if (typeof item.value === "string") {
    return item.value.length > 8;
  }
  return false;
}

/**
 * Architectural divided metric strip:
 * - Short metrics sit side-by-side (2 columns on mobile/tablet, 4 columns on desktop).
 * - Long multi-digit metrics (like IDR amounts) automatically span full width (col-span-2) on mobile/tablet.
 */
export function MetricRibbon({ items, className = "" }: MetricRibbonProps) {
  const initialWide = items.map(isWideValue);

  // Compute mobile 2-col spans so no single short cell is left stranded next to a blank gap
  const spans = [...initialWide];
  let colCursor = 0;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]) {
      if (colCursor === 1 && i > 0) {
        spans[i - 1] = true;
      }
      colCursor = 0;
    } else {
      const nextIsWide = i + 1 < spans.length && spans[i + 1];
      const isLast = i === spans.length - 1;
      if (colCursor === 0 && (nextIsWide || isLast)) {
        spans[i] = true;
        colCursor = 0;
      } else {
        colCursor = (colCursor + 1) % 2;
      }
    }
  }

  return (
    <div
      className={`bg-[#E2DED3] border border-[#E2DED3] rounded-2xl grid grid-cols-2 lg:grid-cols-4 gap-px shadow-[0_1px_2px_rgba(27,28,30,0.03)] overflow-hidden ${className}`}
    >
      {items.map((item, idx) => {
        const accent = item.accent ?? "neutral";
        const spanFullMobile = spans[idx];

        return (
          <div
            key={item.label}
            className={`bg-white p-4 sm:p-5 flex flex-col justify-between gap-2 min-w-0 ${
              spanFullMobile ? "col-span-2 lg:col-span-1" : "col-span-1"
            }`}
          >
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColorMap[accent]}`}
                  aria-hidden="true"
                />
                <span className="text-[11px] sm:text-xs font-medium text-[#5C5E66] leading-tight">
                  {item.label}
                </span>
              </div>
              {item.icon && (
                <span className="text-[#73757D] shrink-0">{item.icon}</span>
              )}
            </div>

            <div
              className={`font-mono font-bold tracking-tight tabular-nums break-words ${
                spanFullMobile ? "text-xl sm:text-2xl" : "text-lg sm:text-2xl"
              } ${valueColorMap[accent]}`}
            >
              {item.value}
            </div>

            {item.helper && (
              <p className="text-[11px] text-[#73757D] leading-snug">
                {item.helper}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
