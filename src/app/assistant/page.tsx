"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Bot, Send, Plus, Trash2,
  FileText, FileCheck2, GitPullRequest, CheckSquare, Calendar,
  ShieldCheck, AlertCircle, Loader2, ChevronDown, ChevronUp,
  MessageSquare, Zap, Code2, TestTube, Layers, Server, Presentation,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CitationItem {
  chunkId: string;
  sourceId: string;
  sourceType: string;
  title: string;
  revision: number;
  locator?: string | null;
  score?: number;
  snippet?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  mode: string;
  content: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  citations: CitationItem[];
  modelName?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  projectId: string;
  title: string;
  defaultMode: string;
  createdAt: string;
  updatedAt: string;
}

const MODES = [
  { key: "PM",             label: "PM",     icon: Zap,          color: "text-violet-400", desc: "Project status, risks & blockers" },
  { key: "DEVELOPER",      label: "Dev",    icon: Code2,         color: "text-blue-400",   desc: "Architecture, APIs & code guidance" },
  { key: "QA",             label: "QA",     icon: TestTube,      color: "text-emerald-400",desc: "Acceptance criteria & test cases" },
  { key: "DX",             label: "DX",     icon: Layers,        color: "text-amber-400",  desc: "Onboarding & developer docs" },
  { key: "INFRASTRUCTURE", label: "Infra",  icon: Server,        color: "text-cyan-400",   desc: "Containers & runtime ops" },
  { key: "PRESENTATION",   label: "Slides", icon: Presentation,  color: "text-pink-400",   desc: "Executive summaries & reports" },
];

const SOURCE_TYPE_ICONS: Record<string, React.ElementType> = {
  DOCUMENT:    FileText,
  REQUIREMENT: FileCheck2,
  DECISION:    GitPullRequest,
  TASK:        CheckSquare,
  MEETING:     Calendar,
};

const PROMPT_SUGGESTIONS = [
  { mode: "PM",             text: "What are the core requirements and current project status?" },
  { mode: "DEVELOPER",      text: "Explain the database architecture and pgvector indexing rules." },
  { mode: "QA",             text: "Generate QA acceptance test cases for user authentication." },
  { mode: "DX",             text: "What is the recommended local development workflow?" },
  { mode: "INFRASTRUCTURE", text: "How is pgvector and PostgreSQL configured for local development?" },
];

function getModeConfig(key: string) {
  return MODES.find((m) => m.key === key) ?? MODES[0]!;
}

function UserAvatar({ name }: { name?: string }) {
  const initials = (name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold bg-zinc-700 border border-white/10 text-zinc-200 select-none">
      {initials}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("\u2022 ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-400 mt-0.5 shrink-0">\u2022</span>
              <span className="text-zinc-200">{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-zinc-200">{line}</p>;
      })}
    </div>
  );
}

export default function AssistantPage() {
  const { currentProject, user } = useAuth();
  const [conversations,     setConversations]     = useState<Conversation[]>([]);
  const [activeConv,        setActiveConv]         = useState<Conversation | null>(null);
  const [messages,          setMessages]           = useState<ChatMessage[]>([]);
  const [selectedMode,      setSelectedMode]       = useState<string>("PM");
  const [sourceFilter,      setSourceFilter]       = useState<string>("");
  const [inputContent,      setInputContent]       = useState<string>("");
  const [isLoading,         setIsLoading]          = useState<boolean>(false);
  const [isSending,         setIsSending]          = useState<boolean>(false);
  const [expandedCitation,  setExpandedCitation]   = useState<string | null>(null);
  const [sendError,         setSendError]          = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages, isSending]);

  useEffect(() => {
    if (!currentProject) return;
    void loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentProject || !activeConv) { setMessages([]); return; }
    void loadMessages(activeConv.id);
    setSelectedMode(activeConv.defaultMode || "PM");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id]);

  const loadConversations = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const res  = await api.ai.listConversations(currentProject.id);
      const list: Conversation[] = Array.isArray(res) ? res : [];
      setConversations(list);
      if (list.length > 0) {
        setActiveConv((prev) => (prev && list.some((c) => c.id === prev.id) ? prev : list[0]!));
      } else {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    if (!currentProject) return;
    try {
      const res = await api.ai.listMessages(currentProject.id, convId);
      setMessages(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleCreateConversation = async () => {
    if (!currentProject) return;
    try {
      const conv = await api.ai.createConversation(currentProject.id, {
        title: "New Conversation",
        defaultMode: selectedMode,
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConv(conv);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.ai.deleteConversation(currentProject.id, convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConv?.id === convId) setActiveConv(updated[0] ?? null);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend !== undefined ? textToSend : inputContent).trim();
      if (!text || isSending || !currentProject) return;

      setSendError(null);

      let conv = activeConv;
      if (!conv) {
        try {
          conv = await api.ai.createConversation(currentProject.id, {
            title: text.length > 45 ? text.slice(0, 42) + "..." : text,
            defaultMode: selectedMode,
          });
          setActiveConv(conv);
          setConversations((prev) => [conv!, ...prev]);
        } catch (err: any) {
          setSendError(err?.message ?? "Failed to create conversation. Are you logged in?");
          return;
        }
      }

      if (!conv) return;

      const optimisticId = "temp-" + Date.now();
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        conversationId: conv.id,
        role: "user",
        mode: selectedMode,
        content: text,
        status: "COMPLETED",
        citations: [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputContent("");
      setIsSending(true);

      try {
        const res = await api.ai.postMessage(currentProject.id, conv.id, {
          content: text,
          mode: selectedMode,
          sourceType: sourceFilter || undefined,
        });

        const { userMessage, assistantMessage } = res;

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId),
          userMessage,
          assistantMessage,
        ]);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv!.id && c.title === "New Conversation"
              ? { ...c, title: text.slice(0, 45) }
              : c
          )
        );
      } catch (err: any) {
        setSendError(err?.message ?? "Failed to get AI response. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [inputContent, isSending, currentProject, activeConv, selectedMode, sourceFilter]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const currentModeConfig = getModeConfig(selectedMode);
  const ModeIcon = currentModeConfig.icon;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#08090a]">

        {/* Sidebar */}
        <aside className="w-60 border-r border-white/[0.07] bg-[#0b0c0f] flex flex-col shrink-0">
          <div className="px-3 py-3 border-b border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Conversations</span>
            </div>
            <button
              onClick={() => void handleCreateConversation()}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-600/25 hover:text-indigo-300 transition-all"
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center gap-2 text-zinc-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-white/5 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-xs text-zinc-500">No conversations yet.<br />Start a new chat!</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive  = activeConv?.id === c.id;
                const modeConf  = getModeConfig(c.defaultMode);
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={"group flex items-start justify-between gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-all " + (
                      isActive
                        ? "bg-indigo-600/15 border border-indigo-500/25 text-white"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
                    )}
                  >
                    <div className="truncate flex-1 min-w-0">
                      <div className="truncate font-medium">{c.title || "New Conversation"}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={"text-[10px] font-mono " + modeConf.color}>{c.defaultMode}</span>
                        <span className="text-zinc-600 text-[10px]">·</span>
                        <span className="text-[10px] text-zinc-500">{formatDate(c.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => void handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 p-0.5 rounded hover:text-red-400 text-zinc-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-3 py-2.5 border-t border-white/[0.07] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-zinc-500 leading-tight">Project-scoped · Grounded citations only</span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="px-4 py-2.5 border-b border-white/[0.07] bg-[#0b0c0f]/80 backdrop-blur-sm flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-medium">Mode</span>
              <div className="flex items-center gap-0.5 bg-[#111318] rounded-lg p-0.5 border border-white/[0.07]">
                {MODES.map((m) => {
                  const Icon       = m.icon;
                  const isSelected = selectedMode === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMode(m.key)}
                      title={m.desc}
                      className={"flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all " + (
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                      )}
                    >
                      <Icon className={"w-3 h-3 " + (isSelected ? "text-white" : m.color)} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] py-0.5 px-2.5 bg-indigo-950/30 border-indigo-500/25 text-indigo-300 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DeepSeek V4 Pro · Hybrid RRF
            </Badge>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {messages.length === 0 ? (
              <div className="max-w-xl mx-auto mt-8 space-y-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-900/20">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Workspace Copilot</h2>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Ask anything about your project. Every answer is grounded in your documents, requirements, decisions, tasks and meetings — with exact citations.
                  </p>
                </div>
                <div className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs " + currentModeConfig.color}>
                  <ModeIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{currentModeConfig.label} mode</span>
                  <span className="text-zinc-600">–</span>
                  <span className="text-zinc-400">{currentModeConfig.desc}</span>
                </div>
                <div className="text-left bg-[#0e0f14] border border-white/[0.07] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.07]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Suggested prompts</span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {PROMPT_SUGGESTIONS.map((item, idx) => {
                      const mc    = getModeConfig(item.mode);
                      const SIcon = mc.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMode(item.mode);
                            setTimeout(() => void handleSendMessage(item.text), 0);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
                        >
                          <SIcon className={"w-3.5 h-3.5 shrink-0 " + mc.color} />
                          <span className="flex-1 text-xs text-zinc-300 group-hover:text-white transition-colors">{item.text}</span>
                          <Badge variant="outline" className={"text-[9px] font-mono border-white/10 shrink-0 " + mc.color}>{item.mode}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAssistant   = msg.role === "assistant";
                const isFailed      = msg.status === "FAILED";
                const isInsufficient =
                  msg.content.toLowerCase().includes("insufficient evidence") ||
                  msg.content.toLowerCase().includes("no relevant project evidence");

                return (
                  <div key={msg.id} className={"flex gap-3 items-start " + (!isAssistant ? "flex-row-reverse" : "")}>
                    {isAssistant ? (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <UserAvatar name={user?.displayName ?? user?.fullName} />
                    )}
                    <div className={"space-y-1.5 " + (isAssistant ? "max-w-[80%]" : "max-w-[65%]")}>
                      <div className={"flex items-center gap-2 text-[10px] text-zinc-500 " + (!isAssistant ? "flex-row-reverse" : "")}>
                        <span className="font-medium text-zinc-400">{isAssistant ? "AI Copilot" : (user?.displayName ?? "You")}</span>
                        {isAssistant && (
                          <Badge variant="outline" className={"text-[9px] py-0 px-1.5 font-mono border-white/10 " + getModeConfig(msg.mode).color}>
                            {msg.mode}
                          </Badge>
                        )}
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                      <div className={"rounded-2xl px-4 py-3 space-y-3 " + (
                        isAssistant
                          ? isFailed ? "bg-red-950/25 border border-red-500/30" : "bg-[#111218] border border-white/[0.08]"
                          : "bg-indigo-600 shadow-lg shadow-indigo-900/20"
                      )}>
                        {isAssistant && isInsufficient && (
                          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/25 rounded-lg p-2.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-amber-300">Knowledge Boundary Enforced</p>
                              <p className="text-[11px] text-amber-400/70 mt-0.5">No verified evidence — the assistant declined to hallucinate.</p>
                            </div>
                          </div>
                        )}
                        {isAssistant
                          ? <MessageContent content={msg.content} />
                          : <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-white">{msg.content}</p>
                        }
                        {isAssistant && msg.citations && msg.citations.length > 0 && (
                          <div className="pt-2.5 border-t border-white/[0.07] space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              Sources ({msg.citations.length})
                            </div>
                            <div className="space-y-1">
                              {msg.citations.map((cite, cIdx) => {
                                const Icon       = SOURCE_TYPE_ICONS[cite.sourceType] ?? FileText;
                                const isExpanded = expandedCitation === cite.chunkId;
                                return (
                                  <div key={cIdx} className="rounded-lg border border-white/[0.07] bg-black/20 overflow-hidden">
                                    <button
                                      onClick={() => setExpandedCitation(isExpanded ? null : cite.chunkId)}
                                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="font-mono text-zinc-600 shrink-0">#{cIdx + 1}</span>
                                        <Icon className="w-3 h-3 text-indigo-400 shrink-0" />
                                        <span className="text-zinc-300 truncate font-medium">{cite.title}</span>
                                        {cite.locator && <span className="text-zinc-500 truncate text-[10px]">({cite.locator})</span>}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {cite.score !== undefined && <span className="text-[9px] font-mono text-zinc-600">{cite.score.toFixed(4)}</span>}
                                        {isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                                      </div>
                                    </button>
                                    {isExpanded && cite.snippet && (
                                      <div className="px-3 pb-2.5 pt-1.5 border-t border-white/[0.05] bg-black/10">
                                        <p className="text-[11px] text-zinc-400 italic leading-relaxed">&ldquo;{cite.snippet}&rdquo;</p>
                                        <p className="text-[10px] text-zinc-600 mt-1">{cite.sourceType} · Rev {cite.revision}{cite.locator ? " · " + cite.locator : ""}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#111218] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-zinc-400">Retrieving evidence & generating response…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <footer className="px-4 py-3 border-t border-white/[0.07] bg-[#0b0c0f]/80 backdrop-blur-sm shrink-0">
            <div className="max-w-4xl mx-auto space-y-2">
              {sendError && (
                <div className="flex items-center gap-2 bg-red-950/30 border border-red-500/25 rounded-lg px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span className="flex-1">{sendError}</span>
                  <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-200 transition-colors ml-auto">✕</button>
                </div>
              )}
              <div className="flex items-center justify-between px-0.5 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span>Filter:</span>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-[#111318] border border-white/[0.07] rounded-md px-2 py-0.5 text-zinc-300 text-[11px] focus:outline-none focus:border-indigo-500/40 transition-colors"
                  >
                    <option value="">All Knowledge</option>
                    <option value="DOCUMENT">Documents</option>
                    <option value="REQUIREMENT">Requirements</option>
                    <option value="DECISION">Decisions</option>
                    <option value="TASK">Tasks</option>
                    <option value="MEETING">Meetings</option>
                  </select>
                </div>
                <span className="hidden sm:block text-zinc-600">
                  <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[10px] font-mono">Enter</kbd> send &nbsp;·&nbsp;
                  <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[10px] font-mono">Shift+Enter</kbd> newline
                </span>
              </div>
              <div className="flex items-end gap-2 bg-[#111318] border border-white/[0.08] focus-within:border-indigo-500/40 rounded-xl p-2.5 transition-colors">
                <Textarea
                  ref={textareaRef}
                  value={inputContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={"Ask in " + currentModeConfig.label + " mode — " + currentModeConfig.desc.toLowerCase() + "…"}
                  rows={2}
                  disabled={isSending}
                  className="bg-transparent border-0 focus-visible:ring-0 p-0 text-[13px] text-zinc-100 placeholder:text-zinc-600 resize-none min-h-[44px] flex-1"
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!inputContent.trim() || isSending || !currentProject}
                  size="sm"
                  className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition-all shrink-0 flex items-center justify-center"
                  title="Send message"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </AppLayout>
  );
}
