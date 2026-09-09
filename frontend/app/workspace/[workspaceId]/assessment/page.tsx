"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import {
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import {
  DiagnosticAssessment,
  AssessmentResult,
  WorkspaceOverview,
  DiagnosticQuestion,
} from "@/types";
import { api } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function AssessmentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;
  const router = useRouter();

  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [assessment, setAssessment] = useState<DiagnosticAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // Load workspace overview and check if an active diagnostic exists
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, existingAssessment] = await Promise.all([
        api.getWorkspaceOverview(workspaceId),
        api.getCurrentDiagnostic(workspaceId).catch(() => null),
      ]);

      setOverview(overviewData);

      if (existingAssessment) {
        setAssessment(existingAssessment);
        // If it's already in progress, we can resume directly
        setShowIntro(false);
      }
    } catch (err: any) {
      console.error("Error loading assessment data:", err);
      setError(err?.message || "Failed to connect to the diagnostic assessment service.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Start a new assessment
  const handleStartAssessment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newAssessment = await api.startDiagnostic(workspaceId, 12);
      setAssessment(newAssessment);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setResult(null);
      setShowIntro(false);
    } catch (err: any) {
      console.error("Error starting diagnostic:", err);
      setError(err?.message || "Could not generate diagnostic assessment for this workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select an option and persist answer to backend
  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!assessment || result) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    try {
      setIsSubmittingAnswer(true);
      await api.submitDiagnosticAnswer(workspaceId, assessment.id, questionId, optionId);
    } catch (err) {
      console.error("Failed to persist answer choice:", err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Complete the assessment and get graded results + updated topic mastery
  const handleCompleteAssessment = async () => {
    if (!assessment) return;

    setIsCompleting(true);
    setError(null);
    try {
      const assessmentResult = await api.completeDiagnostic(workspaceId, assessment.id);
      setResult(assessmentResult);
    } catch (err: any) {
      console.error("Error completing diagnostic:", err);
      setError(err?.message || "Failed to submit and evaluate diagnostic assessment.");
    } finally {
      setIsCompleting(false);
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "advanced":
        return <Badge variant="warning" className="text-[10px] py-0.5 px-2">Advanced</Badge>;
      case "intermediate":
        return <Badge variant="indigo" className="text-[10px] py-0.5 px-2">Intermediate</Badge>;
      case "beginner":
      default:
        return <Badge variant="secondary" className="text-[10px] py-0.5 px-2">Beginner</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <Spinner size="lg" label="Preparing diagnostic assessment..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !assessment && !result) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16">
          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Diagnostic Unavailable</h1>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={loadInitialData}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
              <Link href={`/workspace/${workspaceId}`}>
                <Button size="sm">Back to Workspace</Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // 1. RESULTS VIEW
  if (result) {
    const strongTopics = result.topic_masteries.filter((t) => t.status === "strong");
    const developingTopics = result.topic_masteries.filter((t) => t.status === "developing");
    const needsAttentionTopics = result.topic_masteries.filter((t) => t.status === "needs_attention");
    const notAssessedTopics = result.topic_masteries.filter((t) => t.status === "not_assessed");

    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Results Header Card */}
          <Card className="p-8 bg-white border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs py-1 px-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Diagnostic Evaluation Complete
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
                  Knowledge Baseline Established
                </h1>
                <p className="text-xs text-slate-500">
                  {overview?.subject_name} • Assessed across {result.topic_masteries.length} curriculum topics
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/workspace/${workspaceId}`}>
                  <Button size="md" className="font-semibold shadow-xs">
                    View Knowledge Map
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Performance Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Questions Evaluated
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {result.total_questions}
                </span>
                <span className="text-[10px] text-slate-500">Diagnostic sample</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Correct Answers
                </span>
                <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                  {result.correct_count}
                </span>
                <span className="text-[10px] text-emerald-700">Verified correct</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
                  Incorrect Answers
                </span>
                <span className="text-2xl font-bold text-rose-900 mt-1 block">
                  {result.incorrect_count}
                </span>
                <span className="text-[10px] text-rose-700">Concepts with gaps</span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider block">
                  Assessed Topics
                </span>
                <span className="text-2xl font-bold text-indigo-900 mt-1 block">
                  {result.topic_masteries.filter(t => t.status !== "not_assessed").length}
                </span>
                <span className="text-[10px] text-indigo-700">Topic nodes updated</span>
              </div>
            </div>
          </Card>

          {/* Topic Understanding Baseline Groups */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Topic Understanding Profile</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic knowledge estimation calculated directly from your assessment evidence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strong */}
              <div className="p-5 rounded-xl bg-white border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Strong Understanding
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-50">
                    {strongTopics.length}
                  </span>
                </div>

                {strongTopics.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {strongTopics.map((topic) => (
                      <li key={topic.topic_id} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{topic.topic_name}</span>
                        <span className="text-[11px] text-emerald-700 font-medium">{topic.correct_answers} correct</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center italic">No topics categorized as strong yet.</p>
                )}
              </div>

              {/* Developing */}
              <div className="p-5 rounded-xl bg-white border border-amber-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Developing
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-800 px-2 py-0.5 rounded-full bg-amber-50">
                    {developingTopics.length}
                  </span>
                </div>

                {developingTopics.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {developingTopics.map((topic) => (
                      <li key={topic.topic_id} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100/80 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{topic.topic_name}</span>
                        <span className="text-[11px] text-amber-700 font-medium">{topic.correct_answers}/{topic.evidence_count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center italic">No topics categorized as developing.</p>
                )}
              </div>

              {/* Needs Attention */}
              <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Needs Attention
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-rose-800 px-2 py-0.5 rounded-full bg-rose-50">
                    {needsAttentionTopics.length}
                  </span>
                </div>

                {needsAttentionTopics.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {needsAttentionTopics.map((topic) => (
                      <li key={topic.topic_id} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100/80 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{topic.topic_name}</span>
                        <span className="text-[11px] text-rose-700 font-medium">{topic.incorrect_answers} incorrect</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center italic">No knowledge gaps identified.</p>
                )}
              </div>
            </div>

            {/* Not Assessed Topics Note */}
            {notAssessedTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  <strong>{notAssessedTopics.length} remaining topics</strong> were not assessed in this short diagnostic sample.
                </span>
                <span className="text-[11px] text-slate-500">Remaining syllabus topics remain marked as Not Assessed</span>
              </div>
            )}
          </div>

          {/* Academic Question Review & Explanations */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Question Review & Explanations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed pedagogical explanations for every diagnostic question.
              </p>
            </div>

            <div className="space-y-3">
              {result.results.map((q, idx) => {
                const isExpanded = Boolean(expandedExplanation[q.question_id]);
                return (
                  <div
                    key={q.question_id}
                    className={`rounded-xl border transition-all ${
                      q.is_correct ? "border-slate-200 bg-white" : "border-rose-200/80 bg-rose-50/20"
                    }`}
                  >
                    <div
                      onClick={() =>
                        setExpandedExplanation((prev) => ({
                          ...prev,
                          [q.question_id]: !prev[q.question_id],
                        }))
                      }
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                          {q.is_correct ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-900">
                              Question {idx + 1}
                            </span>
                            {q.topic_name && (
                              <span className="text-slate-500">• {q.topic_name}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5 line-clamp-1">
                            {q.question_text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            q.is_correct
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {q.is_correct ? "Correct" : "Incorrect"}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs">
                        <p className="text-sm font-medium text-slate-900 leading-relaxed">
                          {q.question_text}
                        </p>

                        {/* Explanation Box */}
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                            Academic Explanation
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {q.explanation || "Evaluation established from conceptual rubric."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 pb-12 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleStartAssessment}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Retake Diagnostic
            </Button>

            <Link href={`/workspace/${workspaceId}`}>
              <Button size="md" className="font-semibold shadow-xs">
                Back to Workspace Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 2. INTRO VIEW (Before starting)
  if (showIntro || !assessment) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Header />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
          <Card className="p-8 bg-white border-slate-200 space-y-6">
            <div className="space-y-2">
              <Badge variant="indigo" className="text-xs py-1 px-2.5">
                <Award className="w-3.5 h-3.5 mr-1.5" />
                Initial Knowledge Diagnostic
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Establish Your Knowledge Baseline
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                LearnLoop uses diagnostic assessment responses to determine topic-level understanding
                across your syllabus rather than guessing based on time spent.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Assessment Details
              </h3>
              <ul className="space-y-2 list-disc list-inside text-slate-600">
                <li>
                  <strong>10–12 Conceptual Questions:</strong> Derived from your active syllabus topics.
                </li>
                <li>
                  <strong>Prerequisite Aware:</strong> Tests fundamental data structures and algorithmic concepts.
                </li>
                <li>
                  <strong>Safe & Resumable:</strong> Answers are saved as you make choices.
                </li>
                <li>
                  <strong>Immediate Baseline:</strong> Results update your Knowledge Map topic nodes instantly.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link href={`/workspace/${workspaceId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </Link>

              <Button size="md" onClick={handleStartAssessment} className="font-semibold shadow-xs">
                Begin Diagnostic Assessment
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  // 3. ACTIVE ASSESSMENT VIEW
  const currentQuestion: DiagnosticQuestion = assessment.questions[currentQuestionIndex];
  const totalQuestions = assessment.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const selectedOptionId = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      {/* Assessment Header Bar */}
      <div className="w-full bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${workspaceId}`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Assessment</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-800">
              {overview?.subject_name} Diagnostic
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Question <strong>{currentQuestionIndex + 1}</strong> of <strong>{totalQuestions}</strong>
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentQuestion ? (
          <Card className="p-6 sm:p-8 bg-white border-slate-200 space-y-6">
            {/* Topic & Difficulty Tag */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Topic: {currentQuestion.topic_name || "Data Structures"}
                </span>
              </div>
              <div>{getDifficultyBadge(currentQuestion.difficulty)}</div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedOptionId === opt.id;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {letter}
                    </div>

                    <div className="flex-1 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                      {opt.option_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress & Navigation Controls */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {isLastQuestion ? (
                  <Button
                    size="sm"
                    onClick={handleCompleteAssessment}
                    disabled={isCompleting || !selectedOptionId}
                    className="font-semibold shadow-xs"
                  >
                    {isCompleting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        Complete & Evaluate Baseline
                        <CheckCircle2 className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  >
                    Next Question
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="text-center py-12">
            <Spinner size="md" label="Loading question..." />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
