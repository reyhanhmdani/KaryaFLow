import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}

export function Card({
  className = "",
  children,
  interactive = false,
  ...props
}: CardProps) {
  const interactiveClass = interactive
    ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(27,28,30,0.12)] hover:border-[#1B1C1E]/30 cursor-pointer"
    : "transition-colors duration-150";

  return (
    <div
      className={`bg-white border border-[#E2DED3] rounded-2xl shadow-[0_1px_2px_rgba(27,28,30,0.03)] ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`p-4 pb-3 sm:p-5 sm:pb-3.5 border-b border-[#E2DED3]/70 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-base font-semibold text-[#1B1C1E] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-[#73757D] mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#E2DED3]/70 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
