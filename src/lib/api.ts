export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

let csrfToken: string | null = null;
if (typeof window !== "undefined") {
  csrfToken = localStorage.getItem("aiw_csrf_token");
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("aiw_csrf_token", token);
    } else {
      localStorage.removeItem("aiw_csrf_token");
    }
  }
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export interface ApiEnvelope<T = any, M = any> {
  data: T;
  meta?: M;
}

export async function apiRequestRaw(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (csrfToken && ["POST", "PATCH", "PUT", "DELETE"].includes(options.method?.toUpperCase() || "")) {
    headers["x-csrf-token"] = csrfToken;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const newCsrf = res.headers.get("x-csrf-token");
  if (newCsrf) {
    setCsrfToken(newCsrf);
  }

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = errJson.message;
      } else if (errJson.error?.message) {
        errorMsg = errJson.error.message;
      }
      if (errJson.details && Array.isArray(errJson.details) && errJson.details.length > 0) {
        errorMsg += `: ${errJson.details.map((d: any) => d.message).join(", ")}`;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiRequestRaw(endpoint, options);
  if (res.status === 204) {
    return {} as T;
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export async function apiEnvelopeRequest<T = any, M = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T, M>> {
  const res = await apiRequestRaw(endpoint, options);
  if (res.status === 204) {
    return { data: {} as T };
  }
  const json = await res.json();
  return {
    data: json.data !== undefined ? json.data : json,
    meta: json.meta,
  };
}

export const api = {
  auth: {
    csrf: async () => {
      const res = await apiRequest<{ csrfToken: string | null }>("/auth/csrf");
      if (res?.csrfToken) {
        setCsrfToken(res.csrfToken);
      }
      return res;
    },
    login: async (email: string, password: string) => {
      const envelope = await apiEnvelopeRequest<{ user: any; csrfToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = envelope.data;
      if (data?.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      return data;
    },
    logout: async () => {
      try {
        await apiRequestRaw("/auth/logout", { method: "POST" });
      } catch {
        // ignore
      }
      setCsrfToken(null);
    },
    me: async () => {
      return apiRequest<any>("/auth/me");
    },
  },

  projects: {
    list: async () => apiRequest<any[]>("/projects"),
    get: async (id: string) => apiRequest<any>(`/projects/${id}`),
    create: async (data: { name: string; key: string; description?: string }) =>
      apiRequest<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
    getMembers: async (id: string) => apiRequest<any[]>(`/projects/${id}/members`),
  },

  dashboard: {
    get: async (projectId: string, timezone = "Asia/Bangkok") =>
      apiRequest<any>(`/projects/${projectId}/dashboard?timezone=${encodeURIComponent(timezone)}`),
    getActivity: async (projectId: string, page = 1, pageSize = 20) =>
      apiEnvelopeRequest<any[]>(`/projects/${projectId}/activity?page=${page}&pageSize=${pageSize}`),
  },

  search: {
    query: async (projectId: string, q: string, type?: string, page = 1, pageSize = 20) => {
      let queryUrl = `/projects/${projectId}/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`;
      if (type && type.trim()) {
        queryUrl += `&type=${encodeURIComponent(type.trim().toUpperCase())}`;
      }
      return apiEnvelopeRequest<any[]>(queryUrl);
    },
  },

  requirements: {
    list: async (projectId: string, status?: string) => {
      let url = `/projects/${projectId}/requirements`;
      if (status) url += `?status=${encodeURIComponent(status)}`;
      return apiRequest<any[]>(url);
    },
    create: async (
      projectId: string,
      data: {
        title: string;
        description?: string;
        acceptanceCriteria?: string;
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      }
    ) => apiRequest<any>(`/projects/${projectId}/requirements`, { method: "POST", body: JSON.stringify(data) }),
    update: async (
      projectId: string,
      requirementId: string,
      data: {
        version: number;
        title?: string;
        description?: string;
        acceptanceCriteria?: string;
        status?: string;
        priority?: string;
      }
    ) =>
      apiRequest<any>(`/projects/${projectId}/requirements/${requirementId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  decisions: {
    list: async (projectId: string, status?: string) => {
      let url = `/projects/${projectId}/decisions`;
      if (status) url += `?status=${encodeURIComponent(status)}`;
      return apiRequest<any[]>(url);
    },
    create: async (
      projectId: string,
      data: {
        title: string;
        decisionText: string;
        rationale?: string;
        requirementId?: string;
        supersedesDecisionId?: string;
      }
    ) => apiRequest<any>(`/projects/${projectId}/decisions`, { method: "POST", body: JSON.stringify(data) }),
    update: async (
      projectId: string,
      decisionId: string,
      data: {
        version: number;
        title?: string;
        decisionText?: string;
        rationale?: string;
        status?: string;
      }
    ) =>
      apiRequest<any>(`/projects/${projectId}/decisions/${decisionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  tasks: {
    list: async (projectId: string, status?: string) => {
      let url = `/projects/${projectId}/tasks`;
      if (status) url += `?status=${encodeURIComponent(status)}`;
      return apiRequest<any[]>(url);
    },
    create: async (
      projectId: string,
      data: {
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        assigneeId?: string;
        dueDate?: string; // YYYY-MM-DD
        requirementId?: string;
        sourceMeetingId?: string;
      }
    ) => apiRequest<any>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
    update: async (
      projectId: string,
      taskId: string,
      data: {
        version: number;
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        assigneeId?: string | null;
        dueDate?: string | null;
      }
    ) =>
      apiRequest<any>(`/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  meetings: {
    list: async (projectId: string) => apiRequest<any[]>(`/projects/${projectId}/meetings`),
    create: async (
      projectId: string,
      data: {
        title: string;
        startsAt: string; // ISO 8601
        endsAt: string; // ISO 8601
        agenda?: string;
        notes?: string;
        transcriptText?: string;
        attendeeUserIds?: string[];
      }
    ) => apiRequest<any>(`/projects/${projectId}/meetings`, { method: "POST", body: JSON.stringify(data) }),
  },

  documents: {
    list: async (projectId: string) => apiRequest<any[]>(`/projects/${projectId}/documents`),
    upload: async (projectId: string, formData: FormData) =>
      apiRequest<any>(`/projects/${projectId}/documents`, { method: "POST", body: formData }),
    getDownloadUrl: (projectId: string, docId: string) =>
      `${API_URL}/projects/${projectId}/documents/${docId}/download`,
    downloadFile: async (projectId: string, docId: string, filename: string) => {
      const res = await apiRequestRaw(`/projects/${projectId}/documents/${docId}/download`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    delete: async (projectId: string, docId: string) =>
      apiRequestRaw(`/projects/${projectId}/documents/${docId}`, { method: "DELETE" }),
  },

  ingestion: {
    listSources: async (
      projectId: string,
      params?: { sourceType?: string; status?: string; search?: string }
    ) => {
      const q = new URLSearchParams();
      if (params?.sourceType) q.append("sourceType", params.sourceType);
      if (params?.status) q.append("status", params.status);
      if (params?.search) q.append("search", params.search);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return apiRequest<any[]>(`/projects/${projectId}/ingestion/sources${qs}`);
    },
    getSource: async (projectId: string, sourceId: string) =>
      apiRequest<any>(`/projects/${projectId}/ingestion/sources/${sourceId}`),
    reindexSource: async (projectId: string, sourceId: string) =>
      apiRequest<any>(`/projects/${projectId}/ingestion/sources/${sourceId}/reindex`, {
        method: "POST",
      }),
    listJobs: async (projectId: string) =>
      apiRequest<any[]>(`/projects/${projectId}/ingestion/jobs`),
  },
};
