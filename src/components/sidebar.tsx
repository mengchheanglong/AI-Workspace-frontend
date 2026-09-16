"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileCheck2,
  GitPullRequest,
  CheckSquare,
  Calendar,
  FileText,
  Search,
  FolderOpen,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Assistant", href: "/assistant", icon: Sparkles },
  { label: "Requirements", href: "/requirements", icon: FileCheck2 },
  { label: "Decisions", href: "/decisions", icon: GitPullRequest },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Search", href: "/search", icon: Search },
  { label: "Projects", href: "/projects", icon: FolderOpen },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-white/[0.08] bg-[#0c0d10] flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div className="p-3 text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
        Workspace
      </div>
      <nav className="px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-indigo-400" : "text-zinc-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
