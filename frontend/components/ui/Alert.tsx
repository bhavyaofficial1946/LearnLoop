import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  className,
}) => {
  const styles = {
    info: {
      bg: "bg-blue-50/70 border-blue-200 text-blue-900",
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-amber-50/70 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: "bg-red-50/70 border-red-200 text-red-900",
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div className={twMerge(clsx("p-4 rounded-xl border flex items-start gap-3 text-sm", current.bg, className))}>
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <div className="text-sm leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
};
