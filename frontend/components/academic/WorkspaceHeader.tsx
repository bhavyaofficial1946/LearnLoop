"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar, Target, BookOpen, Layers, FileText, User, Award, ArrowRight } from "lucide-react";
import { WorkspaceOverview, WorkspaceMasterySummary } from "@/types";

export interface WorkspaceHeaderProps {
  overview: WorkspaceOverview;
  masterySummary?: WorkspaceMasterySummary | null;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ overview, masterySummary }) => {
  const isAssessed = Boolean(masterySummary && (masterySummary.has_baseline || masterySummary.assessed_topics_count > 0));

  return (
    <div className="w-full bg-white border-b border-slate-200/80 pb-6 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top bar: Student & Goal status */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>Workspace: {overview.student_name}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {overview.goal === "exam_preparation" ? (
              <Badge variant="indigo" className="text-xs py-1 px-2.5">
                <Target className="w-3 h-3 mr-1.5" />
                Exam Preparation
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs py-1 px-2.5">
                <BookOpen className="w-3 h-3 mr-1.5" />
                Concept Mastery
              </Badge>
            )}

            {overview.exam_date && (
              <Badge variant="warning" className="text-xs py-1 px-2.5">
                <Calendar className="w-3 h-3 mr-1.5" />
                Exam:{" "}
                {new Date(overview.exam_date).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {overview.days_remaining !== null && overview.days_remaining !== undefined && (
                  <span className="ml-1 font-bold">({overview.days_remaining} days left)</span>
                )}
              </Badge>
            )}

            {isAssessed ? (
              <Badge variant="secondary" className="text-xs py-1 px-2.5 border-emerald-200 bg-emerald-50 text-emerald-800">
                <Award className="w-3 h-3 mr-1.5 text-emerald-600" />
                Baseline Established
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs py-1 px-2.5 border-amber-300 bg-amber-50 text-amber-800">
                Baseline Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {overview.subject_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Structured Academic Knowledge Workspace
            </p>
          </div>

          {/* Action & Metrics Summary */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/workspace/${overview.id}/assessment`}>
              <Button size="sm" variant={isAssessed ? "outline" : "primary"} className="text-xs font-semibold shadow-xs">
                <Award className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                {isAssessed ? "Retake Diagnostic" : "Assess My Knowledge"}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>
                  <strong className="text-slate-900">{overview.total_units}</strong> Units
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>
                  <strong className="text-slate-900">{overview.total_topics}</strong> Topics
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>
                  <strong className="text-slate-900">{overview.total_materials}</strong> Materials
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

