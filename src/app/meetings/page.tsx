"use client";

import React, { useEffect, useState, useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AppLayout } from "@/components/app-layout";
import { ProposalReviewDialog } from "@/components/ai/proposal-review-dialog";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function MeetingsPage() {
  
  const { currentProject } = useAuth();
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Search & Expansion state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Proposal state
  const [activeProposal, setActiveProposal] = useState<any>(null);
  const [generatingProposalId, setGeneratingProposalId] = useState<string | null>(null);

  const handleGenerateAnalysis = async (meeting: any) => {
    if (!currentProject) return;
    if (!meeting.transcriptText && !meeting.notes) {
      showToast("Meeting must have notes or a transcript for AI analysis.", "error");
      return;
    }
    setGeneratingProposalId(meeting.id);
    try {
      const res = await api.ai.generateMeetingAnalysis(currentProject.id, meeting.id);
      setActiveProposal(res.proposal || res);
      showToast("Generated meeting analysis! Review proposals before applying.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to generate meeting analysis", "error");
    } finally {
      setGeneratingProposalId(null);
    }
  };

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const data = await api.meetings.list(currentProject.id);
      setMeetings(data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load meetings", "error");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !title.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endsAt = new Date(`${date}T${endTime}:00`).toISOString();

      if (new Date(endsAt) <= new Date(startsAt)) {
        throw new Error("Meeting end time must be after start time");
      }

      const created = await api.meetings.create(currentProject.id, {
        title: title.trim(),
        startsAt,
        endsAt,
        agenda: agenda.trim() || undefined,
        notes: notes.trim() || undefined,
        transcriptText: transcriptText.trim() || undefined,
      });

      setTitle("");
      setAgenda("");
      setNotes("");
      setTranscriptText("");
      setShowCreate(false);
      showToast(`Logged meeting "${created.title}" successfully!`, "success");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log meeting");
      showToast(err.message || "Failed to log meeting", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim() === "") return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.agenda && m.agenda.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    });
  }, [meetings, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Meetings & Transcripts
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Record team discussions, decisions, and paste raw transcripts. Transcripts support version tracking and team indexing.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreate ? "Close Form" : "Log Meeting"}</span>
          </Button>
        </div>

        {/* Create Meeting Card */}
        {showCreate && (
          <Card className="border-blue-500/30 bg-[#101116] shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Log New Team Meeting</span>
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
                  <label className="text-xs font-semibold text-zinc-300">Meeting Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Sprint Planning & Architecture Review"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Date *</label>
                    <Input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Start Time *</label>
                    <Input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">End Time *</label>
                    <Input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Agenda Topics</label>
                  <Input
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="e.g., 1. Review Phase 1 scope 2. Assign tasks 3. QA readiness"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Key Notes & Decisions</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Summary of key discussion points, conclusions, and action items..."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Raw Transcript (Optional)</label>
                    <span className="text-[10px] text-zinc-500 font-mono">Pasted text / audio export</span>
                  </div>
                  <textarea
                    rows={4}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="Paste verbatim transcript text here. Useful for search and AI analysis..."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
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
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4"
                >
                  {submitting ? "Saving..." : "Save Meeting"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search Toolbar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings by title, agenda, or notes..."
            className="pl-8 h-8 text-xs bg-[#161820] border-white/10 text-zinc-200"
          />
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {meetings.length === 0 ? "No Meetings Recorded Yet" : "No Matching Meetings Found"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {meetings.length === 0
                ? "Keep track of team sprint reviews, standups, and discussions in one central place."
                : "Try clearing your search query to see all meetings."}
            </p>
            {meetings.length === 0 ? (
              <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs bg-blue-600 hover:bg-blue-500">
                <Plus className="w-3.5 h-3.5 mr-1" /> Log First Meeting
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const isExpanded = expandedMeetingId === meeting.id;
              return (
                <Card
                  key={meeting.id}
                  className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-blue-400 bg-blue-500/10">
                          {meeting.startsAt ? formatDateTime(meeting.startsAt) : "Scheduled"}
                        </Badge>
                        {meeting.transcriptVersion > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-mono text-zinc-400">
                            Transcript v{meeting.transcriptVersion}
                          </Badge>
                        )}
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                            <Users className="w-3 h-3" />
                            <span>{meeting.attendees.length} attendee(s)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={generatingProposalId === meeting.id}
                          onClick={() => handleGenerateAnalysis(meeting)}
                          className="h-7 text-[11px] border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 gap-1 px-2.5"
                        >
                          <Sparkles className={`w-3 h-3 ${generatingProposalId === meeting.id ? "animate-spin" : "text-blue-400"}`} />
                          <span>{generatingProposalId === meeting.id ? "Analyzing..." : "AI Analysis"}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedMeetingId(isExpanded ? null : meeting.id)}
                          className="h-7 text-[11px] text-zinc-400 hover:text-white gap-1"
                        >
                          <span>{isExpanded ? "Hide Details" : "View Notes & Transcript"}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    <CardTitle className="text-sm font-semibold text-white pt-2 leading-snug">
                      {meeting.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    {meeting.agenda && (
                      <div className="text-xs text-zinc-400">
                        <strong className="text-zinc-300">Agenda:</strong> {meeting.agenda}
                      </div>
                    )}

                    {meeting.notes && (
                      <div className="text-xs text-zinc-300 leading-relaxed bg-[#16171f] p-3 rounded-lg border border-white/[0.04]">
                        {meeting.notes}
                      </div>
                    )}

                    {/* Expandable Transcript Drawer */}
                    {isExpanded && meeting.transcriptText && (
                      <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06] space-y-1.5 animate-in fade-in">
                        <div className="text-[11px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>Full Meeting Transcript (v{meeting.transcriptVersion})</span>
                        </div>
                        <div className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto p-2 bg-black/20 rounded border border-white/5">
                          {meeting.transcriptText}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {activeProposal && currentProject && (
        <ProposalReviewDialog
          isOpen={!!activeProposal}
          onClose={() => setActiveProposal(null)}
          proposal={activeProposal}
          projectId={currentProject.id}
          onConfirmed={(resultRecordIds) => {
            showToast(`Created ${resultRecordIds.length} records from meeting analysis!`, "success");
            setActiveProposal(null);
            loadData();
          }}
          onRejected={() => {
            showToast("Meeting analysis discarded", "info");
            setActiveProposal(null);
          }}
        />
      )}
    </AppLayout>
  );
}
