"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/toast-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ListTodo,
  FileCheck2,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";

interface ProposalReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  projectId: string;
  onConfirmed: (resultRecordIds: any[]) => void;
  onRejected?: () => void;
}

export function ProposalReviewDialog({
  isOpen,
  onClose,
  proposal,
  projectId,
  onConfirmed,
  onRejected,
}: ProposalReviewDialogProps) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeSummary, setIncludeSummary] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedResults, setConfirmedResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (proposal && proposal.draftJson) {
      setDraft(JSON.parse(JSON.stringify(proposal.draftJson)));
      setConfirmedResults(null);
      setErrorMsg(null);

      // Default select all items
      const ids = new Set<string>();
      if (proposal.draftJson.type === "CREATE_TASKS" && proposal.draftJson.items) {
        proposal.draftJson.items.forEach((item: any) => ids.add(item.itemId));
      } else if (proposal.draftJson.type === "MEETING_ANALYSIS") {
        if (proposal.draftJson.decisions) {
          proposal.draftJson.decisions.forEach((d: any) => ids.add(d.itemId));
        }
        if (proposal.draftJson.requirements) {
          proposal.draftJson.requirements.forEach((r: any) => ids.add(r.itemId));
        }
        if (proposal.draftJson.actionItems) {
          proposal.draftJson.actionItems.forEach((a: any) => ids.add(a.itemId));
        }
      }
      setSelectedIds(ids);
    }
  }, [proposal]);

  if (!isOpen || !proposal || !draft) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    const ids = new Set<string>();
    if (draft.type === "CREATE_TASKS" && draft.items) {
      draft.items.forEach((item: any) => ids.add(item.itemId));
    } else if (draft.type === "MEETING_ANALYSIS") {
      draft.decisions?.forEach((d: any) => ids.add(d.itemId));
      draft.requirements?.forEach((r: any) => ids.add(r.itemId));
      draft.actionItems?.forEach((a: any) => ids.add(a.itemId));
    }
    setSelectedIds(ids);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleUpdateItem = (type: string, itemId: string, field: string, value: any) => {
    const updated = { ...draft };
    if (type === "task" && updated.items) {
      const idx = updated.items.findIndex((i: any) => i.itemId === itemId);
      if (idx >= 0) updated.items[idx][field] = value;
    } else if (type === "decision" && updated.decisions) {
      const idx = updated.decisions.findIndex((i: any) => i.itemId === itemId);
      if (idx >= 0) updated.decisions[idx][field] = value;
    } else if (type === "requirement" && updated.requirements) {
      const idx = updated.requirements.findIndex((i: any) => i.itemId === itemId);
      if (idx >= 0) updated.requirements[idx][field] = value;
    } else if (type === "actionItem" && updated.actionItems) {
      const idx = updated.actionItems.findIndex((i: any) => i.itemId === itemId);
      if (idx >= 0) updated.actionItems[idx][field] = value;
    }
    setDraft(updated);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 && !includeSummary) {
      setErrorMsg("Please select at least one item or include summary to confirm.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      let currentVersion = proposal.version;
      const isDirty = JSON.stringify(draft) !== JSON.stringify(proposal.draftJson);
      if (isDirty) {
        const updated = await api.ai.updateProposal(projectId, proposal.id, {
          version: currentVersion,
          draftJson: draft,
        });
        currentVersion = updated.version;
      }

      // Confirm with current version
      const res = await api.ai.confirmProposal(projectId, proposal.id, {
        version: currentVersion,
        selectedItemIds: Array.from(selectedIds),
        includeSummary,
      });

      setConfirmedResults(res.resultRecordIds);
      showToast("AI proposal successfully confirmed! Records created.", "success");
      onConfirmed(res.resultRecordIds);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to confirm proposal");
      showToast(err.message || "Confirmation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.ai.rejectProposal(projectId, proposal.id);
      showToast("Proposal rejected. No changes were made.", "info");
      if (onRejected) onRejected();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to reject proposal");
      showToast(err.message || "Rejection failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isTaskProposal = proposal.proposalType === "TASK_PROPOSAL";
  const isMeetingAnalysis = proposal.proposalType === "MEETING_ANALYSIS";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0e1015] border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isTaskProposal ? "Review Task Proposals" : "Review Meeting Analysis"}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                  {proposal.status}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                AI has generated structured proposals. Select, review, and confirm items to create records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success summary if already confirmed */}
          {confirmedResults ? (
            <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Successfully created {confirmedResults.length} records in project!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {confirmedResults.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-black/40 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-400">{rec.entityType}:</span>
                    <span className="font-mono font-bold text-white">{rec.key || rec.id}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <Button size="sm" onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Batch Actions */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/[0.04]">
                <span>
                  Selected: <strong className="text-indigo-400">{selectedIds.size}</strong> items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-indigo-400 hover:underline hover:text-indigo-300"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-zinc-500 hover:underline hover:text-zinc-400"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Task Proposals Display */}
              {isTaskProposal && draft.items && (
                <div className="space-y-3">
                  {draft.items.map((item: any) => {
                    const isSelected = selectedIds.has(item.itemId);
                    return (
                      <div
                        key={item.itemId}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-white/[0.03] border-indigo-500/40 shadow-sm"
                            : "bg-white/[0.01] border-white/[0.06] opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.itemId)}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateItem("task", item.itemId, "title", e.target.value)
                              }
                              className="h-8 text-xs font-semibold bg-[#14161f] border-white/10 text-white"
                              placeholder="Task title"
                            />
                            <textarea
                              rows={2}
                              value={item.description || ""}
                              onChange={(e) =>
                                handleUpdateItem("task", item.itemId, "description", e.target.value)
                              }
                              className="w-full text-xs p-2 rounded bg-[#14161f] border border-white/10 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Task description"
                            />
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <select
                                value={item.priority}
                                onChange={(e) =>
                                  handleUpdateItem("task", item.itemId, "priority", e.target.value)
                                }
                                className="h-7 rounded bg-[#161820] border border-white/10 px-2 text-[11px] text-zinc-300"
                              >
                                <option value="LOW">Priority: Low</option>
                                <option value="MEDIUM">Priority: Medium</option>
                                <option value="HIGH">Priority: High</option>
                                <option value="URGENT">Priority: Urgent</option>
                              </select>
                              <Input
                                type="date"
                                value={item.dueDate || ""}
                                onChange={(e) =>
                                  handleUpdateItem("task", item.itemId, "dueDate", e.target.value)
                                }
                                className="h-7 w-36 text-[11px] bg-[#161820] border-white/10 text-zinc-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Meeting Analysis Display */}
              {isMeetingAnalysis && (
                <div className="space-y-5">
                  {/* Summary Section */}
                  {draft.summary && (
                    <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-indigo-400" />
                          <span>Meeting Executive Summary</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeSummary}
                            onChange={(e) => setIncludeSummary(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600"
                          />
                          <span>Save to Meeting</span>
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={draft.summary}
                        onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                        className="w-full text-xs p-2.5 rounded bg-[#14161f] border border-white/10 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Decisions Section */}
                  {draft.decisions && draft.decisions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Identified Decisions ({draft.decisions.length})</span>
                      </h4>
                      {draft.decisions.map((d: any) => {
                        const isSelected = selectedIds.has(d.itemId);
                        return (
                          <div
                            key={d.itemId}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-white/[0.03] border-amber-500/30"
                                : "bg-white/[0.01] border-white/[0.06] opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(d.itemId)}
                                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-500"
                              />
                              <div className="flex-1 space-y-1.5">
                                <Input
                                  value={d.title}
                                  onChange={(e) =>
                                    handleUpdateItem("decision", d.itemId, "title", e.target.value)
                                  }
                                  className="h-7 text-xs font-semibold bg-[#14161f] border-white/10 text-white"
                                />
                                <textarea
                                  rows={2}
                                  value={d.decisionText}
                                  onChange={(e) =>
                                    handleUpdateItem("decision", d.itemId, "decisionText", e.target.value)
                                  }
                                  className="w-full text-xs p-2 rounded bg-[#14161f] border border-white/10 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Requirements Section */}
                  {draft.requirements && draft.requirements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Identified Requirements ({draft.requirements.length})</span>
                      </h4>
                      {draft.requirements.map((r: any) => {
                        const isSelected = selectedIds.has(r.itemId);
                        return (
                          <div
                            key={r.itemId}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-white/[0.03] border-blue-500/30"
                                : "bg-white/[0.01] border-white/[0.06] opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(r.itemId)}
                                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 space-y-1.5">
                                <Input
                                  value={r.title}
                                  onChange={(e) =>
                                    handleUpdateItem("requirement", r.itemId, "title", e.target.value)
                                  }
                                  className="h-7 text-xs font-semibold bg-[#14161f] border-white/10 text-white"
                                />
                                <textarea
                                  rows={2}
                                  value={r.acceptanceCriteria || ""}
                                  onChange={(e) =>
                                    handleUpdateItem("requirement", r.itemId, "acceptanceCriteria", e.target.value)
                                  }
                                  placeholder="Acceptance Criteria"
                                  className="w-full text-xs p-2 rounded bg-[#14161f] border border-white/10 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Items Section */}
                  {draft.actionItems && draft.actionItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Action Items / Tasks ({draft.actionItems.length})</span>
                      </h4>
                      {draft.actionItems.map((a: any) => {
                        const isSelected = selectedIds.has(a.itemId);
                        return (
                          <div
                            key={a.itemId}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-white/[0.03] border-indigo-500/30"
                                : "bg-white/[0.01] border-white/[0.06] opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(a.itemId)}
                                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex-1 space-y-1.5">
                                <Input
                                  value={a.title}
                                  onChange={(e) =>
                                    handleUpdateItem("actionItem", a.itemId, "title", e.target.value)
                                  }
                                  className="h-7 text-xs font-semibold bg-[#14161f] border-white/10 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!confirmedResults && (
          <div className="p-4 sm:p-6 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={submitting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Reject Draft</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-lg shadow-indigo-500/25"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    <span>Confirm Selected ({selectedIds.size})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
