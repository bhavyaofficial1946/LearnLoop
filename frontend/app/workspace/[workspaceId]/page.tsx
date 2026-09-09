"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WorkspaceHeader } from "@/components/academic/WorkspaceHeader";
import { KnowledgeMapTree } from "@/components/academic/KnowledgeMapTree";
import { TopicDetailDrawer } from "@/components/academic/TopicDetailDrawer";
import { AcademicMaterialsSection } from "@/components/academic/AcademicMaterialsSection";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Layers,
  Compass,
  FileText,
  Plus,
  RotateCcw,
  ArrowLeft,
  Share2,
  Award,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import {
  WorkspaceOverview,
  KnowledgeMapResponse,
  AcademicMaterial,
  WorkspaceMasterySummary,
} from "@/types";
import { api } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspaceDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeMapResponse | null>(null);
  const [masterySummary, setMasterySummary] = useState<WorkspaceMasterySummary | null>(null);
  const [materials, setMaterials] = useState<AcademicMaterial[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, mapData, materialsData, masteryData] = await Promise.all([
        api.getWorkspaceOverview(workspaceId),
        api.getKnowledgeMap(workspaceId),
        api.getWorkspaceMaterials(workspaceId),
        api.getWorkspaceMastery(workspaceId).catch(() => null),
      ]);

      setOverview(overviewData);
      setKnowledgeMap(mapData);
      setMaterials(materialsData);
      setMasterySummary(masteryData);

      // Save as active workspace in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("learnloop_active_workspace_id", workspaceId);
      }
    } catch (err: any) {
      console.error("Error loading study workspace:", err);
      setError(
        err?.message ||
          "We couldn't connect to LearnLoop or find this study workspace. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <Spinner size="lg" label="Loading study workspace & knowledge map..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16">
          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Workspace Unavailable</h1>
            <p className="text-xs text-slate-600 leading-relaxed">{error || "Workspace not found."}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={loadWorkspaceData}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
              <Link href="/setup">
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create New Workspace
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isAssessed = Boolean(masterySummary && (masterySummary.has_baseline || masterySummary.assessed_topics_count > 0));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      {/* Main Workspace Header */}
      <WorkspaceHeader overview={overview} masterySummary={masterySummary} />

      {/* Workspace Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column: Knowledge Map Tree (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Knowledge Baseline Overview Card */}
            <Card className="p-6 bg-white border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Knowledge Baseline Overview
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAssessed
                      ? "Evaluated topic mastery based on your diagnostic assessment responses."
                      : "Establish your topic-by-topic understanding baseline through a short diagnostic assessment."}
                  </p>
                </div>

                <Link href={`/workspace/${workspaceId}/assessment`}>
                  <Button size="sm" variant={isAssessed ? "outline" : "primary"} className="text-xs shrink-0 font-medium">
                    {isAssessed ? "Retake Diagnostic" : "Assess My Knowledge"}
                    <ArrowRight className="w-3 h-3 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {isAssessed && masterySummary ? (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                      Strong
                    </span>
                    <span className="text-2xl font-bold text-emerald-900 mt-0.5 block">
                      {masterySummary.strong_count}
                    </span>
                    <span className="text-[10px] text-emerald-700">Solid comprehension</span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                      Developing
                    </span>
                    <span className="text-2xl font-bold text-amber-900 mt-0.5 block">
                      {masterySummary.developing_count}
                    </span>
                    <span className="text-[10px] text-amber-700">Partial evidence</span>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                    <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
                      Needs Attention
                    </span>
                    <span className="text-2xl font-bold text-rose-900 mt-0.5 block">
                      {masterySummary.needs_attention_count}
                    </span>
                    <span className="text-[10px] text-rose-700">Gaps identified</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Not Assessed
                    </span>
                    <span className="text-2xl font-bold text-slate-800 mt-0.5 block">
                      {masterySummary.not_assessed_count}
                    </span>
                    <span className="text-[10px] text-slate-500">Awaiting evaluation</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Your knowledge baseline hasn&apos;t been established yet.</span>
                  <Link href={`/workspace/${workspaceId}/assessment`}>
                    <span className="text-indigo-600 font-semibold hover:underline">
                      Take 10-12 question diagnostic →
                    </span>
                  </Link>
                </div>
              )}
            </Card>

            <div className="flex items-center justify-between pt-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Knowledge Map</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Structured syllabus hierarchy with prerequisite links. Click any topic to inspect details.
                </p>
              </div>
            </div>

            {knowledgeMap && knowledgeMap.units.length > 0 ? (
              <KnowledgeMapTree
                units={knowledgeMap.units}
                onSelectTopic={(id) => setSelectedTopicId(id)}
                selectedTopicId={selectedTopicId || undefined}
              />
            ) : (
              <Card className="p-8 text-center text-xs text-slate-400">
                No syllabus units found in this workspace.
              </Card>
            )}
          </div>

          {/* Sidebar Column: Academic Materials & Workspace Info (1 col on large screen) */}
          <div className="space-y-6">
            <AcademicMaterialsSection
              workspaceId={workspaceId}
              initialMaterials={materials}
              onMaterialsChanged={loadWorkspaceData}
            />

            {/* Academic Info Card */}
            <Card className="p-5 space-y-3 bg-slate-50/80 border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Workspace Foundation
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Workspace ID:</span>
                  <span className="font-mono text-[11px] text-slate-800">{workspaceId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-medium text-slate-900">{overview.student_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-medium text-slate-900">{overview.subject_name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Knowledge State:</span>
                  <span className={isAssessed ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                    {isAssessed ? `${masterySummary?.assessed_topics_count} Topics Assessed ✓` : "Pending Diagnostic"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Topic Detail Drawer */}
      <TopicDetailDrawer
        workspaceId={workspaceId}
        topicId={selectedTopicId}
        onClose={() => setSelectedTopicId(null)}
        onSelectAnotherTopic={(id) => setSelectedTopicId(id)}
      />

      <Footer />
    </div>
  );
}

