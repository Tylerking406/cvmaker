// In-memory store persisted across Next.js hot reloads via globalThis.
// All mock API route handlers read/write through this module.

export interface User { id: string; email: string; name?: string; passwordHash?: string; }
export interface Cv { id: string; userId: string; title: string; template: string; createdAt: string; updatedAt: string; }
export interface PersonalInfo { id: string; cvId: string; fullName: string; jobTitle?: string; email?: string; phone?: string; location?: string; summary?: string; linkedIn?: string; gitHub?: string; website?: string; }
export interface WorkExperience { id: string; cvId: string; company: string; role: string; location?: string; startDate: string; endDate?: string; isCurrent: boolean; bullets: string[]; orderIndex: number; }
export interface Education { id: string; cvId: string; institution: string; degree: string; field: string; startDate: string; endDate?: string; isCurrent: boolean; achievements: string[]; orderIndex: number; }
export interface Skill { id: string; cvId: string; category: string; items: string[]; orderIndex: number; }
export interface Project { id: string; cvId: string; name: string; description?: string; url?: string; bullets: string[]; orderIndex: number; }
export interface Certification { id: string; cvId: string; name: string; issuer: string; issueDate: string; expiryDate?: string; url?: string; orderIndex: number; }
export interface Achievement { id: string; cvId: string; description: string; orderIndex: number; }

export interface MockStore {
  users: User[];
  cvs: Cv[];
  personalInfo: PersonalInfo[];
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
}

export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

function seed(): MockStore {
  const userId = "user-dev-001";
  const cvId = "cv-arinao-001";

  return {
    users: [{
      id: userId,
      email: "arinao.dev@gmail.com",
      name: "Arinao Ndou",
      // bcrypt hash of "Test1234"
      passwordHash: "$2b$10$9cvIuGV.HysbR0x/iOWI4OMLbKi5oVyyMwCtdA1l3.0/.ot7wIj4y",
    }],
    cvs: [{
      id: cvId, userId,
      title: "Arinao Ndou — Full Stack Engineer",
      template: "ats-classic",
      createdAt: "2025-01-01T08:00:00.000Z",
      updatedAt: "2025-01-01T08:00:00.000Z",
    }],
    personalInfo: [{
      id: "pi-001", cvId,
      fullName: "Arinao Ndou",
      jobTitle: "Full-Stack Software Engineer",
      email: "Arinao.dev@gmail.com",
      phone: "079 440 5311",
      location: "Cape Town, SA",
      linkedIn: "linkedin.com/in/arinao-ndou",
      gitHub: "github.com/Tylerking406",
      summary: "Full-stack software engineer specialising in .NET backend services, microservices, and cloud-native systems. Passionate about building scalable architectures and improving system performance. Recognised for rapid delivery and production-ready contributions.",
    }],
    workExperience: [
      {
        id: "we-001", cvId,
        company: "DigiOutsource", role: "Software Engineer Graduate (Full-Stack)", location: "Cape Town",
        startDate: "2025-03-01", isCurrent: true,
        bullets: [
          "Core contributor to SuperPartners, a globally used affiliate platform supporting hundreds of concurrent users and real-time reporting for brands including Betway and JackpotCity.",
          "Developed and maintained .NET 8 microservices on the internal Yoda platform, using MSSQL, RabbitMQ, Kafka, Docker, and Kubernetes.",
          "Reduced critical API latency by 60% (8s → 3s) by refactoring nested loops and introducing hash-map based single-lookup logic.",
          "Improved production observability by configuring centralised log shipping to Kibana via LAAS, improving incident diagnosis.",
          "Accelerated CI/CD deployments by refactoring legacy gitlab-ci.yml pipelines and enabling per-service deployments.",
          "Designed and implemented a backend API from scratch, integrated into SuperPartners with OAuth-based authentication.",
          "Delivered production-ready code within two weeks of joining, selected as a top-performing graduate and awarded a performance bonus.",
        ],
        orderIndex: 0,
      },
      {
        id: "we-002", cvId,
        company: "Kion Consulting", role: "Systems Analyst (Vacation Work)", location: "Remote",
        startDate: "2024-12-01", endDate: "2025-03-01", isCurrent: false,
        bullets: [
          "Worked with production Murex configurations, formulas, and trading workflows in enterprise financial systems.",
          "Launched and configured AWS EC2 instances; performed basic Ubuntu/Bash scripting for automation and support.",
        ],
        orderIndex: 1,
      },
      {
        id: "we-003", cvId,
        company: "Tata-iMali", role: "Software Engineer", location: "Remote",
        startDate: "2024-06-01", endDate: "2024-11-01", isCurrent: false,
        bullets: ["Built reusable React components and implemented Node.js features within Agile sprint teams."],
        orderIndex: 2,
      },
    ],
    education: [{
      id: "edu-001", cvId,
      institution: "University Of Cape Town (UCT)",
      degree: "BSc", field: "Computer Science and Computer Engineering",
      startDate: "2021-02-01", endDate: "2024-11-01", isCurrent: false,
      achievements: [
        "Major: Computer Science",
        "Major: Business Computing",
        "Technical Skills: Java, Python, Data Structures and Algorithms, Parallelism & Concurrency, Business Intelligence Tools, MySQL, Github, Project Management",
      ],
      orderIndex: 0,
    }],
    skills: [
      { id: "sk-001", cvId, category: "Backend",                   items: [".NET 8", "MSSQL", "Microservices", "API Design"],                              orderIndex: 0 },
      { id: "sk-002", cvId, category: "Frontend",                  items: ["React", "Vue.js"],                                                              orderIndex: 1 },
      { id: "sk-003", cvId, category: "Infrastructure",            items: ["Docker", "Kubernetes", "GitLab CI/CD"],                                         orderIndex: 2 },
      { id: "sk-004", cvId, category: "Messaging & Observability", items: ["Kafka", "RabbitMQ", "Grafana", "Prometheus", "Kibana"],                         orderIndex: 3 },
      { id: "sk-005", cvId, category: "Auth",                      items: ["OAuth"],                                                                         orderIndex: 4 },
      { id: "sk-006", cvId, category: "Languages",                 items: ["C#", "Java", "Python", "JavaScript", "TypeScript"],                             orderIndex: 5 },
    ],
    projects: [
      {
        id: "pr-001", cvId, name: "AI Contract Summarisation API",
        url: "https://github.com/Tylerking406/AI-summary",
        bullets: ["Built a public backend API for AI-powered document summarisation, client planning production integration."],
        orderIndex: 0,
      },
      {
        id: "pr-002", cvId, name: "Travel & Tour Booking Platform",
        url: "https://github.com/Tylerking406/Code",
        bullets: ["Developed and deployed a live booking website; configured Cloudflare Pages, DNS, and SSL."],
        orderIndex: 1,
      },
      {
        id: "pr-003", cvId, name: "Innovexia Portfolio Website",
        url: "https://github.com/Tylerking406/innoverxia",
        bullets: ["A responsive, modern portfolio website built with React to showcase Innovexia's services, company information, and contact functionality. Developed with a focus on clean UI/UX and maintainable component structure."],
        orderIndex: 2,
      },
    ],
    certifications: [],
    achievements: [],
  };
}

declare const globalThis: { __cvMakerStore?: MockStore } & typeof global;
if (!globalThis.__cvMakerStore) globalThis.__cvMakerStore = seed();
export const store = globalThis.__cvMakerStore;
