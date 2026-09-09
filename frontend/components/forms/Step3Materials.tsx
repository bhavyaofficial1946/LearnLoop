"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { SyllabusUnitInput, AcademicMaterial } from "@/types";
import { api, ApiError } from "@/lib/api/client";

export interface Step3Data {
  units: SyllabusUnitInput[];
  syllabusFile?: File;
  syllabusFilename?: string;
  previousYearPapers: { file: File; name: string; size: number; tempId?: string }[];
  materialIds: string[];
}

export interface Step3MaterialsProps {
  initialData?: Partial<Step3Data>;
  onBack: () => void;
  onNext: (data: Step3Data) => void;
}

export const Step3Materials: React.FC<Step3MaterialsProps> = ({
  initialData,
  onBack,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">(
    initialData?.units && initialData.units.length > 0 ? "manual" : "upload"
  );

  // PDF Upload State
  const [syllabusFile, setSyllabusFile] = useState<File | null>(initialData?.syllabusFile || null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Units State
  const [units, setUnits] = useState<SyllabusUnitInput[]>(
    initialData?.units && initialData.units.length > 0
      ? initialData.units
      : [
          {
            name: "Unit 1: Linear Data Structures",
            order_index: 0,
            topics: ["Arrays", "Linked Lists", "Stacks", "Queues"],
          },
          {
            name: "Unit 2: Trees and Hierarchies",
            order_index: 1,
            topics: ["Trees", "Binary Trees", "Binary Search Trees", "AVL Trees"],
          },
        ]
  );

  // Previous year papers
  const [previousYearPapers, setPreviousYearPapers] = useState<
    { file: File; name: string; size: number; tempId?: string }[]
  >(initialData?.previousYearPapers || []);
  const [isUploadingPyq, setIsUploadingPyq] = useState(false);
  const pyqInputRef = useRef<HTMLInputElement>(null);

  // Validation Error
  const [formError, setFormError] = useState<string | null>(null);

  // Handle PDF File Drop / Selection
  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("Invalid file type. Only PDF documents (.pdf) are supported.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPdfError("File size exceeds 15MB limit.");
      return;
    }

    setSyllabusFile(file);
    setPdfError(null);
    setIsProcessingPdf(true);

    try {
      const extracted = await api.extractPdfSyllabus(file);
      if (extracted.units && extracted.units.length > 0) {
        setUnits(extracted.units);
        setPdfSuccess(true);
        if (extracted.warnings && extracted.warnings.length > 0) {
          setPdfError(extracted.warnings[0]);
        }
      } else {
        setPdfError("No structured units or topics could be extracted. You can enter them manually below.");
        setActiveTab("manual");
      }
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      const msg = err instanceof ApiError ? err.message : "We couldn't process this PDF. Please enter the syllabus manually.";
      setPdfError(msg);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // Previous year papers upload handler
  const handlePyqUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingPyq(true);

    const newPyqs = [...previousYearPapers];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.name.toLowerCase().endsWith(".pdf")) {
        try {
          const tempRes = await api.uploadTempMaterial(f, "previous_year_paper");
          newPyqs.push({ file: f, name: f.name, size: f.size, tempId: tempRes.id });
        } catch (e) {
          newPyqs.push({ file: f, name: f.name, size: f.size });
        }
      }
    }
    setPreviousYearPapers(newPyqs);
    setIsUploadingPyq(false);
  };

  // Manual Unit Management
  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        name: `Unit ${prev.length + 1}`,
        order_index: prev.length,
        topics: [""],
      },
    ]);
  };

  const updateUnitName = (index: number, newName: string) => {
    setUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: newName };
      return copy;
    });
  };

  const removeUnit = (index: number) => {
    if (units.length <= 1) {
      setFormError("Syllabus must contain at least 1 unit.");
      return;
    }
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const addTopic = (unitIndex: number) => {
    setUnits((prev) => {
      const copy = [...prev];
      copy[unitIndex] = {
        ...copy[unitIndex],
        topics: [...copy[unitIndex].topics, ""],
      };
      return copy;
    });
  };

  const updateTopic = (unitIndex: number, topicIndex: number, val: string) => {
    setUnits((prev) => {
      const copy = [...prev];
      const unitTopics = [...copy[unitIndex].topics];
      unitTopics[topicIndex] = val;
      copy[unitIndex] = { ...copy[unitIndex], topics: unitTopics };
      return copy;
    });
  };

  const removeTopic = (unitIndex: number, topicIndex: number) => {
    setUnits((prev) => {
      const copy = [...prev];
      const unitTopics = copy[unitIndex].topics.filter((_, i) => i !== topicIndex);
      copy[unitIndex] = { ...copy[unitIndex], topics: unitTopics };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate units and topics
    const cleanUnits: SyllabusUnitInput[] = [];
    let totalTopics = 0;

    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const u = units[uIdx];
      const cleanName = u.name.trim();
      if (!cleanName) {
        setFormError(`Unit ${uIdx + 1} name cannot be empty.`);
        return;
      }
      const cleanTopics = u.topics.map((t) => t.trim()).filter((t) => t.length > 0);
      if (cleanTopics.length === 0) {
        setFormError(`"${cleanName}" must have at least one topic.`);
        return;
      }
      totalTopics += cleanTopics.length;
      cleanUnits.push({
        name: cleanName,
        order_index: uIdx,
        topics: cleanTopics,
      });
    }

    if (cleanUnits.length === 0 || totalTopics === 0) {
      setFormError("Please provide at least one unit with topics.");
      return;
    }

    const materialIds = previousYearPapers
      .map((p) => p.tempId)
      .filter((id): id is string => Boolean(id));

    onNext({
      units: cleanUnits,
      syllabusFile: syllabusFile || undefined,
      syllabusFilename: syllabusFile?.name,
      previousYearPapers,
      materialIds,
    });
  };

  const totalTopicsCount = units.reduce(
    (acc, u) => acc + u.topics.filter((t) => t.trim().length > 0).length,
    0
  );

  return (
    <Card className="max-w-2xl mx-auto p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Material & Syllabus</h2>
          <p className="text-xs text-slate-500">Provide your official course syllabus and exam papers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Tabs */}
        <div>
          <div className="flex border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Option A: Upload Syllabus PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "manual"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Option B: Enter Syllabus Manually ({units.length} Units, {totalTopicsCount} Topics)
            </button>
          </div>

          {/* TAB 1: PDF Upload */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handlePdfUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isProcessingPdf
                    ? "border-slate-400 bg-slate-50"
                    : pdfSuccess
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-slate-200 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handlePdfUpload(e.target.files[0]);
                    }
                  }}
                />

                {isProcessingPdf ? (
                  <div className="py-4 space-y-2">
                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-900">Processing syllabus PDF...</p>
                    <p className="text-xs text-slate-500">Extracting units, chapters, and topic hierarchy</p>
                  </div>
                ) : pdfSuccess && syllabusFile ? (
                  <div className="py-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{syllabusFile.name}</p>
                    <p className="text-xs text-emerald-700 font-medium">
                      ✓ Successfully structured into {units.length} units and {totalTopicsCount} topics
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("manual");
                        }}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Review / Edit Extracted Topics →
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Replace file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Upload your syllabus</p>
                      <p className="text-xs text-slate-500 mt-0.5">Drag & drop PDF here or browse files</p>
                    </div>
                    <p className="text-[11px] text-slate-400">PDF up to 15MB supported</p>
                  </div>
                )}
              </div>

              {pdfError && (
                <Alert type="warning" title="Extraction Notice">
                  {pdfError}
                </Alert>
              )}
            </div>
          )}

          {/* TAB 2: Manual Syllabus Builder */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Organize syllabus into units and individual topics
                </p>
                <Button type="button" size="sm" variant="outline" onClick={addUnit}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Unit
                </Button>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {units.map((unit, uIdx) => (
                  <div key={uIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={unit.name}
                          onChange={(e) => updateUnitName(uIdx, e.target.value)}
                          placeholder={`Unit ${uIdx + 1} Title`}
                          className="w-full font-semibold text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUnit(uIdx)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Topics List */}
                    <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                      {unit.topics.map((topic, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-4">{tIdx + 1}.</span>
                          <input
                            type="text"
                            value={topic}
                            onChange={(e) => updateTopic(uIdx, tIdx, e.target.value)}
                            placeholder="Topic name (e.g. Binary Search Trees)"
                            className="flex-1 text-xs text-slate-800 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => removeTopic(uIdx, tIdx)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer"
                            title="Remove topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addTopic(uIdx)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Topic
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Previous-Year Question Papers (Optional) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Previous-year question papers (optional)
              </label>
              <p className="text-xs text-slate-500">
                Upload past exam papers to associate with your workspace metadata
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => pyqInputRef.current?.click()}
              isLoading={isUploadingPyq}
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Upload PDF
            </Button>
            <input
              ref={pyqInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handlePyqUpload(e.target.files)}
            />
          </div>

          {previousYearPapers.length > 0 ? (
            <div className="space-y-1.5 mt-3">
              {previousYearPapers.map((pyq, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-800">{pyq.name}</span>
                    <span className="text-slate-400">({(pyq.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px]">
                      Uploaded ✓
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setPreviousYearPapers((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No previous-year papers uploaded yet. You can also add them later in your workspace.
            </div>
          )}
        </div>

        {formError && (
          <Alert type="error" title="Validation Error">
            {formError}
          </Alert>
        )}

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <Button type="button" variant="ghost" size="md" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </Button>
          <Button type="submit" size="md">
            <span>Review Plan</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
