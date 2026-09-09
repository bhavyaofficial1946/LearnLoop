"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const Header: React.FC = () => {
  const [savedWorkspaceId, setSavedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const wsId = localStorage.getItem("learnloop_active_workspace_id");
    if (wsId) {
      setSavedWorkspaceId(wsId);
    }
  }, []);

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <Compass className="w-5 h-5 text-indigo-300 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
              LearnLoop
            </span>
            <span className="text-[10px] font-medium text-slate-500 block leading-none tracking-tight">
              Academic Foundation
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          {savedWorkspaceId ? (
            <Link href={`/workspace/${savedWorkspaceId}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Active Workspace
              </Button>
            </Link>
          ) : null}

          <Link href="/setup">
            <Button size="sm" className="text-xs">
              <span>Create Study Plan</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
