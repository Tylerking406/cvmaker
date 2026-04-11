import type {
  CvSummary, CvDetail, PersonalInfo, WorkExperience,
  Education, Skill, Project, Certification, Achievement,
} from './types'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg || String(res.status))
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// CVs
export const getCvs = (userId: string) =>
  req<CvSummary[]>(`/api/cvs?userId=${userId}`)

export const getCv = (id: string) =>
  req<CvDetail>(`/api/cvs/${id}`)

export const createCv = (userId: string, title: string, template = 'ats-classic') =>
  req<CvSummary>('/api/cvs', { method: 'POST', body: JSON.stringify({ userId, title, template }) })

export const updateCv = (id: string, title: string, template: string) =>
  req<CvSummary>(`/api/cvs/${id}`, { method: 'PUT', body: JSON.stringify({ title, template }) })

export const deleteCv = (id: string) =>
  req<void>(`/api/cvs/${id}`, { method: 'DELETE' })

// Personal Info
export const upsertPersonalInfo = (cvId: string, data: Omit<PersonalInfo, 'id' | 'cvId'>) =>
  req<PersonalInfo>(`/api/cvs/${cvId}/personal-info`, { method: 'PUT', body: JSON.stringify(data) })

// Work Experience
export const createWorkExperience = (cvId: string, data: Omit<WorkExperience, 'id' | 'cvId'>) =>
  req<WorkExperience>(`/api/cvs/${cvId}/work-experience`, { method: 'POST', body: JSON.stringify(data) })

export const updateWorkExperience = (cvId: string, id: string, data: Omit<WorkExperience, 'id' | 'cvId'>) =>
  req<WorkExperience>(`/api/cvs/${cvId}/work-experience/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteWorkExperience = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/work-experience/${id}`, { method: 'DELETE' })

// Education
export const createEducation = (cvId: string, data: Omit<Education, 'id' | 'cvId'>) =>
  req<Education>(`/api/cvs/${cvId}/education`, { method: 'POST', body: JSON.stringify(data) })

export const updateEducation = (cvId: string, id: string, data: Omit<Education, 'id' | 'cvId'>) =>
  req<Education>(`/api/cvs/${cvId}/education/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteEducation = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/education/${id}`, { method: 'DELETE' })

// Skills
export const createSkill = (cvId: string, data: Omit<Skill, 'id' | 'cvId'>) =>
  req<Skill>(`/api/cvs/${cvId}/skills`, { method: 'POST', body: JSON.stringify(data) })

export const updateSkill = (cvId: string, id: string, data: Omit<Skill, 'id' | 'cvId'>) =>
  req<Skill>(`/api/cvs/${cvId}/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteSkill = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/skills/${id}`, { method: 'DELETE' })

// Projects
export const createProject = (cvId: string, data: Omit<Project, 'id' | 'cvId'>) =>
  req<Project>(`/api/cvs/${cvId}/projects`, { method: 'POST', body: JSON.stringify(data) })

export const updateProject = (cvId: string, id: string, data: Omit<Project, 'id' | 'cvId'>) =>
  req<Project>(`/api/cvs/${cvId}/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteProject = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/projects/${id}`, { method: 'DELETE' })

// Certifications
export const createCertification = (cvId: string, data: Omit<Certification, 'id' | 'cvId'>) =>
  req<Certification>(`/api/cvs/${cvId}/certifications`, { method: 'POST', body: JSON.stringify(data) })

export const updateCertification = (cvId: string, id: string, data: Omit<Certification, 'id' | 'cvId'>) =>
  req<Certification>(`/api/cvs/${cvId}/certifications/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteCertification = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/certifications/${id}`, { method: 'DELETE' })

// Achievements
export const createAchievement = (cvId: string, data: Omit<Achievement, 'id' | 'cvId'>) =>
  req<Achievement>(`/api/cvs/${cvId}/achievements`, { method: 'POST', body: JSON.stringify(data) })

export const updateAchievement = (cvId: string, id: string, data: Omit<Achievement, 'id' | 'cvId'>) =>
  req<Achievement>(`/api/cvs/${cvId}/achievements/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteAchievement = (cvId: string, id: string) =>
  req<void>(`/api/cvs/${cvId}/achievements/${id}`, { method: 'DELETE' })
