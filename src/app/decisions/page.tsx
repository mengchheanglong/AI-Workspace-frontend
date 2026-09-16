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
  GitPullRequest,
  Search,
  CheckCircle2,
  Copy,
  Lightbulb,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DecisionsPage() {
  
  const { currentProject } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Form state
  const [title, setTitle] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const data = await api.decisions.list(currentProject.id);
      setItems(data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load decisions", "error");
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, "info");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !title.trim() || !decisionText.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.decisions.create(currentProject.id, {
        title: title.trim(),
        decisionText: decisionText.trim(),
        rationale: rationale.trim() || undefined,
      });
      setTitle("");
      setDecisionText("");
      setRationale("");
      setShowCreate(false);
      showToast(`Created ${created.displayKey || "decision"} successfully!`, "success");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create decision");
      showToast(err.message || "Failed to create decision", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (dec: any, newStatus: string) => {
    if (!currentProject) return;
    try {
      await api.decisions.update(currentProject.id, dec.id, {
        version: dec.version,
        status: newStatus,
      });
      showToast(`${dec.displayKey} updated to ${newStatus}`, "success");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update decision status", "error");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.displayKey && item.displayKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.decisionText && item.decisionText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.rationale && item.rationale.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success" className="text-[10px]">ACCEPTED</Badge>;
      case "SUPERSEDED":
        return <Badge variant="secondary" className="line-through text-zinc-500 text-[10px]">SUPERSEDED</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="text-[10px]">REJECTED</Badge>;
      default:
        return <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10 text-[10px]">PROPOSED</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600/15 text-purple-400 flex items-center justify-center">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Architectural Decisions (ADR)
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Document critical technical decisions, context, and rationale to maintain architectural integrity and prevent repetitive debates.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreate ? "Close Form" : "Log Decision"}</span>
          </Button>
        </div>

        {/* Create ADR Card */}
        {showCreate && (
          <Card className="border-purple-500/30 bg-[#101116] shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Log New Architectural Decision Record (ADR)</span>
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
                  <label className="text-xs font-semibold text-zinc-300">Decision Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Adopt Argon2id for User Password Hashing"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Decision Outcome *</label>
                    <span className="text-[10px] text-zinc-500">What is the technical choice being made?</span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={decisionText}
                    onChange={(e) => setDecisionText(e.target.value)}
                    placeholder="e.g., All user passwords will be hashed using Argon2id with memory cost 64MB and 3 iterations, stored securely in PostgreSQL."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Rationale & Context</label>
                    <span className="text-[10px] text-zinc-500">Why was this option chosen over alternatives?</span>
                  </div>
                  <textarea
                    rows={3}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="e.g., Argon2id won the Password Hashing Competition and provides superior resistance against GPU/ASIC attacks compared to bcrypt and scrypt."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4"
                >
                  {submitting ? "Saving..." : "Save Decision"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] pb-2 text-xs">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === "ALL" ? "bg-white/10 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setSelectedStatus("PROPOSED")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === "PROPOSED" ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Proposed ({items.filter(i => i.status === "PROPOSED").length})
            </button>
            <button
              onClick={() => setSelectedStatus("ACCEPTED")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Accepted ({items.filter(i => i.status === "ACCEPTED").length})
            </button>
            <button
              onClick={() => setSelectedStatus("SUPERSEDED")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === "SUPERSEDED" ? "bg-zinc-800 text-zinc-300 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Superseded ({items.filter(i => i.status === "SUPERSEDED").length})
            </button>
            <button
              onClick={() => setSelectedStatus("REJECTED")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${selectedStatus === "REJECTED" ? "bg-red-500/20 text-red-300 font-semibold border border-red-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Rejected ({items.filter(i => i.status === "REJECTED").length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decisions by title, key (AIW-DEC-1), or content..."
              className="pl-8 h-8 text-xs bg-[#161820] border-white/10 text-zinc-200"
            />
          </div>
        </div>

        {/* Decisions List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {items.length === 0 ? "No Decisions Documented Yet" : "No Matching Decisions Found"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {items.length === 0
                ? "Keep track of foundational architectural decisions so your team stays aligned."
                : "Try adjusting your search keywords or switching status tabs."}
            </p>
            {items.length === 0 ? (
              <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs bg-purple-600 hover:bg-purple-500">
                <Plus className="w-3.5 h-3.5 mr-1" /> Log First Decision
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((dec) => (
              <Card
                key={dec.id}
                className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyToClipboard(dec.displayKey || dec.id, "decision key")}
                        className="flex items-center gap-1 font-mono text-xs font-bold text-purple-400 bg-purple-600/15 hover:bg-purple-600/25 px-2 py-0.5 rounded border border-purple-500/20 transition-all group"
                        title="Click to copy key"
                      >
                        <span>{dec.displayKey || dec.id.substring(0, 8)}</span>
                        <Copy className="w-3 h-3 text-purple-400/60 group-hover:text-purple-400" />
                      </button>
                      {getStatusBadge(dec.status)}
                      <span className="text-[10px] text-zinc-500 font-mono">Rev: v{dec.version}</span>
                    </div>

                    {/* Status switcher */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[10px] text-zinc-500 font-medium">Status:</span>
                      <select
                        value={dec.status}
                        onChange={(e) => updateStatus(dec, e.target.value)}
                        className="text-xs bg-[#1a1b22] border border-white/10 rounded px-2 py-0.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="PROPOSED">PROPOSED</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="SUPERSEDED">SUPERSEDED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <CardTitle className="text-sm font-semibold text-white pt-2 leading-snug">
                    {dec.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Decision Outcome
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed bg-[#16171f] p-3 rounded-lg border border-white/[0.04]">
                      {dec.decisionText}
                    </p>
                  </div>

                  {dec.rationale && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" /> Context & Rationale
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-[#16171f]/50 p-3 rounded-lg border border-white/[0.02]">
                        {dec.rationale}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px] text-zinc-500 font-mono">
                    <span>Documented {formatDate(dec.createdAt)}</span>
                    {dec.createdBy && <span>Author: {dec.createdBy.displayName || dec.createdBy.email}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
