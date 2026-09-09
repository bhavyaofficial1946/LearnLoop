import React from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

export interface SetupProgressProps {
  currentStep: number;
  steps?: { number: string; title: string }[];
  onStepClick?: (step: number) => void;
}

const DEFAULT_STEPS = [
  { number: "01", title: "Student" },
  { number: "02", title: "Subject" },
  { number: "03", title: "Materials" },
  { number: "04", title: "Review" },
];

export const SetupProgress: React.FC<SetupProgressProps> = ({
  currentStep,
  steps = DEFAULT_STEPS,
  onStepClick,
}) => {
  return (
    <div className="w-full py-6">
      <nav aria-label="Progress" className="max-w-3xl mx-auto">
        <ol className="flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 -z-0" />

          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const isUpcoming = stepNum > currentStep;

            return (
              <li
                key={step.number}
                className="relative z-10 flex flex-col items-center bg-white px-2 cursor-default"
                onClick={() => {
                  if (isCompleted && onStepClick) {
                    onStepClick(stepNum);
                  }
                }}
              >
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all border",
                    isCompleted && "bg-slate-900 text-white border-slate-900",
                    isCurrent && "bg-white text-slate-900 border-slate-900 ring-4 ring-slate-100",
                    isUpcoming && "bg-slate-50 text-slate-400 border-slate-200"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
                </div>
                <span
                  className={clsx(
                    "text-xs font-medium mt-2 transition-colors",
                    isCurrent ? "text-slate-900 font-semibold" : isCompleted ? "text-slate-700" : "text-slate-400"
                  )}
                >
                  {step.title}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
