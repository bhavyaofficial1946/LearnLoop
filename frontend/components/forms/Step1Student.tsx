"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { User, ArrowRight } from "lucide-react";

export interface Step1StudentProps {
  initialName?: string;
  onNext: (name: string) => void;
}

export const Step1Student: React.FC<Step1StudentProps> = ({ initialName = "", onNext }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to personalize your workspace.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must be less than 100 characters.");
      return;
    }
    setError(null);
    onNext(trimmed);
  };

  return (
    <Card className="max-w-xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Student Identity</h2>
          <p className="text-xs text-slate-500">Your name will identify your study workspace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            id="student-name"
            label="What is your name?"
            placeholder="e.g. Alex Chen"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            error={error || undefined}
            helperText="Only used to label your study workspace and session."
            autoFocus
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" size="md">
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
