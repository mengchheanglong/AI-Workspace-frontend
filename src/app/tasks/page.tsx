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
  Calendar,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  Copy,
  ListTodo,
  CheckSquare,
  ArrowRight,
  Filter,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TasksPage() {
  
  const { currentProject } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const [tasksData, reqsData] = await Promise.all([
        api.tasks.list(currentProject.id),
        api.requirements.list(currentProject.id).catch(() => []),
      ]);
      setTasks(tasksData || []);
      setRequirements(reqsData || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load tasks", "error");
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
    if (!currentProject || !title.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.tasks.create(currentProject.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? dueDate : undefined,
        requirementId: requirementId ? requirementId : undefined,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setRequirementId("");
      setShowCreate(false);
      showToast(`Task ${created.displayKey || "item"} created successfully!`, "success");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create task");
      showToast(err.message || "Failed to create task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (task: any, newStatus: string) => {
    if (!currentProject) return;
    try {
      await api.tasks.update(currentProject.id, task.id, {
        version: task.version,
        status: newStatus,
      });
      showToast(`${task.displayKey} marked as ${newStatus}`, "success");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update task status", "error");
    }
  };

  const isTaskOverdue = (task: any) => {
    if (!task.dueDate) return false;
    if (task.status === "DONE" || task.status === "CANCELLED") return false;
    return task.dueDate < todayStr;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.displayKey && task.displayKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesTab = true;
      if (activeTab === "OVERDUE") {
        matchesTab = isTaskOverdue(task);
      } else if (activeTab !== "ALL") {
        matchesTab = task.status === activeTab;
      }

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesTab && matchesPriority;
    });
  }, [tasks, searchQuery, activeTab, priorityFilter, todayStr]);

  const overdueCount = useMemo(() => {
    return tasks.filter((t) => isTaskOverdue(t)).length;
  }, [tasks, todayStr]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return <Badge variant="success" className="text-[10px]">DONE</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[10px]">IN PROGRESS</Badge>;
      case "IN_REVIEW":
        return <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[10px]">IN REVIEW</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary" className="line-through text-zinc-500 text-[10px]">CANCELLED</Badge>;
      default:
        return <Badge variant="outline" className="text-zinc-400 text-[10px]">TO DO</Badge>;
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
              <div className="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
                <ListTodo className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Task Management
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Actionable engineering items with due dates, priorities, optimistic locking, and requirement traceability.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreate ? "Close Form" : "Create Task"}</span>
          </Button>
        </div>

        {/* Create Task Card */}
        {showCreate && (
          <Card className="border-emerald-500/30 bg-[#101116] shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Create New Actionable Task</span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <div className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Task Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Implement Session Cookie CSRF Interceptor"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full h-9 rounded-md bg-[#161820] border border-white/10 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Link Requirement</label>
                    <select
                      value={requirementId}
                      onChange={(e) => setRequirementId(e.target.value)}
                      className="w-full h-9 rounded-md bg-[#161820] border border-white/10 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="">No Requirement Link</option>
                      {requirements.map((req) => (
                        <option key={req.id} value={req.id}>
                          [{req.displayKey || "REQ"}] {req.title.substring(0, 32)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description / Instructions</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide technical implementation notes, target files, or acceptance requirements..."
                    className="w-full rounded-md bg-[#161820] border border-white/10 p-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
                >
                  {submitting ? "Saving..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] pb-2 text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === "ALL" ? "bg-white/10 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("TODO")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === "TODO" ? "bg-white/10 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              To Do ({tasks.filter(t => t.status === "TODO").length})
            </button>
            <button
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              In Progress ({tasks.filter(t => t.status === "IN_PROGRESS").length})
            </button>
            <button
              onClick={() => setActiveTab("IN_REVIEW")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === "IN_REVIEW" ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              In Review ({tasks.filter(t => t.status === "IN_REVIEW").length})
            </button>
            <button
              onClick={() => setActiveTab("DONE")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === "DONE" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Done ({tasks.filter(t => t.status === "DONE").length})
            </button>
            {overdueCount > 0 && (
              <button
                onClick={() => setActiveTab("OVERDUE")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === "OVERDUE" ? "bg-red-500/20 text-red-300 font-semibold border border-red-500/40" : "text-red-400 hover:bg-red-500/10"}`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue ({overdueCount})</span>
              </button>
            )}
          </div>

          {/* Search & Priority Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101116] border border-white/[0.06] p-3 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, key (AIW-TSK-1), or content..."
                className="pl-8 h-8 text-xs bg-[#161820] border-white/10 text-zinc-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 rounded-md bg-[#161820] border border-white/10 px-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {tasks.length === 0 ? "No Tasks in this Workspace Yet" : "No Matching Tasks Found"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {tasks.length === 0
                ? "Break down your project requirements into trackable action items with due dates."
                : "Try clearing your search query or switching to another status tab."}
            </p>
            {tasks.length === 0 ? (
              <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Task
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("ALL");
                  setPriorityFilter("ALL");
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task);
              return (
                <Card
                  key={task.id}
                  className={`bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md ${overdue ? "border-red-500/40 bg-red-950/10" : ""}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(task.displayKey || task.id, "task key")}
                          className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 bg-emerald-600/15 hover:bg-emerald-600/25 px-2 py-0.5 rounded border border-emerald-500/20 transition-all group"
                          title="Click to copy key"
                        >
                          <span>{task.displayKey || task.id.substring(0, 8)}</span>
                          <Copy className="w-3 h-3 text-emerald-400/60 group-hover:text-emerald-400" />
                        </button>
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                        {overdue && (
                          <Badge variant="destructive" className="text-[9px] gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </Badge>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">Rev: v{task.version}</span>
                      </div>

                      {/* Status changer & Quick Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {task.status === "TODO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(task, "IN_PROGRESS")}
                            className="h-7 text-[11px] px-2.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1"
                          >
                            Start Task <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(task, "DONE")}
                            className="h-7 text-[11px] px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                          >
                            Mark Done <CheckCircle2 className="w-3 h-3" />
                          </Button>
                        )}

                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task, e.target.value)}
                          className="text-xs bg-[#1a1b22] border border-white/10 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="TODO">TO DO</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="IN_REVIEW">IN REVIEW</option>
                          <option value="DONE">DONE</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    <CardTitle className="text-sm font-semibold text-white pt-2 leading-snug">
                      {task.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2.5">
                    {task.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[11px] text-zinc-400">
                      <div className="flex items-center gap-3">
                        {task.dueDate ? (
                          <span className={`flex items-center gap-1 font-mono ${overdue ? "text-red-400 font-semibold" : "text-zinc-400"}`}>
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Due: {task.dueDate}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">No due date</span>
                        )}

                        {task.requirement && (
                          <span className="flex items-center gap-1 text-indigo-400 font-mono">
                            <LinkIcon className="w-3 h-3 text-indigo-400/70" />
                            <span>{task.requirement.displayKey || "Linked REQ"}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-zinc-500 font-mono">
                        Created {formatDate(task.createdAt)}
                      </span>
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
