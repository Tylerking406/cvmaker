import type {
  Cv, PersonalInfo, WorkExperience, Education, Skill, Project, Certification, Achievement,
} from "@/lib/api";

export interface CvTemplateData {
  cv: Cv;
  info: PersonalInfo | null;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
}

// Example content used to preview what each template looks like, independent of
// whatever (possibly empty) data the user has entered on their own CV.
const cvId = "sample";
export const SAMPLE_CV_DATA: CvTemplateData = {
  cv: { id: cvId, userId: "sample", title: "Sample CV", template: "ats-classic", createdAt: "", updatedAt: "" },
  info: {
    id: "sample-info", cvId,
    fullName: "Jordan Lee",
    jobTitle: "Operations Manager",
    email: "jordan.lee@example.com",
    phone: "+1 555 010 2020",
    location: "Austin, TX",
    linkedIn: "linkedin.com/in/jordanlee",
    website: "",
    gitHub: "",
    summary: "Operations manager with 8+ years leading teams across retail and logistics. Known for streamlining processes, mentoring staff, and keeping projects on schedule and under budget.",
  },
  experience: [
    {
      id: "sample-exp-1", cvId,
      company: "Northgate Logistics", role: "Operations Manager", location: "Austin, TX",
      startDate: "2021-03-01", isCurrent: true,
      bullets: [
        "Manage a team of 22 across two warehouses, improving on-time delivery from 91% to 98%.",
        "Redesigned shift scheduling, cutting overtime costs by 15% within the first quarter.",
        "Led onboarding and training for all new hires, reducing ramp-up time by two weeks.",
      ],
      orderIndex: 0,
    },
    {
      id: "sample-exp-2", cvId,
      company: "Riverside Retail Group", role: "Assistant Store Manager", location: "Austin, TX",
      startDate: "2017-06-01", endDate: "2021-02-01", isCurrent: false,
      bullets: [
        "Supervised daily operations for a 40-person retail location with $4M in annual revenue.",
        "Resolved escalated customer issues, maintaining a 4.8/5 satisfaction rating.",
      ],
      orderIndex: 1,
    },
  ],
  education: [
    {
      id: "sample-edu-1", cvId,
      institution: "University of Texas at Austin",
      degree: "BA", field: "Business Administration",
      startDate: "2013-08-01", endDate: "2017-05-01", isCurrent: false,
      achievements: ["Graduated with honors", "Treasurer, Student Business Association"],
      orderIndex: 0,
    },
  ],
  skills: [
    { id: "sample-sk-1", cvId, category: "Leadership & Management", items: ["Team Leadership", "Scheduling", "Budgeting", "Conflict Resolution"], orderIndex: 0 },
    { id: "sample-sk-2", cvId, category: "Software & Tools", items: ["Microsoft Excel", "Slack", "Workday"], orderIndex: 1 },
    { id: "sample-sk-3", cvId, category: "Languages", items: ["English (native)", "Spanish (conversational)"], orderIndex: 2 },
  ],
  projects: [
    {
      id: "sample-proj-1", cvId,
      name: "Warehouse Safety Initiative",
      description: "Led a cross-team effort to redesign floor layout and safety signage.",
      bullets: ["Reduced workplace incidents by 30% in six months.", "Presented results to regional leadership."],
      url: "",
      orderIndex: 0,
    },
  ],
  certifications: [
    { id: "sample-cert-1", cvId, name: "First Aid & CPR Certified", issuer: "American Red Cross", issueDate: "2023-04-01", expiryDate: "2026-04-01", url: "", orderIndex: 0 },
    { id: "sample-cert-2", cvId, name: "Six Sigma Green Belt", issuer: "ASQ", issueDate: "2022-09-01", expiryDate: "", url: "", orderIndex: 1 },
  ],
  achievements: [
    { id: "sample-ach-1", cvId, description: "Employee of the Year, Northgate Logistics (2023)", orderIndex: 0 },
    { id: "sample-ach-2", cvId, description: "Reduced regional shipping costs by 12% through vendor renegotiation.", orderIndex: 1 },
  ],
};
