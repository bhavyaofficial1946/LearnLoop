"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Calendar, Target, ArrowRight, ArrowLeft } from "lucide-react";
import { LearningGoal, Subject } from "@/types";
import { api } from "@/lib/api/client";

export interface Step2Data {
  subjectId?: string;
  subjectName: string;
  goal: LearningGoal;
  examDate?: string;
}

export interface Step2SubjectGoalProps {
  initialData?: Partial<Step2Data>;
  onBack: () => void;
  onNext: (data: Step2Data) => void;
}

export const Step2SubjectGoal: React.FC<Step2SubjectGoalProps> = ({
  initialData,
  onBack,
  onNext,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subjectId || "");
  const [customSubjectName, setCustomSubjectName] = useState<string>(initialData?.subjectName || "");
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [goal, setGoal] = useState<LearningGoal>(initialData?.goal || "exam_preparation");
  const [examDate, setExamDate] = useState<string>(initialData?.examDate || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    async function loadSubjects() {
      try {
        const list = await api.getSubjects();
        if (mounted) {
          setSubjects(list);
          if (!selectedSubjectId && list.length > 0) {
            // Default to canonical DSA subject
            const dsa = list.find((s) => s.slug === "data-structures-and-algorithms") || list[0];
            setSelectedSubjectId(dsa.id);
            setCustomSubjectName(dsa.name);
          }
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      } finally {
        if (mounted) setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubjectSelect = (sub: Subject) => {
    setSelectedSubjectId(sub.id);
    setCustomSubjectName(sub.name);
    setIsCustomSubject(false);
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: "" }));
    }
  };

  const handleCustomToggle = () => {
    setIsCustomSubject(true);
    setSelectedSubjectId("");
    setCustomSubjectName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    let finalSubjectName = customSubjectName.trim();
    if (!isCustomSubject && selectedSubjectId) {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      if (sub) finalSubjectName = sub.name;
    }

    if (!finalSubjectName) {
      newErrors.subject = "Please select or enter a subject name.";
    }

    if (goal === "exam_preparation" && !examDate) {
      newErrors.examDate = "Exam date is required when learning goal is Exam preparation.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({
      subjectId: isCustomSubject ? undefined : selectedSubjectId || undefined,
      subjectName: finalSubjectName,
      goal,
      examDate: examDate ? examDate : undefined,
    });
  };

  return (
    <Card className="max-w-xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Subject & Academic Goal</h2>
          <p className="text-xs text-slate-500">Define your subject focus and academic deadline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>

          {isLoadingSubjects ? (
            <div className="text-xs text-slate-400 py-2">Loading supported knowledge subjects...</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {subjects.map((sub) => {
                  const isSelected = !isCustomSubject && selectedSubjectId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleSubjectSelect(sub)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{sub.name}</p>
                          <p className="text-xs text-slate-500">Complete canonical prerequisite graph included</p>
                        </div>
                      </div>
                      <Badge variant="indigo" className="text-[11px]">
                        Supported
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Custom Subject Option */}
              <div className="pt-1">
                {!isCustomSubject ? (
                  <button
                    type="button"
                    onClick={handleCustomToggle}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    + Enter a different subject
                  </button>
                ) : (
                  <div className="mt-2 p-3.5 rounded-xl border border-slate-900 bg-slate-50/80 ring-1 ring-slate-900">
                    <Input
                      label="Subject Name"
                      placeholder="e.g. Operating Systems"
                      value={customSubjectName}
                      onChange={(e) => {
                        setCustomSubjectName(e.target.value);
                        if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
                      }}
                      error={errors.subject}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSubject(false);
                        if (subjects.length > 0) handleSubjectSelect(subjects[0]);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 mt-2 block"
                    >
                      ← Back to supported subjects
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {errors.subject && !isCustomSubject && <p className="mt-1.5 text-xs text-red-600">{errors.subject}</p>}
        </div>

        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Learning Goal</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => {
                setGoal("exam_preparation");
                if (errors.examDate && examDate) {
                  setErrors((prev) => ({ ...prev, examDate: "" }));
                }
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                goal === "exam_preparation"
                  ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">Exam Preparation</span>
              </div>
              <p className="text-xs text-slate-500">Target a specific exam date with structured timeline review</p>
            </div>

            <div
              onClick={() => {
                setGoal("concept_mastery");
                setErrors((prev) => ({ ...prev, examDate: "" }));
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                goal === "concept_mastery"
                  ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">Concept Mastery</span>
              </div>
              <p className="text-xs text-slate-500">Self-paced deep understanding of foundational concepts</p>
            </div>
          </div>
        </div>

        {/* Exam Date (Required for Exam Prep, Optional for Concept Mastery) */}
        <div>
          <Input
            id="exam-date"
            type="date"
            label={goal === "exam_preparation" ? "Exam Date (Required)" : "Target Completion Date (Optional)"}
            value={examDate}
            onChange={(e) => {
              setExamDate(e.target.value);
              if (errors.examDate) setErrors((prev) => ({ ...prev, examDate: "" }));
            }}
            error={errors.examDate}
            helperText={
              goal === "exam_preparation"
                ? "Used to calculate your preparation timeline."
                : "Optional deadline for pacing your studies."
            }
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button type="button" variant="ghost" size="md" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </Button>
          <Button type="submit" size="md">
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
