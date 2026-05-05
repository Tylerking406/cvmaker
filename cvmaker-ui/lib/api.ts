const BASE = "/api";

// Global hook so the terminal can intercept fetches without prop-drilling
type Interceptor = (method: string, url: string, status: number | undefined, duration: number | undefined, error?: string) => void;
let interceptor: Interceptor | null = null;
export function setApiInterceptor(fn: Interceptor | null) { interceptor = fn; }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = `${BASE}${path}`;
  const start = performance.now();

  interceptor?.(method, url, undefined, undefined);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    const duration = Math.round(performance.now() - start);
    interceptor?.(method, url, res.status, duration);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    interceptor?.(method, url, undefined, duration, String(err));
    throw err;
  }
}

export const api = {
  users: {
    list: () => request<{ id: string; email: string }[]>("/users"),
    create: (email: string) =>
      request<{ id: string; email: string }>("/users", {
        method: "POST",
        body: JSON.stringify(email),
      }),
  },
  cvs: {
    list: (userId: string) => request<Cv[]>(`/cvs?userId=${userId}`),
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
    delete: (cvId: string, id: string) =>
      request<void>(`/cvs/${cvId}/achievements/${id}`, { method: "DELETE" }),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Cv {
  id: string;
  userId: string;
  title: string;
  template: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCvRequest {
  userId: string;
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
