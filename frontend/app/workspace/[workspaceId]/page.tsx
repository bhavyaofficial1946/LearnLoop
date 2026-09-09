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
} from "lucide-react";
import {
  WorkspaceOverview,
  KnowledgeMapResponse,
  AcademicMaterial,
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
  const [materials, setMaterials] = useState<AcademicMaterial[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, mapData, materialsData] = await Promise.all([
        api.getWorkspaceOverview(workspaceId),
        api.getKnowledgeMap(workspaceId),
        api.getWorkspaceMaterials(workspaceId),
      ]);

      setOverview(overviewData);
      setKnowledgeMap(mapData);
      setMaterials(materialsData);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      {/* Main Workspace Header */}
      <WorkspaceHeader overview={overview} />

      {/* Workspace Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column: Knowledge Map Tree (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
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
                  <span className="text-slate-500">Database Status:</span>
                  <span className="text-emerald-700 font-semibold">Persisted ✓</span>
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
