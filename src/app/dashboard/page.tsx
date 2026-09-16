"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  ListTodo,
  Activity,
  User as UserIcon,
  Plus,
  GitPullRequest,
  Calendar,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FolderOpen
} from "lucide-react";

export default function DashboardPage() {
  const { currentProject, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!currentProject) return;
      setLoading(true);
      try {
        const [dashData, actEnvelope] = await Promise.all([
          api.dashboard.get(currentProject.id),
          api.dashboard.getActivity(currentProject.id, 1, 15),
        ]);
        setStats(dashData);
        setActivity(actEnvelope?.data || dashData?.recentActivity || []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [currentProject]);

  if (!currentProject) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">No Project Selected</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            Please select an existing project or create a new workspace to view its dashboard.
          </p>
          <Link href="/projects">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-xs">
              Go to Projects
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const reqCounts = stats?.requirementCountsByStatus || {};
  const totalReqs =
    (reqCounts.DRAFT ?? 0) +
    (reqCounts.APPROVED ?? 0) +
    (reqCounts.IN_PROGRESS ?? 0) +
    (reqCounts.DONE ?? 0);

  const taskCounts = stats?.taskCountsByStatus || {};
  const taskProgress = stats?.taskProgress;
  const progressPct = taskProgress?.percentage ?? 0;
  const overdueCount = stats?.overdueTasksCount ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#12131a] to-[#0e0f14] border border-white/[0.08] p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono text-indigo-400 border-indigo-500/30 bg-indigo-600/10">
                {currentProject.key}
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {currentProject.name}
              </h1>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {currentProject.description || "Unified project management for requirements, architectural decisions, tasks, meetings, and documents."}
            </p>
          </div>
          <div className="flex items-center gap-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs gap-1.5 h-8 border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showGuide ? "Hide Guide" : "How It Works"}</span>
            </Button>
            <Link href="/search">
              <Button size="sm" className="text-xs gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Overdue Task Alert (Bangkok Timezone) */}
        {overdueCount > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-red-300">
                  {overdueCount} Overdue Task{overdueCount > 1 ? "s" : ""}
                </span>{" "}
                in Bangkok timezone (Asia/Bangkok). Action is required to keep project on schedule.
              </div>
            </div>
            <Link href="/tasks">
              <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/40 text-red-300 hover:bg-red-500/20 gap-1">
                View Tasks <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* Interactive Quick Actions Hub */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quick Actions
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/requirements" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 flex items-center justify-between">
                    <span>Requirements</span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Specifications</div>
                </div>
              </div>
            </Link>

            <Link href="/tasks" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300 flex items-center justify-between">
                    <span>Tasks</span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Track & Assign</div>
                </div>
              </div>
            </Link>

            <Link href="/decisions" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-purple-600/15 text-purple-400 flex items-center justify-center">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300 flex items-center justify-between">
                    <span>Decisions</span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-purple-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Log ADRs</div>
                </div>
              </div>
            </Link>

            <Link href="/meetings" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 flex items-center justify-between">
                    <span>Meetings</span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-blue-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Minutes & Notes</div>
                </div>
              </div>
            </Link>

            <Link href="/documents" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-amber-600/15 text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 flex items-center justify-between">
                    <span>Documents</span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-amber-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Upload Files</div>
                </div>
              </div>
            </Link>

            <Link href="/search" className="group">
              <div className="p-3.5 rounded-xl bg-[#121318] border border-white/[0.08] hover:border-cyan-500/40 hover:bg-cyan-600/5 transition-all text-left flex flex-col justify-between h-24">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/15 text-cyan-400 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 flex items-center justify-between">
                    <span>Search</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-cyan-400" />
                  </div>
                  <div className="text-[10px] text-zinc-500">Instant Lookup</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Getting Started Guide */}
        {showGuide && (
          <div className="p-5 rounded-2xl bg-[#101116] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>How This Workspace Works</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">4-Step Workflow</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">1</span>
                  <span>Define Scope</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Add <strong className="text-zinc-200">Requirements</strong> with acceptance criteria. Each requirement gets a permanent key like <code className="text-indigo-300">AIW-REQ-1</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">2</span>
                  <span>Record Decisions</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Log <strong className="text-zinc-200">ADRs</strong> to capture architecture decisions and rationale to avoid repetitive debates later.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                  <span>Execute Tasks</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Create <strong className="text-zinc-200">Tasks</strong> linked to requirements. Set due dates and track optimistic status transitions.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">4</span>
                  <span>Store Documents</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Upload <strong className="text-zinc-200">PDFs, DOCX, and Markdown</strong> files. Everything is indexed and searchable across the workspace.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Progress Card */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Task Completion</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-7 w-24 bg-white/5" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-white">{progressPct}%</div>
                    <span className="text-xs text-zinc-400 font-mono">
                      {taskProgress ? `${taskProgress.done}/${taskProgress.total - taskProgress.cancelled}` : "0/0"}
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Formula: done / (total - cancelled)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Overdue Tasks</CardTitle>
              <Clock className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <Skeleton className="h-7 w-16 bg-white/5" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{overdueCount}</div>
                  <p className="text-[10px] text-zinc-500">
                    Calculated in Bangkok timezone (ICT)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">My Assigned Tasks</CardTitle>
              <UserIcon className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <Skeleton className="h-7 w-16 bg-white/5" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {stats?.myAssignedTasksCount ?? 0}
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Assigned to {user?.displayName || "you"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Requirements Total */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Total Requirements</CardTitle>
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <Skeleton className="h-7 w-16 bg-white/5" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{totalReqs}</div>
                  <p className="text-[10px] text-zinc-500">
                    {reqCounts.APPROVED ?? 0} approved, {reqCounts.IN_PROGRESS ?? 0} in progress
                  </p>
                </>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Detailed Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Requirements Status */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Requirements by Status</span>
                <Link href="/requirements" className="text-[11px] text-indigo-400 hover:underline font-normal">
                  View all →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              {loading ? (
                <Skeleton className="h-20 w-full bg-white/5" />
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">Draft</span>
                    <Badge variant="outline" className="text-xs font-mono">{reqCounts.DRAFT ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">Approved</span>
                    <Badge variant="success" className="text-xs font-mono">{reqCounts.APPROVED ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">In Progress</span>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs font-mono">{reqCounts.IN_PROGRESS ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">Done</span>
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">{reqCounts.DONE ?? 0}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Status */}
          <Card className="bg-[#121318] border-white/[0.08]">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                <span>Tasks by Status</span>
                <Link href="/tasks" className="text-[11px] text-emerald-400 hover:underline font-normal">
                  View all →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              {loading ? (
                <Skeleton className="h-20 w-full bg-white/5" />
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">To Do</span>
                    <Badge variant="outline" className="text-xs font-mono">{taskCounts.TODO ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">In Progress</span>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs font-mono">{taskCounts.IN_PROGRESS ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">In Review</span>
                    <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-xs font-mono">{taskCounts.IN_REVIEW ?? 0}</Badge>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-zinc-400">Done</span>
                    <Badge variant="success" className="text-xs font-mono">{taskCounts.DONE ?? 0}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Live Recent Activity */}
        <Card className="bg-[#121318] border-white/[0.08]">
          <CardHeader className="pb-3 border-b border-white/[0.06]">
            <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity Feed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">
                No recent activity recorded for this workspace yet.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activity.map((item, idx) => (
                  <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-white/10 shrink-0">
                        {item.entityType || "ITEM"}
                      </Badge>
                      <span className="text-zinc-300 font-medium truncate">
                        {item.action || "Updated"}
                      </span>
                      {item.actor && (
                        <span className="text-zinc-500 text-[11px] truncate hidden sm:inline">
                          by {item.actor.displayName || item.actor.email}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
