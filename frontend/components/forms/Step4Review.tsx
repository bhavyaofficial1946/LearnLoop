"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  User,
  BookOpen,
  Target,
  Calendar,
  Layers,
  FileText,
  Edit2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Step2Data } from "./Step2SubjectGoal";
import { Step3Data } from "./Step3Materials";

export interface Step4ReviewProps {
  studentName: string;
  step2Data: Step2Data;
  step3Data: Step3Data;
  onEditStep: (step: number) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  studentName,
  step2Data,
  step3Data,
  onEditStep,
  onSubmit,
  isSubmitting,
}) => {
  const [error, setError] = useState<string | null>(null);

  const totalTopics = step3Data.units.reduce((acc, u) => acc + u.topics.length, 0);

  const handleCreate = async () => {
    setError(null);
    try {
      await onSubmit();
    } catch (err: any) {
      setError(err?.message || "Failed to create study workspace. Please try again.");
    }
  };

  return (
    <Card className="max-w-xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Study Plan</h2>
          <p className="text-xs text-slate-500">Review your academic setup before creating your persistent workspace</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Student Section */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Student</p>
              <p className="text-sm font-semibold text-slate-900">{studentName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Subject & Goal Section */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Subject</p>
              <p className="text-sm font-semibold text-slate-900">{step2Data.subjectName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Goal & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Goal</p>
                <p className="text-xs font-semibold text-slate-900 capitalize">
                  {step2Data.goal.replace("_", " ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Exam Date</p>
                <p className="text-xs font-semibold text-slate-900">
                  {step2Data.examDate
                    ? new Date(step2Data.examDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No specific date"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Syllabus Summary */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Syllabus Structure</p>
              <p className="text-sm font-semibold text-slate-900">
                {step3Data.units.length} Units • {totalTopics} Topics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Academic Materials */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Academic Materials</p>
              <p className="text-xs font-semibold text-slate-900">
                {step3Data.previousYearPapers.length} Previous-Year Papers
                {step3Data.syllabusFilename ? ` • 1 Syllabus PDF` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        {error && (
          <Alert type="error" title="Submission Error">
            {error}
          </Alert>
        )}

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => onEditStep(3)}
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </Button>
          <Button
            type="button"
            size="md"
            onClick={handleCreate}
            isLoading={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
          >
            <span>Create Study Workspace</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
