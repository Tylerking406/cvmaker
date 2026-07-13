"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type Cv, type PersonalInfo, type WorkExperience, type Education, type Skill, type Project, type Certification, type Achievement } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText, ChevronLeft, User, Briefcase, GraduationCap,
  Wrench, FolderOpen, Award, Trophy, Loader2, Plus, Trash2, Save, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

type Section = "personal" | "experience" | "education" | "skills" | "projects" | "certifications" | "achievements";

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "personal",       label: "Personal Info",    icon: User },
  { id: "experience",     label: "Experience",       icon: Briefcase },
  { id: "education",      label: "Education",        icon: GraduationCap },
  { id: "skills",         label: "Skills",           icon: Wrench },
  { id: "projects",       label: "Projects",         icon: FolderOpen },
  { id: "certifications", label: "Certifications",   icon: Award },
  { id: "achievements",   label: "Achievements",     icon: Trophy },
];

export default function CvEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [cv, setCv] = useState<Cv | null>(null);
  const [section, setSection] = useState<Section>("personal");
  const [loading, setLoading] = useState(true);

  const [info, setInfo] = useState<Partial<PersonalInfo>>({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    Promise.all([
      api.cvs.get(id),
      api.personalInfo.get(id).catch(() => null),
      api.workExperience.list(id).catch(() => []),
      api.education.list(id).catch(() => []),
      api.skills.list(id).catch(() => []),
      api.projects.list(id).catch(() => []),
      api.certifications.list(id).catch(() => []),
      api.achievements.list(id).catch(() => []),
    ]).then(([cvData, infoData, expData, eduData, skillData, projData, certData, achData]) => {
      setCv(cvData);
      if (infoData) setInfo(infoData);
      setExperiences(expData);
      setEducations(eduData);
      setSkills(skillData);
      setProjects(projData);
      setCertifications(certData);
      setAchievements(achData);
    }).finally(() => setLoading(false));
  }, [id]);

  async function savePersonalInfo() {
    setSavingInfo(true);
    try {
      const saved = await api.personalInfo.upsert(id, {
        fullName: info.fullName ?? "",
        jobTitle: info.jobTitle,
        email: info.email,
        phone: info.phone,
        location: info.location,
        linkedIn: info.linkedIn,
        gitHub: info.gitHub,
        website: info.website,
        summary: info.summary,
      });
      setInfo(saved);
    } finally {
      setSavingInfo(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2 flex-1">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-foreground">{cv?.title}</span>
        </div>
        <Link href={`/cv/${id}/preview`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-border/50 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ id: sid, label, icon: Icon }) => (
            <button
              key={sid}
              onClick={() => setSection(sid)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left ${
                section === sid
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {section === "personal" && (
            <PersonalInfoSection info={info} setInfo={setInfo} onSave={savePersonalInfo} saving={savingInfo} />
          )}
          {section === "experience" && (
            <ExperienceSection cvId={id} experiences={experiences} setExperiences={setExperiences} />
          )}
          {section === "education" && (
            <EducationSection cvId={id} educations={educations} setEducations={setEducations} />
          )}
          {section === "skills" && (
            <SkillsSection cvId={id} skills={skills} setSkills={setSkills} />
          )}
          {section === "projects" && (
            <ProjectsSection cvId={id} projects={projects} setProjects={setProjects} />
          )}
          {section === "certifications" && (
            <CertificationsSection cvId={id} certifications={certifications} setCertifications={setCertifications} />
          )}
          {section === "achievements" && (
            <AchievementsSection cvId={id} achievements={achievements} setAchievements={setAchievements} />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Personal Info ─────────────────────────────────────────────────────────────

function PersonalInfoSection({ info, setInfo, onSave, saving }: {
  info: Partial<PersonalInfo>;
  setInfo: (v: Partial<PersonalInfo>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const field = (key: keyof PersonalInfo) => ({
    value: (info[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInfo({ ...info, [key]: e.target.value }),
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" /> Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name"><Input {...field("fullName")} placeholder="Jane Doe" /></Field>
          <Field label="Job Title"><Input {...field("jobTitle")} placeholder="Software Engineer" /></Field>
          <Field label="Email"><Input {...field("email")} placeholder="jane@example.com" /></Field>
          <Field label="Phone"><Input {...field("phone")} placeholder="+1 555 000 0000" /></Field>
          <Field label="Location"><Input {...field("location")} placeholder="Cape Town, SA" /></Field>
          <Field label="Website"><Input {...field("website")} placeholder="janesmith.dev" /></Field>
          <Field label="LinkedIn"><Input {...field("linkedIn")} placeholder="linkedin.com/in/jane" /></Field>
          <Field label="GitHub"><Input {...field("gitHub")} placeholder="github.com/jane" /></Field>
        </div>
        <Field label="Professional Summary">
          <Textarea {...field("summary")} placeholder="A brief overview of your background and goals..." rows={4} />
        </Field>
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Inline bullet editor (reused in add forms and existing cards) ──────────────────

function BulletEditor({
  label = "Bullet Points",
  placeholder = "Describe what you did or achieved...",
  bullets,
  onAdd,
  onRemove,
}: {
  label?: string;
  placeholder?: string;
  bullets: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span className="flex-1 text-foreground">{b}</span>
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove(i)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="text-sm h-8"
        />
        <Button size="sm" className="h-8 gap-1" disabled={!draft.trim()} onClick={submit}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
    </div>
  );
}

// ── Work Experience ───────────────────────────────────────────────────────────

function ExperienceSection({ cvId, experiences, setExperiences }: {
  cvId: string;
  experiences: WorkExperience[];
  setExperiences: (v: WorkExperience[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", location: "", startDate: "", endDate: "" });
  const [newBullets, setNewBullets] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function add() {
    setAdding(true);
    try {
      const exp = await api.workExperience.create(cvId, {
        company: form.company,
        role: form.role,
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isCurrent: !form.endDate,
        bullets: newBullets,
        orderIndex: experiences.length,
      });
      setExperiences([...experiences, exp]);
      setForm({ company: "", role: "", location: "", startDate: "", endDate: "" });
      setNewBullets([]);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.workExperience.delete(cvId, id).catch(() => null);
    setExperiences(experiences.filter((e) => e.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function updateBullets(exp: WorkExperience, bullets: string[]) {
    const updated = await api.workExperience.update(cvId, exp.id, { ...exp, bullets });
    setExperiences(experiences.map(e => e.id === exp.id ? updated : e));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" /> Work Experience
      </h2>

      {experiences.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{exp.role}</p>
                <p className="text-xs text-muted-foreground">
                  {exp.company}{exp.location ? ` · ${exp.location}` : ""} · {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
                >
                  {expanded === exp.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(exp.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expanded === exp.id && (
              <div className="border-t border-border/50 pt-3">
                <BulletEditor
                  bullets={exp.bullets}
                  onAdd={text => updateBullets(exp, [...exp.bullets, text])}
                  onRemove={i => updateBullets(exp, exp.bullets.filter((_, idx) => idx !== i))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company"><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" /></Field>
            <Field label="Role"><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Software Engineer" /></Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote" /></Field>
            <div />
            <Field label="Start Date"><Input value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} placeholder="2022-01-01" /></Field>
            <Field label="End Date"><Input value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} placeholder="Leave blank if current" /></Field>
          </div>
          <div className="border-t border-border/40 pt-3">
            <BulletEditor
              bullets={newBullets}
              onAdd={text => setNewBullets(b => [...b, text])}
              onRemove={i => setNewBullets(b => b.filter((_, idx) => idx !== i))}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !form.company || !form.role || !form.startDate} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationSection({ cvId, educations, setEducations }: {
  cvId: string;
  educations: Education[];
  setEducations: (v: Education[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function add() {
    setAdding(true);
    try {
      const edu = await api.education.create(cvId, {
        institution: form.institution,
        degree: form.degree,
        field: form.field,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isCurrent: !form.endDate,
        achievements: newAchievements,
        orderIndex: educations.length,
      });
      setEducations([...educations, edu]);
      setForm({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
      setNewAchievements([]);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.education.delete(cvId, id).catch(() => null);
    setEducations(educations.filter((e) => e.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function updateAchievements(edu: Education, achievements: string[]) {
    const updated = await api.education.update(cvId, edu.id, { ...edu, achievements });
    setEducations(educations.map(e => e.id === edu.id ? updated : e));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" /> Education
      </h2>

      {educations.map((edu) => (
        <Card key={edu.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{edu.degree} in {edu.field}</p>
                <p className="text-xs text-muted-foreground">{edu.institution} · {edu.startDate} – {edu.isCurrent ? "Present" : edu.endDate}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(expanded === edu.id ? null : edu.id)}
                >
                  {expanded === edu.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(edu.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expanded === edu.id && (
              <div className="border-t border-border/50 pt-3">
                <BulletEditor
                  label="Achievements / Notes"
                  placeholder="e.g. Dean's list, relevant coursework..."
                  bullets={edu.achievements}
                  onAdd={text => updateAchievements(edu, [...edu.achievements, text])}
                  onRemove={i => updateAchievements(edu, edu.achievements.filter((_, idx) => idx !== i))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Institution" className="col-span-2"><Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="University of Cape Town" /></Field>
            <Field label="Degree"><Input value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="BSc" /></Field>
            <Field label="Field"><Input value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} placeholder="Computer Science" /></Field>
            <Field label="Start Date"><Input value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} placeholder="2018-02-01" /></Field>
            <Field label="End Date"><Input value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} placeholder="Leave blank if current" /></Field>
          </div>
          <div className="border-t border-border/40 pt-3">
            <BulletEditor
              label="Achievements / Notes"
              placeholder="e.g. Dean's list, relevant coursework..."
              bullets={newAchievements}
              onAdd={text => setNewAchievements(a => [...a, text])}
              onRemove={i => setNewAchievements(a => a.filter((_, idx) => idx !== i))}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !form.institution || !form.startDate} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────────

function SkillsSection({ cvId, skills, setSkills }: {
  cvId: string;
  skills: Skill[];
  setSkills: (v: Skill[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "", items: "" });

  async function add() {
    setAdding(true);
    try {
      const skill = await api.skills.create(cvId, {
        category: form.category,
        items: form.items.split(",").map((s) => s.trim()).filter(Boolean),
        orderIndex: skills.length,
      });
      setSkills([...skills, skill]);
      setForm({ category: "", items: "" });
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.skills.delete(cvId, id).catch(() => null);
    setSkills(skills.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" /> Skills
      </h2>

      {skills.map((skill) => (
        <Card key={skill.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{skill.category}</p>
              <p className="text-xs text-muted-foreground mt-1">{skill.items.join(", ")}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(skill.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Category</p>
          <Field label="Category"><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Frontend" /></Field>
          <Field label="Skills (comma separated)"><Input value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} placeholder="React, TypeScript, Tailwind CSS" /></Field>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !form.category || !form.items} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectsSection({ cvId, projects, setProjects }: {
  cvId: string;
  projects: Project[];
  setProjects: (v: Project[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", url: "" });
  const [newBullets, setNewBullets] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function add() {
    setAdding(true);
    try {
      const proj = await api.projects.create(cvId, {
        name: form.name,
        description: form.description || undefined,
        url: form.url || undefined,
        bullets: newBullets,
        orderIndex: projects.length,
      });
      setProjects([...projects, proj]);
      setForm({ name: "", description: "", url: "" });
      setNewBullets([]);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.projects.delete(cvId, id).catch(() => null);
    setProjects(projects.filter((p) => p.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function updateBullets(proj: Project, bullets: string[]) {
    const updated = await api.projects.update(cvId, proj.id, { ...proj, bullets });
    setProjects(projects.map(p => p.id === proj.id ? updated : p));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-primary" /> Projects
      </h2>

      {projects.map((proj) => (
        <Card key={proj.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{proj.name}</p>
                {proj.description && <p className="text-xs text-muted-foreground mt-0.5">{proj.description}</p>}
                {proj.url && <p className="text-xs text-primary mt-0.5">{proj.url}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(expanded === proj.id ? null : proj.id)}
                >
                  {expanded === proj.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(proj.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expanded === proj.id && (
              <div className="border-t border-border/50 pt-3">
                <BulletEditor
                  placeholder="Describe a feature or achievement..."
                  bullets={proj.bullets}
                  onAdd={text => updateBullets(proj, [...proj.bullets, text])}
                  onRemove={i => updateBullets(proj, proj.bullets.filter((_, idx) => idx !== i))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Project</p>
          <Field label="Project Name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Awesome App" /></Field>
          <Field label="Description"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" /></Field>
          <Field label="URL"><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="github.com/you/project" /></Field>
          <div className="border-t border-border/40 pt-3">
            <BulletEditor
              placeholder="Describe a feature or achievement..."
              bullets={newBullets}
              onAdd={text => setNewBullets(b => [...b, text])}
              onRemove={i => setNewBullets(b => b.filter((_, idx) => idx !== i))}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !form.name} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Certifications ────────────────────────────────────────────────────────────

function CertificationsSection({ cvId, certifications, setCertifications }: {
  cvId: string;
  certifications: Certification[];
  setCertifications: (v: Certification[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", issueDate: "", expiryDate: "", url: "" });

  async function add() {
    setAdding(true);
    try {
      const cert = await api.certifications.create(cvId, {
        name: form.name,
        issuer: form.issuer,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        url: form.url || undefined,
        orderIndex: certifications.length,
      });
      setCertifications([...certifications, cert]);
      setForm({ name: "", issuer: "", issueDate: "", expiryDate: "", url: "" });
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.certifications.delete(cvId, id).catch(() => null);
    setCertifications(certifications.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" /> Certifications
      </h2>

      {certifications.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{cert.name}</p>
              <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.issueDate}{cert.expiryDate ? ` – ${cert.expiryDate}` : ""}</p>
              {cert.url && <p className="text-xs text-primary mt-0.5">{cert.url}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(cert.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Certification</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" className="col-span-2"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="AWS Solutions Architect" /></Field>
            <Field label="Issuer"><Input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="Amazon Web Services" /></Field>
            <Field label="URL"><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="credly.com/badges/..." /></Field>
            <Field label="Issue Date"><Input value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} placeholder="2023-06-01" /></Field>
            <Field label="Expiry Date"><Input value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} placeholder="Leave blank if no expiry" /></Field>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !form.name || !form.issuer || !form.issueDate} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────

function AchievementsSection({ cvId, achievements, setAchievements }: {
  cvId: string;
  achievements: Achievement[];
  setAchievements: (v: Achievement[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  async function add() {
    if (!draft.trim()) return;
    setAdding(true);
    try {
      const ach = await api.achievements.create(cvId, {
        description: draft.trim(),
        orderIndex: achievements.length,
      });
      setAchievements([...achievements, ach]);
      setDraft("");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.achievements.delete(cvId, id).catch(() => null);
    setAchievements(achievements.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" /> Achievements
      </h2>

      {achievements.map((ach) => (
        <Card key={ach.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <p className="text-sm flex-1">{ach.description}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => remove(ach.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Achievement</p>
          <Field label="Description">
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="e.g. Won 1st place at HackZA 2023 hackathon"
              rows={2}
            />
          </Field>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding || !draft.trim()} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
