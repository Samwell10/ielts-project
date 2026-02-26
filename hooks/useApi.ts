"use client";

import { useAuth } from "@clerk/nextjs";
import * as api from "@/lib/api";

/**
 * Wraps all backend API calls with automatic Clerk token injection.
 * Use this hook in any client component instead of importing from lib/api directly.
 */
export function useApi() {
  const { getToken } = useAuth();

  async function tok(): Promise<string> {
    const t = await getToken();
    if (!t) throw new Error("Not authenticated. Please sign in.");
    return t;
  }

  return {
    // No auth required
    generateQuestions: api.generateQuestions,

    // Auth required — token injected automatically
    createSession: (params: Parameters<typeof api.createSession>[0]) =>
      tok().then((t) => api.createSession(params, t)),

    addResponse: (sessionId: string, params: Parameters<typeof api.addResponse>[1]) =>
      tok().then((t) => api.addResponse(sessionId, params, t)),

    completeSession: (sessionId: string, duration: number) =>
      tok().then((t) => api.completeSession(sessionId, duration, t)),

    listSessions: () =>
      tok().then((t) => api.listSessions(t)),

    getSession: (sessionId: string) =>
      tok().then((t) => api.getSession(sessionId, t)),

    uploadAndTranscribe: (blob: Blob) =>
      tok().then((t) => api.uploadAndTranscribe(blob, t)),

    evaluateResponse: (params: Parameters<typeof api.evaluateResponse>[0]) =>
      tok().then((t) => api.evaluateResponse(params, t)),
  };
}
