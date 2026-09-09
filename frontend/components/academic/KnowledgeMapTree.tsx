"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
} from "lucide-react";
import { KnowledgeMapUnitNode, KnowledgeMapTopicNode, TopicMasteryStatus } from "@/types";

export interface KnowledgeMapTreeProps {
  units: KnowledgeMapUnitNode[];
  onSelectTopic: (topicId: string) => void;
  selectedTopicId?: string;
}

export const KnowledgeMapTree: React.FC<KnowledgeMapTreeProps> = ({
  units,
  onSelectTopic,
  selectedTopicId,
}) => {
  // Track open/collapsed units
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

  const toggleUnit = (unitId: string) => {
    setCollapsedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "advanced":
        return <Badge variant="warning" className="text-[10px] py-0 px-1.5">Adv</Badge>;
      case "intermediate":
        return <Badge variant="indigo" className="text-[10px] py-0 px-1.5">Int</Badge>;
      case "beginner":
      default:
        return <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Beg</Badge>;
    }
  };

  const getMasteryBadge = (status?: TopicMasteryStatus) => {
    switch (status) {
      case "strong":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Strong
          </span>
        );
      case "developing":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Developing
          </span>
        );
      case "needs_attention":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Needs Attention
          </span>
        );
      case "not_assessed":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-normal px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            Not Assessed
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {units.map((unit, uIdx) => {
        const isCollapsed = collapsedUnits[unit.id];
        return (
          <div
            key={unit.id}
            className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs"
          >
            {/* Unit Header */}
            <div
              onClick={() => toggleUnit(unit.id)}
              className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-200/70 flex items-center justify-center text-slate-700 text-xs font-bold">
                  {uIdx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {unit.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {unit.topics.length} syllabus {unit.topics.length === 1 ? "topic" : "topics"}
                  </p>
                </div>
              </div>

              <button className="text-slate-400 hover:text-slate-600 p-1">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Topics Tree */}
            {!isCollapsed && (
              <div className="p-4 space-y-2">
                {unit.topics.map((topic) => {
                  const isSelected = selectedTopicId === topic.id;
                  const hasPrereqWeakness = (topic.prerequisite_weakness_count || 0) > 0;
                  return (
                    <div key={topic.id} className="space-y-1.5">
                      {/* Main Topic Row */}
                      <div
                        onClick={() => onSelectTopic(topic.id)}
                        className={`group p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs"
                            : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            topic.mastery?.status === "strong"
                              ? "bg-emerald-500"
                              : topic.mastery?.status === "developing"
                              ? "bg-amber-500"
                              : topic.mastery?.status === "needs_attention"
                              ? "bg-rose-500"
                              : "bg-slate-300 group-hover:bg-slate-600"
                          }`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 block group-hover:text-slate-950 truncate">
                                {topic.name}
                              </span>
                              {hasPrereqWeakness && (
                                <span title="Prerequisite topics need attention" className="text-amber-600 text-xs flex items-center">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            {topic.prerequisites.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                                <GitBranch className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  Prerequisites: {topic.prerequisites.slice(0, 2).join(", ")}
                                  {topic.prerequisites.length > 2 ? ` +${topic.prerequisites.length - 2}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {getMasteryBadge(topic.mastery?.status)}
                          {getDifficultyBadge(topic.difficulty)}
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>

                      {/* Subtopics Indented */}
                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="pl-6 space-y-1 border-l-2 border-slate-100 ml-4 py-1">
                          {topic.subtopics.map((sub) => {
                            const isSubSelected = selectedTopicId === sub.id;
                            return (
                              <div
                                key={sub.id}
                                onClick={() => onSelectTopic(sub.id)}
                                className={`p-2 rounded-md border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  isSubSelected
                                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-800">{sub.name}</span>
                                  {getMasteryBadge(sub.mastery?.status)}
                                </div>
                                {getDifficultyBadge(sub.difficulty)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

