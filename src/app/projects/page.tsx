"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Project } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, FolderKanban, Check, Sparkles, AlertCircle } from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, currentProject, setCurrentProject, refreshProjects } = useAuth();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const created = await api.projects.create({ name: name.trim(), key: key.trim().toUpperCase(), description: description.trim() || undefined });
      setName("");
      setKey("");
      setDescription("");
      setShowCreate(false);
      showToast(`Project [${created.key}] created successfully!`, "success");
      await refreshProjects();
      setCurrentProject(created);
    } catch (err: any) {
      const msg = err.message || "Failed to create project";
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (proj: Project) => {
    setCurrentProject(proj);
    showToast(`Switched to ${proj.name}`, "info");
    router.push("/dashboard");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Project Workspaces
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select an active workspace to open its dashboard and files, or create a new isolated project.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreate ? "Close Form" : "New Project"}</span>
          </Button>
        </div>

        {/* Create Project Card */}
        {showCreate && (
          <Card className="border-indigo-500/30 bg-[#101116] shadow-2xl animate-in fade-in slide-in-from-top-2 max-w-xl">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create New Project Workspace</span>
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
                  <label className="text-xs font-semibold text-zinc-300">Project Name *</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mobile Banking 2.0"
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Project Key * (2-10 letters)</label>
                    <span className="text-[10px] text-zinc-500 font-mono">Used for AIW-REQ-1, AIW-TSK-1</span>
                  </div>
                  <Input
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="e.g., MB"
                    maxLength={10}
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100 font-mono tracking-wider"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief summary of the workspace purpose and scope..."
                    className="h-9 text-xs bg-[#161820] border-white/10 text-zinc-100"
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
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4"
                >
                  {loading ? "Creating..." : "Create Workspace"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj: Project) => {
            const isCurrent = currentProject?.id === proj.id;
            return (
              <Card
                key={proj.id}
                className={`bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md flex flex-col justify-between ${
                  isCurrent ? "border-indigo-500/50 bg-indigo-950/10 shadow-indigo-500/5" : ""
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono text-xs font-bold bg-indigo-600/20 text-indigo-300 border-indigo-500/30">
                        {proj.key}
                      </Badge>
                      {proj.currentUserRole && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono border-white/10 text-zinc-400">
                          {proj.currentUserRole}
                        </Badge>
                      )}
                    </div>
                    {isCurrent && (
                      <Badge variant="success" className="text-[10px] gap-1 py-0.5">
                        <Check className="w-3 h-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-white mt-3">
                    {proj.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-zinc-400 mt-1 leading-relaxed">
                    {proj.description || "No project description provided."}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="p-5 pt-0 flex justify-between items-center border-t border-white/[0.04] mt-4">
                  <Button
                    variant={isCurrent ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setCurrentProject(proj);
                      showToast(`Active workspace set to ${proj.name}`, "info");
                    }}
                    className="text-xs"
                  >
                    {isCurrent ? "Active Workspace" : "Set Active"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleOpenProject(proj)}
                    className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
