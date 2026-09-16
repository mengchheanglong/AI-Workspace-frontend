"use client";

import React, { useEffect, useState, useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  AlertCircle,
  Search,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Filter,
  Sparkles
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RequirementsPage() {
  
  const { currentProject } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("HIGH");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const data = await api.requirements.list(currentProject.id);
      setItems(data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load requirements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("create") === "true") {
      setShowCreate(true);
    }
    loadData();
  }, [currentProject]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, "info");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !title.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.requirements.create(currentProject.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
        priority,
      });
      setTitle("");
      setDescription("");
      setAcceptanceCriteria("");
      setShowCreate(false);
      showToast(`Created ${created.displayKey || "requirement"} successfully!`, "success");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create requirement");
      showToast(err.message || "Failed to create requirement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (req: any, newStatus: string) => {
    if (!currentProject) return;
    try {
      await api.requirements.update(currentProject.id, req.id, {
        version: req.version,
        status: newStatus,
      });
      showToast(`${req.displayKey} updated to ${newStatus}`, "success");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update requirement status", "error");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.displayKey && item.displayKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      const matchesPriority =
        selectedPriority === "ALL" || item.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [items, searchQuery, selectedStatus, selectedPriority]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" className="text-[10px]">APPROVED</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[10px]">IN PROGRESS</Badge>;
      case "DONE":
        return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-[10px]">DONE</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary" className="text-zinc-500 text-[10px]">ARCHIVED</Badge>;
      default:
        return <Badge variant="outline" className="text-zinc-400 text-[10px]">DRAFT</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <Badge variant="destructive" className="text-[9px]">URGENT</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 text-[9px]">HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[9px]">MEDIUM</Badge>;
      default:
        return <Badge variant="secondary" className="text-[9px]">LOW</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Requirements
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Define specifications and acceptance criteria. Requirements drive engineering tasks and store immutable revision history.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 shadow-md self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreate ? "Close Form" : "New Requirement"}</span>
          </Button>
        </div>

        {/* Create Form Drawer / Card */}
        {showCreate && (
          <Card className="border-indigo-500/30 bg-[#101116] shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create New Project Requirement</span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <div className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Requirement Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., User Authentication with Cookie Sessions"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full h-9 rounded-md bg-[#161820] border border-white/10 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Project Context</label>
                    <div className="h-9 rounded-md bg-white/[0.02] border border-white/[0.06] px-3 flex items-center text-xs text-zinc-400 font-mono">
                      [{currentProject?.key}] {currentProject?.name}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context on why this requirement is necessary and the expected user experience..."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Acceptance Criteria</label>
                    <span className="text-[10px] text-zinc-500 font-mono">Recommended for QA & Testing</span>
                  </div>
                  <textarea
                    rows={3}
                    value={acceptanceCriteria}
                    onChange={(e) => setAcceptanceCriteria(e.target.value)}
                    placeholder="e.g., - Session cookie is httpOnly and secure&#10;- CSRF token is rotated and validated on mutation&#10;- Unauthorized requests return 401"
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4"
                >
                  {submitting ? "Saving..." : "Create Requirement"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101116] border border-white/[0.06] p-3 rounded-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, key (AIW-REQ-1), or content..."
              className="pl-8 h-8 text-xs bg-[#161820] border-white/10 text-zinc-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-zinc-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 rounded-md bg-[#161820] border border-white/10 px-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 rounded-md bg-[#161820] border border-white/10 px-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              aria-label="Filter by priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {items.length === 0 ? "No Requirements Created Yet" : "No Matching Requirements Found"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {items.length === 0
                ? "Requirements define the scope and criteria of your project. Create your first requirement to get started."
                : "Try clearing your search query or adjusting your status filters."}
            </p>
            {items.length === 0 ? (
              <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs bg-indigo-600 hover:bg-indigo-500">
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Requirement
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                  setSelectedPriority("ALL");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((req) => {
              const isExpanded = expandedItems[req.id];
              return (
                <Card
                  key={req.id}
                  className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(req.displayKey || req.id, "key")}
                          className="flex items-center gap-1 font-mono text-xs font-bold text-indigo-400 bg-indigo-600/15 hover:bg-indigo-600/25 px-2 py-0.5 rounded border border-indigo-500/20 transition-all group"
                          title="Click to copy key"
                        >
                          <span>{req.displayKey || req.id.substring(0, 8)}</span>
                          <Copy className="w-3 h-3 text-indigo-400/60 group-hover:text-indigo-400" />
                        </button>
                        {getPriorityBadge(req.priority)}
                        {getStatusBadge(req.status)}
                        <span className="text-[10px] text-zinc-500 font-mono">Rev: v{req.version}</span>
                      </div>

                      {/* Status changer dropdown */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-[10px] text-zinc-500 font-medium">Status:</span>
                        <select
                          value={req.status}
                          onChange={(e) => updateStatus(req, e.target.value)}
                          className="text-xs bg-[#1a1b22] border border-white/10 rounded px-2 py-0.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="DONE">DONE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>
                    </div>

                    <CardTitle className="text-sm font-semibold text-white pt-2 leading-snug">
                      {req.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    {req.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    {/* Acceptance Criteria Collapsible */}
                    {req.acceptanceCriteria && (
                      <div className="rounded-lg bg-[#16171f] border border-white/[0.04] p-3 space-y-1.5">
                        <button
                          onClick={() => toggleExpand(req.id)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white"
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acceptance Criteria</span>
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="pt-2 text-xs text-zinc-300 whitespace-pre-wrap font-mono bg-black/20 p-2.5 rounded border border-white/5 animate-in fade-in">
                            {req.acceptanceCriteria}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px] text-zinc-500 font-mono">
                      <span>Created {formatDate(req.createdAt)}</span>
                      {req.createdBy && <span>Author: {req.createdBy.displayName || req.createdBy.email}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
