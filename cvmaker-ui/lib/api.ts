const BASE = "/api";

// Global hook so the terminal can intercept fetches without prop-drilling
type Interceptor = (method: string, url: string, status: number | undefined, duration: number | undefined, error?: string) => void;
let interceptor: Interceptor | null = null;
export function setApiInterceptor(fn: Interceptor | null) { interceptor = fn; }

// The API also sets an httpOnly cookie, so requests still authenticate after a refresh
// before the context has rehydrated. This copy is what populates the Authorization
// header, which is the transport the backend treats as primary.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }

/** Notified when the session dies, so auth state can be cleared app-wide. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) { onUnauthorized = fn; }

/**
 * Notified when a write fails. Reported here rather than at each call site: the editor
 * alone has 19 mutations, most wrapped in try/finally with no catch, so a failed save was
 * indistinguishable from a successful one. One choke point also covers future call sites.
 */
let onMutationError: ((message: string, status: number) => void) | null = null;
export function setMutationErrorHandler(fn: ((message: string, status: number) => void) | null) {
  onMutationError = fn;
}

/** Thrown with the HTTP status attached so callers can distinguish 409 from 401. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = `${BASE}${path}`;
  const start = performance.now();

  interceptor?.(method, url, undefined, undefined);

  try {
    const res = await fetch(url, {
      ...options,
      // After ...options so a caller passing headers augments rather than replaces these.
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options?.headers,
      },
      credentials: "same-origin",
    });
    const duration = Math.round(performance.now() - start);
    interceptor?.(method, url, res.status, duration);

    if (!res.ok) {
      // A 401 outside /auth/* means the session died. Clear the local copy, but do NOT
      // navigate from here: a hard redirect mid-edit destroys everything the user typed.
      // Callers decide — loads redirect, mutations show a toast and stay put.
      if (res.status === 401 && !path.startsWith("/auth/")) {
        setAccessToken(null);
        onUnauthorized?.();
      }
      let message = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch { /* non-JSON error body */ }

      // Surface failed writes. /auth/* is excluded because those render their errors
      // inline on the login form — a toast as well would double-report.
      if (method !== "GET" && !path.startsWith("/auth/")) {
        onMutationError?.(
          res.status === 401
            ? "Your session expired. Sign in again to save your changes."
            : res.status === 404
              ? "That item no longer exists. It may have been deleted."
              : message,
          res.status,
        );
      }

      throw new ApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    interceptor?.(method, url, undefined, duration, String(err));
    throw err;
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<AuthResponse>("/auth/me"),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },
  cvs: {
    list: () => request<Cv[]>("/cvs"),
    get: (id: string) => request<Cv>(`/cvs/${id}`),
    create: (data: CreateCvRequest) =>
      request<Cv>("/cvs", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { title: string; template: string }) =>
      request<Cv>(`/cvs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/cvs/${id}`, { method: "DELETE" }),
  },
  personalInfo: {
    get: (cvId: string) => request<PersonalInfo>(`/cvs/${cvId}/personal-info`),
    upsert: (cvId: string, data: Partial<PersonalInfo>) =>
      request<PersonalInfo>(`/cvs/${cvId}/personal-info`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  workExperience: {
    list: (cvId: string) => request<WorkExperience[]>(`/cvs/${cvId}/work-experience`),
    create: (cvId: string, data: Partial<WorkExperience>) =>
      request<WorkExperience>(`/cvs/${cvId}/work-experience`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<WorkExperience>) =>
      request<WorkExperience>(`/cvs/${cvId}/work-experience/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/work-experience/${id}`, { method: "DELETE" }),
  },
  education: {
    list: (cvId: string) => request<Education[]>(`/cvs/${cvId}/education`),
    create: (cvId: string, data: Partial<Education>) =>
      request<Education>(`/cvs/${cvId}/education`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<Education>) =>
      request<Education>(`/cvs/${cvId}/education/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/education/${id}`, { method: "DELETE" }),
  },
  skills: {
    list: (cvId: string) => request<Skill[]>(`/cvs/${cvId}/skills`),
    create: (cvId: string, data: Partial<Skill>) =>
      request<Skill>(`/cvs/${cvId}/skills`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<Skill>) =>
      request<Skill>(`/cvs/${cvId}/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/skills/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: (cvId: string) => request<Project[]>(`/cvs/${cvId}/projects`),
    create: (cvId: string, data: Partial<Project>) =>
      request<Project>(`/cvs/${cvId}/projects`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<Project>) =>
      request<Project>(`/cvs/${cvId}/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/projects/${id}`, { method: "DELETE" }),
  },
  certifications: {
    list: (cvId: string) => request<Certification[]>(`/cvs/${cvId}/certifications`),
    create: (cvId: string, data: Partial<Certification>) =>
      request<Certification>(`/cvs/${cvId}/certifications`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<Certification>) =>
      request<Certification>(`/cvs/${cvId}/certifications/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/certifications/${id}`, { method: "DELETE" }),
  },
  achievements: {
    list: (cvId: string) => request<Achievement[]>(`/cvs/${cvId}/achievements`),
    create: (cvId: string, data: Partial<Achievement>) =>
      request<Achievement>(`/cvs/${cvId}/achievements`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (cvId: string, id: string, data: Partial<Achievement>) =>
      request<Achievement>(`/cvs/${cvId}/achievements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/achievements/${id}`, { method: "DELETE" }),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Cv {
  id: string;
  userId: string;
  title: string;
  template: string;
  createdAt: string;
  updatedAt: string;
}

// No userId: the server takes the owner from the caller's token.
export interface CreateCvRequest {
  title: string;
  template?: string;
}

export interface PersonalInfo {
  id: string;
  cvId: string;
  fullName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  linkedIn?: string;
  gitHub?: string;
  website?: string;
}

export interface WorkExperience {
  id: string;
  cvId: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  bullets: string[];
  orderIndex: number;
}

export interface Education {
  id: string;
  cvId: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  achievements: string[];
  orderIndex: number;
}

export interface Skill {
  id: string;
  cvId: string;
  category: string;
  items: string[];
  orderIndex: number;
}

export interface Project {
  id: string;
  cvId: string;
  name: string;
  description?: string;
  url?: string;
  bullets: string[];
  orderIndex: number;
}

export interface Certification {
  id: string;
  cvId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  url?: string;
  orderIndex: number;
}

export interface Achievement {
  id: string;
  cvId: string;
  description: string;
  orderIndex: number;
}
