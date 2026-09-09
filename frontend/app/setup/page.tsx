"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SetupProgress } from "@/components/layout/SetupProgress";
import { Step1Student } from "@/components/forms/Step1Student";
import { Step2SubjectGoal, Step2Data } from "@/components/forms/Step2SubjectGoal";
import { Step3Materials, Step3Data } from "@/components/forms/Step3Materials";
import { Step4Review } from "@/components/forms/Step4Review";
import { api } from "@/lib/api/client";

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Setup Wizard State
  const [studentName, setStudentName] = useState("");
  const [step2Data, setStep2Data] = useState<Step2Data>({
    subjectName: "Data Structures & Algorithms",
    goal: "exam_preparation",
    examDate: "",
  });
  const [step3Data, setStep3Data] = useState<Step3Data>({
    units: [
      {
        name: "Unit 1: Linear Data Structures",
        order_index: 0,
        topics: ["Arrays", "Linked Lists", "Stacks", "Queues"],
      },
      {
        name: "Unit 2: Non-Linear Structures & Trees",
        order_index: 1,
        topics: ["Trees", "Binary Trees", "Binary Search Trees", "AVL Trees"],
      },
      {
        name: "Unit 3: Graphs & Graph Algorithms",
        order_index: 2,
        topics: ["Graphs", "Graph Representation", "Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Dijkstra's Algorithm"],
      },
    ],
    previousYearPapers: [],
    materialIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Complete
  const handleStep1Next = (name: string) => {
    setStudentName(name);
    setCurrentStep(2);
  };

  // Step 2 Complete
  const handleStep2Next = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  // Step 3 Complete
  const handleStep3Next = (data: Step3Data) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  // Final Workspace Creation
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        student_name: studentName,
        subject_id: step2Data.subjectId,
        subject_name: step2Data.subjectName,
        goal: step2Data.goal,
        exam_date: step2Data.examDate ? step2Data.examDate : null,
        units: step3Data.units,
        material_ids: step3Data.materialIds,
      };

      const res = await api.createWorkspace(payload);

      // Save to localStorage so browser remembers active workspace
      if (typeof window !== "undefined") {
        localStorage.setItem("learnloop_active_workspace_id", res.id);
        localStorage.setItem("learnloop_active_student_name", studentName);
      }

      // Redirect to newly created workspace
      router.push(`/workspace/${res.id}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Bar */}
        <SetupProgress
          currentStep={currentStep}
          onStepClick={(step) => {
            if (step < currentStep) setCurrentStep(step);
          }}
        />

        {/* Step Views */}
        <div className="mt-4">
          {currentStep === 1 && (
            <Step1Student initialName={studentName} onNext={handleStep1Next} />
          )}

          {currentStep === 2 && (
            <Step2SubjectGoal
              initialData={step2Data}
              onBack={() => setCurrentStep(1)}
              onNext={handleStep2Next}
            />
          )}

          {currentStep === 3 && (
            <Step3Materials
              initialData={step3Data}
              onBack={() => setCurrentStep(2)}
              onNext={handleStep3Next}
            />
          )}

          {currentStep === 4 && (
            <Step4Review
              studentName={studentName}
              step2Data={step2Data}
              step3Data={step3Data}
              onEditStep={(step) => setCurrentStep(step)}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
