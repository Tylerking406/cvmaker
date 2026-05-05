const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  cvs: {
    list: () => request<Cv[]>("/cvs"),
    get: (id: string) => request<Cv>(`/cvs/${id}`),
    create: (data: CreateCvRequest) =>
      request<Cv>("/cvs", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/cvs/${id}`, { method: "DELETE" }),
  },
  personalInfo: {
    get: (cvId: string) => request<PersonalInfo>(`/personal-info/${cvId}`),
    upsert: (cvId: string, data: Partial<PersonalInfo>) =>
      request<PersonalInfo>(`/personal-info/${cvId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  workExperience: {
    list: (cvId: string) => request<WorkExperience[]>(`/work-experience/${cvId}`),
    create: (cvId: string, data: Partial<WorkExperience>) =>
      request<WorkExperience>(`/work-experience/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<WorkExperience>) =>
      request<WorkExperience>(`/work-experience/item/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/work-experience/item/${id}`, { method: "DELETE" }),
  },
  education: {
    list: (cvId: string) => request<Education[]>(`/education/${cvId}`),
    create: (cvId: string, data: Partial<Education>) =>
      request<Education>(`/education/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Education>) =>
      request<Education>(`/education/item/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/education/item/${id}`, { method: "DELETE" }),
  },
  skills: {
    list: (cvId: string) => request<Skill[]>(`/skills/${cvId}`),
    create: (cvId: string, data: Partial<Skill>) =>
      request<Skill>(`/skills/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Skill>) =>
      request<Skill>(`/skills/item/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/skills/item/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: (cvId: string) => request<Project[]>(`/projects/${cvId}`),
    create: (cvId: string, data: Partial<Project>) =>
      request<Project>(`/projects/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Project>) =>
      request<Project>(`/projects/item/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/projects/item/${id}`, { method: "DELETE" }),
  },
  certifications: {
    list: (cvId: string) => request<Certification[]>(`/certifications/${cvId}`),
    create: (cvId: string, data: Partial<Certification>) =>
      request<Certification>(`/certifications/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/certifications/item/${id}`, { method: "DELETE" }),
  },
  achievements: {
    list: (cvId: string) => request<Achievement[]>(`/achievements/${cvId}`),
    create: (cvId: string, data: Partial<Achievement>) =>
      request<Achievement>(`/achievements/${cvId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/achievements/item/${id}`, { method: "DELETE" }),
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Cv {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  personalInfo?: PersonalInfo;
}

export interface CreateCvRequest {
  userId: string;
  title: string;
}

export interface PersonalInfo {
  id: string;
  cvId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface WorkExperience {
  id: string;
  cvId: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  cvId: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  achievements: string[];
}

export interface Skill {
  id: string;
  cvId: string;
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  cvId: string;
  name: string;
  description?: string;
  url?: string;
  bullets: string[];
}

export interface Certification {
  id: string;
  cvId: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  credentialUrl?: string;
}

export interface Achievement {
  id: string;
  cvId: string;
  title: string;
  description?: string;
  date?: string;
}
