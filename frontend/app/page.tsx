"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Compass,
  ArrowRight,
  BookOpen,
  Layers,
  GitBranch,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [showNoWorkspaceAlert, setShowNoWorkspaceAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("learnloop_active_workspace_id");
    if (saved) {
      setActiveWorkspaceId(saved);
    }
  }, []);

  const handleContinueClick = () => {
    if (!activeWorkspaceId) {
      setShowNoWorkspaceAlert(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <Badge variant="indigo" className="mb-6 px-3 py-1 text-xs tracking-tight">
            Academic Knowledge Foundation
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-[1.15]">
            Know what you need to learn next.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            LearnLoop turns your syllabus and academic goals into a structured learning workspace — so you can understand what you need to focus on before you start studying.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/setup">
              <Button size="lg" className="w-full sm:w-auto px-7 shadow-sm">
                <span>Create Study Plan</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            {activeWorkspaceId ? (
              <Link href={`/workspace/${activeWorkspaceId}`}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-7">
                  <BookOpen className="w-4 h-4 mr-2 text-slate-500" />
                  <span>Continue to Workspace</span>
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={handleContinueClick}
                className="w-full sm:w-auto px-7"
              >
                <span>Continue</span>
              </Button>
            )}
          </div>

          {/* Graceful alert if user clicks Continue without active workspace */}
          {showNoWorkspaceAlert && !activeWorkspaceId && (
            <div className="mt-6 max-w-md mx-auto p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">No existing study workspace found</p>
                <p className="text-amber-800 mb-2">
                  Get started by creating your personalized study workspace with your syllabus.
                </p>
                <Link href="/setup">
                  <span className="font-bold text-slate-900 hover:underline">
                    Create your study plan now →
                  </span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Product Capabilities Architecture */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How LearnLoop Works
            </h2>
            <p className="text-xl font-bold text-slate-900 mt-1">
              Structured Academic Foundation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Syllabus Ingestion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your official PDF syllabus or enter course units manually. LearnLoop structures your topics into a normalized hierarchy.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Prerequisite Knowledge Graph</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every topic is mapped relationally against canonical prerequisites. Understand foundational concepts before tackling advanced topics.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Persistent Study Workspace</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your workspace, units, topics, and past exam materials survive browser reloads and restarts, stored permanently in PostgreSQL.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
