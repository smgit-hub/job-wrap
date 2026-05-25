"use client";

import { cn } from "@/lib/utils";

export type Step = {
  id: number;
  label: string;
};

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const REPORT_STEPS: Step[] = [
  { id: 1, label: "Record" },
  { id: 2, label: "Confirm" },
  { id: 3, label: "Edit" },
  { id: 4, label: "Preview" },
];

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        return (
          <div
            key={step.id}
            className={cn(
              "rounded-full transition-all",
              isCurrent  && "w-5 h-2 bg-orange-500",
              isComplete && "w-2 h-2 bg-orange-300",
              !isCurrent && !isComplete && "w-2 h-2 border-2 border-slate-300"
            )}
          />
        );
      })}
    </div>
  );
}
