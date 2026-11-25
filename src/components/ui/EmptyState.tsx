import React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#D9DADC] bg-white/50 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-[#71757E] mb-3">
        {icon || <Inbox className="w-5 h-5 stroke-[1.5]" />}
      </div>
      <h4 className="text-sm font-semibold text-[#2B2D31]">{title}</h4>
      {description && (
        <p className="text-xs text-[#71757E] max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] transition-colors shadow-xs"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFC93C] hover:bg-[#F5BD29] text-[#2B2D31] transition-colors shadow-xs"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
