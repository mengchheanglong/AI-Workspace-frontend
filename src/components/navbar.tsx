"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, Project } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, FolderKanban, Search, Command, ChevronDown } from "lucide-react";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, currentProject, projects, setCurrentProject, logout } = useAuth();

  // Cmd+K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090a]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand & Project Switcher */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-sm tracking-tight text-white hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">AI Workspace</span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="flex items-center gap-2 bg-[#121318] border border-white/[0.08] hover:border-white/20 rounded-lg px-2.5 py-1 transition-all">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={currentProject?.id || ""}
                  onChange={(e) => {
                    const p = projects.find((proj: Project) => proj.id === e.target.value);
                    if (p) setCurrentProject(p);
                  }}
                  className="text-xs font-medium bg-transparent text-zinc-200 focus:outline-none cursor-pointer pr-1"
                  aria-label="Select active project"
                >
                  {projects.map((p: Project) => (
                    <option key={p.id} value={p.id} className="bg-[#14151b] text-zinc-200">
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
                {currentProject?.currentUserRole && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-zinc-400 border-white/10">
                    {currentProject.currentUserRole}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {user && (
            <Link href="/search">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs text-zinc-400 bg-white/[0.02] border-white/10 hover:border-indigo-500/40 hover:text-zinc-200 transition-all"
                title="Search Workspace (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden md:inline">Quick Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="hidden sm:flex flex-col items-end text-xs leading-tight">
                <span className="font-semibold text-zinc-200">{user.displayName || user.fullName || user.email}</span>
                <span className="text-[10px] text-indigo-400 uppercase font-mono">{user.professionalRole || user.systemRole || user.role}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
