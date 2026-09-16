"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  Search,
  CheckCircle2,
  Copy,
  FileType,
  FileCode,
  HardDrive,
  Loader2,
  Sparkles
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const { currentProject } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const data = await api.documents.list(currentProject.id);
      setDocs(data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, "info");
  };

  const uploadFile = async (file: File) => {
    if (!file || !currentProject) return;
    setUploading(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

    try {
      const uploaded = await api.documents.upload(currentProject.id, formData);
      showToast(`Uploaded "${uploaded.title || file.name}" successfully!`, "success");
      await loadData();
    } catch (err: any) {
      const msg = err.message || "File upload failed";
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDownload = async (doc: any) => {
    if (!currentProject) return;
    setDownloadingId(doc.id);
    try {
      const filename = doc.originalFilename || `${doc.title}.pdf`;
      await api.documents.downloadFile(currentProject.id, doc.id, filename);
      showToast(`Downloaded ${filename} successfully!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to download document", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadge = (filename: string, mime: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || mime?.includes("pdf")) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30 font-mono text-[10px]">PDF</Badge>;
    }
    if (ext === "docx" || ext === "doc" || mime?.includes("word")) {
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-[10px]">DOCX</Badge>;
    }
    if (ext === "md" || ext === "markdown") {
      return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-mono text-[10px]">MARKDOWN</Badge>;
    }
    return <Badge variant="secondary" className="font-mono text-[10px]">TEXT</Badge>;
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (searchQuery.trim() === "") return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.originalFilename && d.originalFilename.toLowerCase().includes(q))
      );
    });
  }, [docs, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600/15 text-amber-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Documents & Specifications
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Secure project file storage for PDF, DOCX, TXT, and Markdown (max 20 MiB) with SHA-256 checksums and streaming downloads.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md self-start sm:self-auto"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? "Uploading..." : "Upload Document"}</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Visual Drag & Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-amber-500 bg-amber-500/10 scale-[0.99]"
              : "border-white/[0.08] hover:border-amber-500/40 bg-[#101116] hover:bg-amber-600/5"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600/15 text-amber-400 flex items-center justify-center">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-200">
              {uploading ? "Uploading file to project..." : "Click or drag & drop files here to upload"}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500">Supported formats:</span>
              <Badge variant="outline" className="text-[9px] font-mono border-white/10">.PDF</Badge>
              <Badge variant="outline" className="text-[9px] font-mono border-white/10">.DOCX</Badge>
              <Badge variant="outline" className="text-[9px] font-mono border-white/10">.MD</Badge>
              <Badge variant="outline" className="text-[9px] font-mono border-white/10">.TXT</Badge>
              <span className="text-[10px] text-zinc-500">• Max 20 MiB</span>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="pl-8 h-8 text-xs bg-[#161820] border-white/10 text-zinc-200"
          />
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-white/10 bg-[#0d0e12] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {docs.length === 0 ? "No Documents Uploaded Yet" : "No Matching Documents Found"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {docs.length === 0
                ? "Upload product specifications, design docs, or notes to keep project knowledge in one central place."
                : "Try clearing your search query to see all documents."}
            </p>
            {docs.length === 0 ? (
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs bg-amber-600 hover:bg-amber-500">
                <Upload className="w-3.5 h-3.5 mr-1" /> Choose File to Upload
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => {
              const isDownloading = downloadingId === doc.id;
              return (
                <Card
                  key={doc.id}
                  className="bg-[#121318] border-white/[0.08] hover:border-white/20 transition-all shadow-md"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white truncate max-w-md">
                            {doc.title || doc.originalFilename}
                          </span>
                          {getFileBadge(doc.originalFilename || "", doc.mimeType || "")}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono flex-wrap">
                          <span>{doc.originalFilename}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.sizeBytes)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.sha256 && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => copyToClipboard(doc.sha256, "SHA-256 checksum")}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-0.5"
                                title="Copy SHA-256 Checksum"
                              >
                                <span>SHA: {doc.sha256.substring(0, 8)}...</span>
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      className="h-8 text-xs border-white/10 hover:border-amber-500/40 hover:text-amber-300 gap-1.5 self-start sm:self-auto shrink-0"
                    >
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{isDownloading ? "Downloading..." : "Download"}</span>
                    </Button>
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
