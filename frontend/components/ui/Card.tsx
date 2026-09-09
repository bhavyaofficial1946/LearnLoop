import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 transition-all",
          hoverable && "hover:border-slate-300 hover:shadow-sm",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
