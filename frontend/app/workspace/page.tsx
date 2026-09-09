"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookOpen, Plus, ArrowRight } from "lucide-react";

export default function WorkspaceIndexPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("learnloop_active_workspace_id");
    if (saved) {
      router.replace(`/workspace/${saved}`);
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-20 text-center">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">No Active Study Workspace</h1>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            You haven&apos;t created an academic study workspace yet. Set up your subject, learning goal, and syllabus to begin.
          </p>
          <Link href="/setup">
            <Button size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Study Plan</span>
            </Button>
          </Link>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
