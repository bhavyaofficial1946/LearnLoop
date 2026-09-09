"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  GitBranch,
  Layers,
  ArrowRight,
  BookOpen,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TopicDetail } from "@/types";
import { api } from "@/lib/api/client";

export interface TopicDetailDrawerProps {
  workspaceId: string;
  topicId: string | null;
  onClose: () => void;
  onSelectAnotherTopic: (id: string) => void;
}

export const TopicDetailDrawer: React.FC<TopicDetailDrawerProps> = ({
  workspaceId,
  topicId,
  onClose,
  onSelectAnotherTopic,
}) => {
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      return;
    }

    let mounted = true;
    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getTopicDetail(workspaceId, topicId!);
        if (mounted) setTopic(data);
      } catch (err: any) {
        if (mounted) setError("Failed to load topic details from server.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDetail();
    return () => {
      mounted = false;
    };
  }, [workspaceId, topicId]);

  const getDifficultyBadge = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case "advanced":
        return <Badge variant="warning">Advanced</Badge>;
      case "intermediate":
        return <Badge variant="indigo">Intermediate</Badge>;
      case "beginner":
      default:
        return <Badge variant="secondary">Beginner</Badge>;
    }
  };

  return (
    <Drawer
      isOpen={Boolean(topicId)}
      onClose={onClose}
      title={topic?.name || "Topic Detail"}
      subtitle={topic?.unit_name ? `Part of ${topic.unit_name}` : "Academic Concept"}
    >
      {isLoading ? (
        <div className="py-12">
          <Spinner size="md" label="Loading topic specifications..." />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      ) : topic ? (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Difficulty Level
              </span>
              {getDifficultyBadge(topic.difficulty)}
            </div>

            {topic.parent_topic_name && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500">Parent Category:</span>
                <span className="font-semibold text-slate-800">{topic.parent_topic_name}</span>
              </div>
            )}
          </div>

          {/* Prerequisites Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Foundational Prerequisites
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Concepts that establish the foundation required for understanding {topic.name}
            </p>

            {topic.prerequisites.length > 0 ? (
              <div className="space-y-2 pt-1">
                {topic.prerequisites.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectAnotherTopic(p.id)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(p.difficulty)}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                No strict prerequisites recorded. This is an introductory foundational topic.
              </div>
            )}
          </div>

          {/* Dependents Section (What builds on this) */}
          {topic.dependents.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Advanced Topics Requiring This
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Mastering this topic enables the following downstream concepts:
              </p>

              <div className="space-y-2 pt-1">
                {topic.dependents.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => onSelectAnotherTopic(d.id)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-xs font-semibold text-slate-900">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(d.difficulty)}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtopics */}
          {topic.subtopics.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Subtopics & Variations
                </h4>
              </div>
              <div className="space-y-1.5 pt-1">
                {topic.subtopics.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectAnotherTopic(sub.id)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-medium text-slate-800">{sub.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Drawer>
  );
};
