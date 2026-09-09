import React from "react";
import { Compass } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-slate-50/50 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Compass className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-800">LearnLoop</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500">Know what you need to learn next.</span>
        </div>
        <p className="text-xs text-slate-400">
          Structured Academic Study Foundation
        </p>
      </div>
    </footer>
  );
};
