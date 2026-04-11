export interface CvSummary {
  id: string
  userId: string
  title: string
  template: string
  createdAt: string
  updatedAt: string
}

export interface PersonalInfo {
  id: string
  cvId: string
  fullName: string
  jobTitle: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedIn: string | null
  gitHub: string | null
  website: string | null
  summary: string | null
}

export interface WorkExperience {
  id: string
  cvId: string
  company: string
  role: string
  location: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  bullets: string[]
  orderIndex: number
}

export interface Education {
  id: string
  cvId: string
  institution: string
  degree: string
  field: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  achievements: string[]
  orderIndex: number
}

export interface Skill {
  id: string
  cvId: string
  category: string
  items: string[]
  orderIndex: number
}

export interface Project {
  id: string
  cvId: string
  name: string
  description: string | null
  bullets: string[]
  url: string | null
  orderIndex: number
}

export interface Certification {
  id: string
  cvId: string
  name: string
  issuer: string | null
  issueDate: string | null
  expiryDate: string | null
  url: string | null
  orderIndex: number
}

export interface Achievement {
  id: string
  cvId: string
  description: string
  orderIndex: number
}

export interface CvDetail extends CvSummary {
  personalInfo: PersonalInfo | null
  workExperiences: WorkExperience[]
  educations: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  achievements: Achievement[]
}
