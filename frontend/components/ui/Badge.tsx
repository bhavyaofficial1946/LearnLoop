import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "indigo";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium";

  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    secondary: "bg-slate-50 text-slate-600 border border-slate-200",
    outline: "bg-transparent text-slate-700 border border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], className))}>
      {children}
    </span>
  );
};
