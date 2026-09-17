"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Unlink,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Layers,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function IntegrationsPage() {
  const { currentProject } = useAuth();
  const { showToast } = useToast();

  const [connection, setConnection] = useState<any>(null);
  const [loadingConnection, setLoadingConnection] = useState(true);

  // Issues state
  const [issues, setIssues] = useState<any[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Action states
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);

  // Form state
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Filter state
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const loadConnection = useCallback(async () => {
    if (!currentProject) return;
    setLoadingConnection(true);
    try {
      const conn = await api.integrations.github.getConnection(currentProject.id);
      setConnection(conn);
      if (conn && conn.status === "CONNECTED") {
        loadIssues(conn);
      } else {
        setIssues([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load GitHub connection", "error");
    } finally {
      setLoadingConnection(false);
    }
  }, [currentProject]);

  const loadIssues = async (activeConn?: any) => {
    if (!currentProject) return;
    setLoadingIssues(true);
    try {
      const res = await api.integrations.github.listIssues(currentProject.id, {
        state: selectedState !== "all" ? selectedState : undefined,
        q: searchQuery.trim() || undefined,
        limit: 50,
      });
      setIssues(res.items || []);
      setTotalIssues(res.total || 0);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load issues", "error");
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    if (connection && connection.status === "CONNECTED") {
      loadIssues();
    }
  }, [selectedState, searchQuery]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !owner.trim() || !repo.trim()) return;

    setConnecting(true);
    try {
      const res = await api.integrations.github.connect(currentProject.id, {
        repositoryOwner: owner.trim(),
        repositoryName: repo.trim(),
        accessToken: token.trim() || undefined,
      });
      setConnection(res);
      setShowConnectForm(false);
      setOwner("");
      setRepo("");
      setToken("");
      showToast(
        `Successfully connected ${res.repositoryOwner}/${res.repositoryName} and synced issues!`,
        "success"
      );
      loadIssues(res);
    } catch (err: any) {
      showToast(err.message || "Failed to connect repository", "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!currentProject) return;
    setSyncing(true);
    try {
      const res = await api.integrations.github.sync(currentProject.id);
      showToast(
        `Synced ${res.syncedCount} issues from GitHub! Total: ${res.totalCount}`,
        "success"
      );
      await loadConnection();
    } catch (err: any) {
      showToast(err.message || "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentProject) return;
    if (
      !window.confirm(
        "Are you sure you want to disconnect this repository? All synchronized issues will be deactivated from search and AI context immediately."
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.integrations.github.disconnect(currentProject.id);
      showToast("Repository disconnected and indexed sources deactivated.", "info");
      setConnection(null);
      setIssues([]);
      setTotalIssues(0);
    } catch (err: any) {
      showToast(err.message || "Failed to disconnect", "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center border border-white/10 shadow-sm">
                <GithubIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Integrations
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Connect external developer tools. Synced issues are vectorized into your project's knowledge base and cited in AI conversations.
            </p>
          </div>
        </div>

        {/* GitHub Connection Status Card */}
        {loadingConnection ? (
          <div className="h-36 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : connection && connection.status === "CONNECTED" ? (
          <Card className="bg-[#121318] border-white/[0.08] shadow-lg">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-inner">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://github.com/${connection.repositoryOwner}/${connection.repositoryName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>
                          {connection.repositoryOwner}/{connection.repositoryName}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      </a>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        CONNECTED
                      </Badge>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{connection.issueCount ?? totalIssues} issues synced</span>
                      <span>•</span>
                      <span>
                        Last sync:{" "}
                        {connection.lastSyncedAt
                          ? formatDateTime(connection.lastSyncedAt)
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={syncing}
                    onClick={handleSync}
                    className="h-8 text-xs border-white/10 hover:bg-white/5 text-zinc-200 gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    <span>{syncing ? "Syncing..." : "Sync Now"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={disconnecting}
                    onClick={handleDisconnect}
                    className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>{disconnecting ? "Disconnecting..." : "Disconnect"}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Issues from this repository are indexed into your knowledge base. When you chat with the AI Assistant or search, relevant GitHub issues will be retrieved and cited as authorized project evidence.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
              <GithubIcon className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-sm font-semibold text-white">
                Connect a GitHub Repository
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Synchronize issues from your GitHub repository to ground AI proposals and answers in real engineering tasks and bug reports.
              </p>
            </div>

            {!showConnectForm ? (
              <Button
                onClick={() => setShowConnectForm(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs gap-1.5 border border-white/10 shadow-sm"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Connect Repository</span>
              </Button>
            ) : (
              <form
                onSubmit={handleConnect}
                className="max-w-md mx-auto p-4 rounded-xl bg-[#14161d] border border-white/10 text-left space-y-3 animate-in fade-in"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Repository Owner / Org *
                  </label>
                  <Input
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g., facebook or your-username"
                    className="h-8 text-xs bg-[#1a1b22] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Repository Name *
                  </label>
                  <Input
                    required
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="e.g., react or ai-workspace"
                    className="h-8 text-xs bg-[#1a1b22] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Personal Access Token (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-500">For private repos</span>
                  </div>
                  <Input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_... (leave empty for public repos / mock)"
                    className="h-8 text-xs bg-[#1a1b22] border-white/10 text-zinc-100 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConnectForm(false)}
                    className="text-xs text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={connecting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4"
                  >
                    {connecting ? "Connecting..." : "Confirm & Sync"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Synced Issues Section */}
        {connection && connection.status === "CONNECTED" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">
                  Synchronized Issues ({totalIssues})
                </h2>
              </div>

              {/* Filter Toolbar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues..."
                    className="pl-8 h-7 text-xs bg-[#161820] border-white/10 text-zinc-200 w-44 sm:w-56"
                  />
                </div>

                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="h-7 rounded-md bg-[#161820] border border-white/10 px-2.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All States</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {loadingIssues ? (
              <div className="space-y-3">
                <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
                <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 p-4 rounded-xl border border-dashed border-white/10 bg-[#0d0e12] space-y-2">
                <p className="text-xs text-zinc-400">
                  No issues found matching your search or state filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedState("all");
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {issues.map((issue) => {
                  const isExpanded = expandedIssues[issue.id];
                  const isOpen = issue.state === "open";
                  return (
                    <Card
                      key={issue.id}
                      className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
                    >
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="pt-0.5">
                              {isOpen ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 font-mono">
                                  OPEN
                                </Badge>
                              ) : (
                                <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0 font-mono">
                                  CLOSED
                                </Badge>
                              )}
                            </span>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-zinc-400">
                                  #{issue.issueNumber}
                                </span>
                                <a
                                  href={issue.htmlUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
                                >
                                  <span>{issue.title}</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                                </a>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
                                {issue.authorLogin && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-zinc-500" />
                                    <span>{issue.authorLogin}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  <span>Updated {formatDate(issue.githubUpdatedAt)}</span>
                                </span>
                              </div>

                              {issue.labels && issue.labels.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  {issue.labels.map((label: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {issue.body && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(issue.id)}
                              className="h-6 text-[11px] text-zinc-400 hover:text-white shrink-0 gap-1 self-end sm:self-start"
                            >
                              <span>{isExpanded ? "Hide Body" : "View Body"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Collapsible Body preview */}
                        {isExpanded && issue.body && (
                          <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/[0.04] text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in">
                            {issue.body}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
