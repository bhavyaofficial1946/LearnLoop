"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { AcademicMaterial } from "@/types";
import { api } from "@/lib/api/client";

export interface AcademicMaterialsSectionProps {
  workspaceId: string;
  initialMaterials: AcademicMaterial[];
  onMaterialsChanged: () => void;
}

export const AcademicMaterialsSection: React.FC<AcademicMaterialsSectionProps> = ({
  workspaceId,
  initialMaterials,
  onMaterialsChanged,
}) => {
  const [materials, setMaterials] = useState<AcademicMaterial[]>(initialMaterials);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const newMat = await api.uploadWorkspaceMaterial(
        workspaceId,
        file,
        "previous_year_paper"
      );
      setMaterials((prev) => [newMat, ...prev]);
      onMaterialsChanged();
    } catch (err: any) {
      setError(err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      await api.deleteWorkspaceMaterial(workspaceId, materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      onMaterialsChanged();
    } catch (err: any) {
      setError("Failed to delete document.");
    }
  };

  const syllabusMaterials = materials.filter((m) => m.material_type === "syllabus");
  const pyqMaterials = materials.filter((m) => m.material_type === "previous_year_paper");

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Materials</h2>
          <p className="text-xs text-slate-500">Official course syllabi and previous-year question papers</p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Add Material
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {materials.length === 0 ? (
        <EmptyState
          title="No academic materials added yet"
          description="Add past exam papers or syllabus files to keep all your study references organized."
          actionLabel="Add Material"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="space-y-6">
          {/* Syllabus Section */}
          {syllabusMaterials.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Course Syllabus
              </h3>
              <div className="space-y-2">
                {syllabusMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">{m.file_name}</span>
                        <div className="text-[11px] text-slate-400">
                          Uploaded {new Date(m.created_at).toLocaleDateString()}
                          {m.file_size_bytes ? ` • ${(m.file_size_bytes / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" className="text-[10px]">
                        Processed ✓
                      </Badge>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous-Year Question Papers Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Previous-Year Question Papers
            </h3>
            {pyqMaterials.length > 0 ? (
              <div className="space-y-2">
                {pyqMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">{m.file_name}</span>
                        <div className="text-[11px] text-slate-400">
                          Uploaded {new Date(m.created_at).toLocaleDateString()}
                          {m.file_size_bytes ? ` • ${(m.file_size_bytes / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="indigo" className="text-[10px]">
                        Uploaded ✓
                      </Badge>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
                <span>No previous-year papers attached yet.</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  + Upload Paper
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
