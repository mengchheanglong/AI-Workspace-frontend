"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Bot,
  User,
  Send,
  Plus,
  Trash2,
  FileText,
  FileCheck2,
  GitPullRequest,
  CheckSquare,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
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
  { key: "PM", label: "PM", desc: "Status, risks, blockers & milestones" },
  { key: "DEVELOPER", label: "Developer", desc: "Architecture, APIs & code guidance" },
  { key: "QA", label: "QA", desc: "Acceptance criteria & test cases" },
  { key: "DX", label: "DX", desc: "Onboarding, dev docs & workflows" },
  { key: "INFRASTRUCTURE", label: "Infra", desc: "Containers, pgvector & runtime ops" },
  { key: "PRESENTATION", label: "Presentation", desc: "Executive summaries & slide outlines" },
];

const SOURCE_TYPE_ICONS: Record<string, React.ElementType> = {
  DOCUMENT: FileText,
  REQUIREMENT: FileCheck2,
  DECISION: GitPullRequest,
  TASK: CheckSquare,
  MEETING: Calendar,
};

const PROMPT_SUGGESTIONS = [
  { mode: "PM", text: "What are the core requirements and project status?" },
  { mode: "DEVELOPER", text: "Explain the database architecture and pgvector indexing rules." },
  { mode: "QA", text: "Generate QA acceptance test cases for user authentication." },
  { mode: "DX", text: "What is the recommended local development workflow?" },
  { mode: "INFRASTRUCTURE", text: "How is pgvector and PostgreSQL configured for local development?" },
];

export default function AssistantPage() {
  const { currentProject } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>("PM");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [inputContent, setInputContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load conversations when project changes
  useEffect(() => {
    if (!currentProject) return;
    loadConversations();
  }, [currentProject?.id]);

  const loadConversations = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const res = await api.ai.listConversations(currentProject.id);
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setConversations(list);
      if (list.length > 0) {
        // Select first conversation or retain existing
        setActiveConv((prev) => {
          if (prev && list.some((c: Conversation) => c.id === prev.id)) {
            return prev;
          }
          return list[0];
        });
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

  // Load messages when active conversation changes
  useEffect(() => {
    if (!currentProject || !activeConv) {
      setMessages([]);
      return;
    }
    loadMessages(activeConv.id);
    setSelectedMode(activeConv.defaultMode || "PM");
  }, [activeConv?.id]);

  const loadMessages = async (convId: string) => {
    if (!currentProject) return;
    try {
      const res = await api.ai.listMessages(currentProject.id, convId);
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setMessages(list);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleCreateConversation = async () => {
    if (!currentProject) return;
    try {
      const res = await api.ai.createConversation(currentProject.id, {
        title: "New Conversation",
        defaultMode: selectedMode,
      });
      const newConv = (res as any)?.data || res;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConv(newConv);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.ai.deleteConversation(currentProject.id, convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConv?.id === convId) {
        setActiveConv(updated[0] || null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputContent).trim();
    if (!text || isSending || !currentProject) return;

    let conv = activeConv;
    if (!conv) {
      try {
        const res = await api.ai.createConversation(currentProject.id, {
          title: text.length > 45 ? `${text.slice(0, 42)}...` : text,
          defaultMode: selectedMode,
        });
        conv = (res as any)?.data || res;
        setActiveConv(conv);
        setConversations((prev) => [conv!, ...prev]);
      } catch (err) {
        console.error("Failed to auto-create conversation:", err);
        return;
      }
    }

    if (!conv) return;

    // Optimistic user message display
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conv.id,
      role: "user",
      mode: selectedMode,
      content: text,
      status: "COMPLETED",
      citations: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputContent("");
    setIsSending(true);

    try {
      const res = await api.ai.postMessage(currentProject.id, conv.id, {
        content: text,
        mode: selectedMode,
        sourceType: sourceFilter || undefined,
      });

      const { userMessage, assistantMessage } = (res as any)?.data || res;

      // Update messages with real server responses
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        userMessage,
        assistantMessage,
      ]);

      // Update conversation title in list if updated
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv!.id
            ? { ...c, title: c.title === "New Conversation" ? text.slice(0, 45) : c.title }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Append error message
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversationId: conv!.id,
          role: "assistant",
          mode: selectedMode,
          content: "Failed to receive AI response. Please check your network or try again.",
          status: "FAILED",
          citations: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#08090a]">
        {/* Left Sidebar: Conversations Drawer */}
        <aside className="w-64 border-r border-white/[0.08] bg-[#0c0d10] flex flex-col shrink-0">
          <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Conversations</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateConversation}
              className="h-7 px-2 text-xs bg-indigo-600/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 hover:text-white"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading chats...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                      isActive
                        ? "bg-indigo-600/15 border border-indigo-500/30 text-white font-medium"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="truncate">{c.title || "New Conversation"}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-indigo-400">{c.defaultMode}</span>
                        <span>•</span>
                        <span>{formatDate(c.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-zinc-500 rounded transition-opacity"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Privacy & Guardrail Footnote */}
          <div className="p-3 border-t border-white/[0.08] bg-[#090a0d] text-[11px] text-zinc-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Project-scoped & grounded citations only</span>
          </div>
        </aside>

        {/* Main AI Chat Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#08090a]">
          {/* Top Bar: Mode Selector & Grounding Status */}
          <header className="px-5 py-3 border-b border-white/[0.08] bg-[#0c0d10]/90 backdrop-blur flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Mode:</span>
              <div className="flex items-center gap-1 bg-[#121318] p-1 rounded-lg border border-white/[0.08]">
                {MODES.map((m) => {
                  const isSelected = selectedMode === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMode(m.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                      }`}
                      title={m.desc}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-[10px] py-0.5 px-2 bg-indigo-950/40 border-indigo-500/30 text-indigo-300 font-mono flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>DeepSeek V4 Pro • RRF Hybrid</span>
              </Badge>
            </div>
          </header>

          {/* Message Thread Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-12 text-center space-y-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    AI Workspace Copilot
                  </h2>
                  <p className="text-xs text-zinc-400 mt-2 max-w-lg mx-auto">
                    Ask questions grounded in your project documents, requirements, tasks, decisions,
                    and meeting transcripts. Every response cites exact sources.
                  </p>
                </div>

                <div className="text-left bg-[#0e0f14] border border-white/[0.08] rounded-xl p-4 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
                    Suggested prompts for project {currentProject?.name}:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {PROMPT_SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMode(item.mode);
                          handleSendMessage(item.text);
                        }}
                        className="text-left text-xs p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/30 text-zinc-300 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <span>{item.text}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono text-zinc-500 border-white/10 group-hover:border-indigo-500/30 group-hover:text-indigo-400"
                        >
                          {item.mode}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAssistant = msg.role === "assistant";
                const isFailed = msg.status === "FAILED";
                const isInsufficient =
                  msg.content.toLowerCase().includes("insufficient evidence") ||
                  msg.content.toLowerCase().includes("no relevant project evidence");

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 max-w-3xl ${
                      isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                        isAssistant
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-[#181920] border border-white/10 text-zinc-300"
                      }`}
                    >
                      {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="space-y-2 max-w-[85%]">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-300">
                          {isAssistant ? "AI Workspace Copilot" : "You"}
                        </span>
                        {isAssistant && (
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1.5 font-mono text-indigo-400 border-indigo-500/20 bg-indigo-950/20"
                          >
                            {msg.mode}
                          </Badge>
                        )}
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                          isAssistant
                            ? isFailed
                              ? "bg-red-950/20 border border-red-500/30 text-red-200"
                              : "bg-[#111218] border border-white/[0.08] text-zinc-200"
                            : "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        }`}
                      >
                        {/* Insufficient Evidence Warning Banner */}
                        {isAssistant && isInsufficient && (
                          <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-lg text-amber-300 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium">Knowledge Boundary Enforced</div>
                              <div className="text-[11px] text-amber-400/80 mt-0.5">
                                No verified evidence exists in the indexed project records for this
                                query. The assistant honestly declined rather than hallucinating facts.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Citations Section */}
                        {isAssistant && msg.citations && msg.citations.length > 0 && (
                          <div className="pt-3 border-t border-white/[0.08] space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Grounded Citations ({msg.citations.length})</span>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.citations.map((cite, cIdx) => {
                                const Icon = SOURCE_TYPE_ICONS[cite.sourceType] || FileText;
                                const isExpanded = expandedCitation === cite.chunkId;

                                return (
                                  <div
                                    key={cIdx}
                                    className="border border-white/[0.08] bg-[#16171f] rounded-lg p-2.5 text-[11px] transition-all hover:border-white/20"
                                  >
                                    <div
                                      onClick={() =>
                                        setExpandedCitation(isExpanded ? null : cite.chunkId)
                                      }
                                      className="flex items-center justify-between cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-mono px-1.5 py-0 border-white/10 text-zinc-300"
                                        >
                                          #{cIdx + 1}
                                        </Badge>
                                        <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span className="font-medium text-zinc-200 truncate">
                                          {cite.title}
                                        </span>
                                        {cite.locator && (
                                          <span className="text-zinc-500 text-[10px] truncate">
                                            ({cite.locator})
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {cite.score !== undefined && (
                                          <span className="text-[9px] font-mono text-zinc-500">
                                            score: {cite.score}
                                          </span>
                                        )}
                                        {isExpanded ? (
                                          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Expanded Snippet Card */}
                                    {isExpanded && (
                                      <div className="mt-2 pt-2 border-t border-white/[0.06] text-zinc-400 text-[11px] space-y-1.5 bg-black/20 p-2 rounded">
                                        <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                                          <span>Type: {cite.sourceType} • Rev {cite.revision}</span>
                                          {cite.locator && <span>Locator: {cite.locator}</span>}
                                        </div>
                                        {cite.snippet && (
                                          <p className="italic text-zinc-300 leading-relaxed">
                                            &ldquo;{cite.snippet}&rdquo;
                                          </p>
                                        )}
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
              <div className="flex gap-3.5 max-w-3xl mr-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#111218] border border-white/[0.08] rounded-2xl p-4 text-xs text-zinc-400 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Retrieving project evidence and generating grounded response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Composer */}
          <footer className="p-4 border-t border-white/[0.08] bg-[#0c0d10] shrink-0">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Optional source filter bar */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <div className="flex items-center gap-2">
                  <span>Search Filter:</span>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-[#14151c] border border-white/10 rounded px-2 py-0.5 text-zinc-300 text-[11px] focus:outline-none"
                  >
                    <option value="">All Project Knowledge</option>
                    <option value="DOCUMENT">Documents Only</option>
                    <option value="REQUIREMENT">Requirements Only</option>
                    <option value="DECISION">Decisions Only</option>
                    <option value="TASK">Tasks Only</option>
                    <option value="MEETING">Meetings Only</option>
                  </select>
                </div>
                <div className="hidden sm:inline text-zinc-500">
                  Press <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-white/10 rounded font-mono text-[10px]">Shift+Enter</kbd> for newline
                </div>
              </div>

              {/* Textarea and Send button */}
              <div className="flex items-end gap-2 bg-[#121318] border border-white/10 focus-within:border-indigo-500/50 rounded-xl p-2 transition-all">
                <Textarea
                  value={inputContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask a question in ${selectedMode} mode...`}
                  rows={2}
                  disabled={isSending}
                  className="bg-transparent border-0 focus:ring-0 p-1 text-xs text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[48px]"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputContent.trim() || isSending}
                  size="sm"
                  className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </AppLayout>
  );
}
