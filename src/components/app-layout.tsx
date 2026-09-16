"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, FolderKanban, Home } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, currentProject, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08090a]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="space-y-4 max-w-md w-full">
            <Skeleton className="h-8 w-48 bg-white/5" />
            <Skeleton className="h-32 w-full bg-white/5" />
            <Skeleton className="h-48 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08090a]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            Please log in with your credentials or a sample test account to access this workspace.
          </p>
          <Link href="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Derive section name from pathname
  const sectionName = pathname.split("/")[1] || "dashboard";
  const formattedSection = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#08090a] text-zinc-100">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Spatial Breadcrumb Bar */}
          <div className="h-10 border-b border-white/[0.06] bg-[#0d0e12]/60 px-6 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Link href="/dashboard" className="hover:text-zinc-200 transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />

              {currentProject ? (
                <Link href="/projects" className="flex items-center gap-1 hover:text-zinc-200 transition-colors truncate">
                  <span className="font-mono text-indigo-400 font-semibold">[{currentProject.key}]</span>
                  <span className="truncate">{currentProject.name}</span>
                </Link>
              ) : (
                <span className="text-amber-400">No Project</span>
              )}

              <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
              <span className="text-zinc-200 font-medium">{formattedSection}</span>
            </div>

            {currentProject && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-white/10 text-zinc-400 font-mono">
                  Role: {currentProject.currentUserRole || "MEMBER"}
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected" />
              </div>
            )}
          </div>

          <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
