import type { SolutionAnalysis, QueryRecord } from '../types';

export interface BackendDoubtResponse {
  success: boolean;
  data?: {
    solution: SolutionAnalysis;
    query: QueryRecord;
  };
  error?: string;
  message?: string;
}

export interface ServerStatusResponse {
  status: string;
  aiConfigured: boolean;
  activeModel: string;
  supportedUploadTypes: string[];
  maxImageSizeBytes: number;
  maxPdfSizeBytes: number;
  serverTime: string;
}

/**
 * Checks backend API health and server-side AI credentials readiness.
 */
export async function checkBackendStatus(): Promise<ServerStatusResponse | null> {
  try {
    const res = await fetch('/api/doubt/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Backend status check failed:', e);
    return null;
  }
}

/**
 * Encodes browser File object into base64 data URI.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface SubmitDoubtParams {
  questionText?: string;
  subject: string;
  topic?: string;
  classLevel: string;
  board: string;
  language: string;
  userId: string;
  file?: File | null;
}

/**
 * Submits question to secure server-side Ask a Doubt backend endpoint.
 * Performs real request without simulating live results.
 */
export async function submitDoubtToBackend(params: SubmitDoubtParams): Promise<{ solution: SolutionAnalysis; query: QueryRecord }> {
  let filePayload: { name: string; type: string; size: number; base64: string } | undefined;

  if (params.file) {
    const base64 = await fileToBase64(params.file);
    filePayload = {
      name: params.file.name,
      type: params.file.type || (params.file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      size: params.file.size,
      base64
    };
  }

  const response = await fetch('/api/doubt/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionText: params.questionText,
      subject: params.subject,
      topic: params.topic,
      classLevel: params.classLevel,
      board: params.board,
      language: params.language,
      userId: params.userId,
      file: filePayload
    })
  });

  const json: BackendDoubtResponse = await response.json().catch(() => ({
    success: false,
    error: 'NETWORK_ERROR',
    message: 'Failed to communicate with the ConceptTrace AI backend server.'
  }));

  if (!response.ok || !json.success || !json.data) {
    const err: any = new Error(json.message || `Backend error (status ${response.status})`);
    err.code = json.error || 'SERVER_ERROR';
    err.status = response.status;
    throw err;
  }

  return json.data;
}
