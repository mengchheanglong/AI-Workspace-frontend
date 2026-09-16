"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  FileText,
  FileCheck2,
  GitPullRequest,
  CheckSquare,
  Calendar,
  ExternalLink,
  X,
  Sparkles,
  Command
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const TYPE_ICONS: Record<string, any> = {
  REQUIREMENT: FileCheck2,
  DECISION: GitPullRequest,
  TASK: CheckSquare,
  MEETING: Calendar,
  DOCUMENT: FileText,
};

const TYPE_LINKS: Record<string, string> = {
  REQUIREMENT: "/requirements",
  DECISION: "/decisions",
  TASK: "/tasks",
  MEETING: "/meetings",
  DOCUMENT: "/documents",
};

const TYPE_COLORS: Record<string, string> = {
  REQUIREMENT: "bg-indigo-600/15 text-indigo-400 border-indigo-500/20",
  DECISION: "bg-purple-600/15 text-purple-400 border-purple-500/20",
  TASK: "bg-emerald-600/15 text-emerald-400 border-emerald-500/20",
  MEETING: "bg-blue-600/15 text-blue-400 border-blue-500/20",
  DOCUMENT: "bg-amber-600/15 text-amber-400 border-amber-500/20",
};

const SUGGESTIONS = [
  "Authentication",
  "Verification",
  "Session",
  "PostgreSQL",
  "AIW-REQ-1",
  "Cookie",
  "Meeting"
];

export default function SearchPage() {
  const { currentProject } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async (searchTerm: string, typeFilter?: string) => {
    if (!currentProject || !searchTerm.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const envelope = await api.search.query(
        currentProject.id,
        searchTerm.trim(),
        typeFilter || undefined
      );
      setResults(envelope.data || []);
      setMeta(envelope.meta || null);
    } catch (err: any) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, selectedType);
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    executeSearch(term, selectedType);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (query.trim()) {
      executeSearch(query, type);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setMeta(null);
    setHasSearched(false);
  };

  const counts = meta?.countsByType || {};
  const totalCount =
    (counts.REQUIREMENT || 0) +
    (counts.DECISION || 0) +
    (counts.TASK || 0) +
    (counts.MEETING || 0) +
    (counts.DOCUMENT || 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/15 text-cyan-400 flex items-center justify-center">
              <SearchIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Workspace Universal Search
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Instant multi-entity search across requirements, decisions, tasks, meetings, and documents with faceted counts.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword or local key (e.g. AIW-REQ-1, postgres, session, auth)..."
              className="pl-10 pr-10 text-xs h-10 bg-[#121318] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-10 px-5 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold"
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Suggested Searches */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-zinc-400">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Suggestions:
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-zinc-300 transition-all font-mono"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Faceted Tabs */}
        {hasSearched && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/[0.06] pb-3 text-xs">
            <button
              onClick={() => handleTypeChange("")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "" ? "bg-white/10 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Results ({totalCount || results.length})
            </button>
            <button
              onClick={() => handleTypeChange("REQUIREMENT")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "REQUIREMENT" ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Requirements ({counts.REQUIREMENT || 0})
            </button>
            <button
              onClick={() => handleTypeChange("TASK")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "TASK" ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Tasks ({counts.TASK || 0})
            </button>
            <button
              onClick={() => handleTypeChange("DECISION")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "DECISION" ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Decisions ({counts.DECISION || 0})
            </button>
            <button
              onClick={() => handleTypeChange("MEETING")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "MEETING" ? "bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Meetings ({counts.MEETING || 0})
            </button>
            <button
              onClick={() => handleTypeChange("DOCUMENT")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedType === "DOCUMENT" ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Documents ({counts.DOCUMENT || 0})
            </button>
          </div>
        )}

        {/* Results Stream */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-20 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center mx-auto">
              <SearchIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Instant Workspace Search
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Search by title, project key, or text content across all 5 workspace modules in <span className="text-indigo-400 font-semibold">{currentProject?.name}</span>.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <h3 className="text-sm font-semibold text-white">No Matching Records Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No results found for "<span className="text-white">{query}</span>". Try different keywords or select another filter tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-zinc-400">
              Found {results.length} result(s) for "<span className="text-zinc-200">{query}</span>"
            </div>
            {results.map((item, idx) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const link = TYPE_LINKS[item.type] || "/dashboard";
              const colorClass = TYPE_COLORS[item.type] || "bg-zinc-800 text-zinc-300";

              return (
                <Card
                  key={item.id || idx}
                  className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md group"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] font-mono uppercase ${colorClass}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          <span>{item.type}</span>
                        </Badge>
                        {item.key && (
                          <span className="font-mono text-xs font-semibold text-zinc-300 bg-white/[0.04] px-1.5 py-0.5 rounded">
                            {item.key}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </span>
                      </div>

                      <Link href={link}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-zinc-400 hover:text-white">
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>

                    {item.snippet && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed bg-[#16171f] p-2.5 rounded-lg border border-white/[0.04]">
                        {item.snippet}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                      <span>{formatDate(item.createdAt)}</span>
                      <span className="text-zinc-600">ID: {item.id.substring(0, 8)}...</span>
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
