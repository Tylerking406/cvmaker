"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type Cv, type PersonalInfo, type WorkExperience, type Education, type Skill, type Project, type Certification, type Achievement } from "@/lib/api";
import {
  sanitizeText, isValidEmail, isValidPhone, isValidUrl, isValidDate, isDateOnOrAfter, splitSanitizedList,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import {
  FileText, ChevronLeft, User, Briefcase, GraduationCap,
  Wrench, FolderOpen, Award, Trophy, Loader2, Plus, Trash2, Save, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

const errClass = (hasError: boolean) => (hasError ? "border-destructive focus-visible:ring-destructive" : "");

function CurrentCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-input accent-primary"
      />
      {label}
    </label>
  );
}

const DEGREE_OPTIONS = [
  "High School Diploma", "Associate Degree", "Diploma", "Certificate",
  "BSc", "BA", "BEng", "BCom", "BCompSc", "MSc", "MA", "MBA", "PhD", "Other",
];

function DegreeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isCustom = value !== "" && !DEGREE_OPTIONS.slice(0, -1).includes(value);
  return (
    <div className="space-y-2">
      <Select value={isCustom ? "Other" : value} onValueChange={v => onChange(v === "Other" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select degree type" /></SelectTrigger>
        <SelectContent>
          {DEGREE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
      {isCustom && (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Enter degree name" className="text-sm h-8" />
      )}
    </div>
  );
}

const SKILL_CATEGORY_OPTIONS = [
  "Programming Languages", "Frontend", "Backend", "Databases",
  "DevOps & Infrastructure", "Cloud", "Testing & QA", "Tools", "Soft Skills", "Other",
];

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isCustom = value !== "" && !SKILL_CATEGORY_OPTIONS.slice(0, -1).includes(value);
  return (
    <div className="space-y-2">
      <Select value={isCustom ? "Other" : value} onValueChange={v => onChange(v === "Other" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
        <SelectContent>
          {SKILL_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
      {isCustom && (
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Enter category name" className="text-sm h-8" />
      )}
    </div>
  );
}

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
        fullName: sanitizeText(info.fullName ?? ""),
        jobTitle: sanitizeText(info.jobTitle ?? "") || undefined,
        email: sanitizeText(info.email ?? "") || undefined,
        phone: sanitizeText(info.phone ?? "") || undefined,
        location: sanitizeText(info.location ?? "") || undefined,
        linkedIn: sanitizeText(info.linkedIn ?? "") || undefined,
        gitHub: sanitizeText(info.gitHub ?? "") || undefined,
        website: sanitizeText(info.website ?? "") || undefined,
        summary: sanitizeText(info.summary ?? "") || undefined,
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

function getPersonalInfoErrors(info: Partial<PersonalInfo>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(info.fullName ?? "")) errors.fullName = "Full name is required.";
  if (!isValidEmail(info.email ?? "")) errors.email = "Enter a valid email address.";
  if (!isValidPhone(info.phone ?? "")) errors.phone = "Enter a valid phone number.";
  if (!isValidUrl(info.website ?? "")) errors.website = "Enter a valid URL.";
  if (!isValidUrl(info.linkedIn ?? "")) errors.linkedIn = "Enter a valid URL.";
  if (!isValidUrl(info.gitHub ?? "")) errors.gitHub = "Enter a valid URL.";
  return errors;
}

function PersonalInfoSection({ info, setInfo, onSave, saving }: {
  info: Partial<PersonalInfo>;
  setInfo: (v: Partial<PersonalInfo>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const errors = getPersonalInfoErrors(info);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);

  const field = (key: keyof PersonalInfo) => ({
    value: (info[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInfo({ ...info, [key]: e.target.value }),
    onBlur: () => setTouched(t => ({ ...t, [key]: true })),
    className: errClass(!!showError(key)),
  });

  function handleSave() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    onSave();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" /> Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" error={showError("fullName")}><Input {...field("fullName")} placeholder="Jane Doe" maxLength={200} /></Field>
          <Field label="Job Title"><Input {...field("jobTitle")} placeholder="Software Engineer" maxLength={200} /></Field>
          <Field label="Email" error={showError("email")}><Input {...field("email")} placeholder="jane@example.com" maxLength={200} /></Field>
          <Field label="Phone" error={showError("phone")}><Input {...field("phone")} placeholder="+1 555 000 0000" maxLength={30} /></Field>
          <Field label="Location"><Input {...field("location")} placeholder="Cape Town, SA" maxLength={200} /></Field>
          <Field label="Website" error={showError("website")}><Input {...field("website")} placeholder="janesmith.dev" maxLength={200} /></Field>
          <Field label="LinkedIn" error={showError("linkedIn")}><Input {...field("linkedIn")} placeholder="linkedin.com/in/jane" maxLength={200} /></Field>
          <Field label="GitHub" error={showError("gitHub")}><Input {...field("gitHub")} placeholder="github.com/jane" maxLength={200} /></Field>
        </div>
        <Field label="Professional Summary">
          <Textarea {...field("summary")} placeholder="A brief overview of your background and goals..." rows={4} maxLength={2000} />
        </Field>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
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

type ExperienceForm = { company: string; role: string; location: string; startDate: string; endDate: string };

function getExperienceErrors(f: ExperienceForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(f.company)) errors.company = "Company is required.";
  if (!sanitizeText(f.role)) errors.role = "Role is required.";
  if (!f.startDate) errors.startDate = "Start date is required.";
  else if (!isValidDate(f.startDate)) errors.startDate = "Enter a valid date.";
  if (f.endDate && !isValidDate(f.endDate)) errors.endDate = "Enter a valid date.";
  else if (f.endDate && !isDateOnOrAfter(f.startDate, f.endDate)) errors.endDate = "End date must be after the start date.";
  return errors;
}

function ExperienceSection({ cvId, experiences, setExperiences }: {
  cvId: string;
  experiences: WorkExperience[];
  setExperiences: (v: WorkExperience[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ExperienceForm>({ company: "", role: "", location: "", startDate: "", endDate: "" });
  const [newBullets, setNewBullets] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExperienceForm>({ company: "", role: "", location: "", startDate: "", endDate: "" });
  const [editBullets, setEditBullets] = useState<string[]>([]);
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const errors = getExperienceErrors(form);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);
  const editErrors = getExperienceErrors(editForm);
  const showEditError = (key: string) => (editTouched[key] || editAttempted ? editErrors[key] : undefined);

  async function add() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const exp = await api.workExperience.create(cvId, {
        company: sanitizeText(form.company),
        role: sanitizeText(form.role),
        location: sanitizeText(form.location) || undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isCurrent: !form.endDate,
        bullets: newBullets,
        orderIndex: experiences.length,
      });
      setExperiences([...experiences, exp]);
      setForm({ company: "", role: "", location: "", startDate: "", endDate: "" });
      setNewBullets([]);
      setTouched({});
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.workExperience.delete(cvId, id).catch(() => null);
    setExperiences(experiences.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(exp: WorkExperience) {
    setEditingId(exp.id);
    setEditForm({ company: exp.company, role: exp.role, location: exp.location ?? "", startDate: exp.startDate, endDate: exp.endDate ?? "" });
    setEditBullets(exp.bullets);
    setEditTouched({});
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(exp: WorkExperience) {
    setEditAttempted(true);
    if (Object.keys(editErrors).length > 0) return;
    setSavingEdit(true);
    try {
      const updated = await api.workExperience.update(cvId, exp.id, {
        ...exp,
        company: sanitizeText(editForm.company),
        role: sanitizeText(editForm.role),
        location: sanitizeText(editForm.location) || undefined,
        startDate: editForm.startDate,
        endDate: editForm.endDate || undefined,
        isCurrent: !editForm.endDate,
        bullets: editBullets,
      });
      setExperiences(experiences.map(e => e.id === exp.id ? updated : e));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
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
                  onClick={() => editingId === exp.id ? cancelEdit() : startEdit(exp)}
                >
                  {editingId === exp.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(exp.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === exp.id && (
              <div className="border-t border-border/50 pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Company" error={showEditError("company")}>
                    <Input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, company: true }))} className={errClass(!!showEditError("company"))} maxLength={200} />
                  </Field>
                  <Field label="Role" error={showEditError("role")}>
                    <Input value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, role: true }))} className={errClass(!!showEditError("role"))} maxLength={200} />
                  </Field>
                  <Field label="Location"><Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} maxLength={200} /></Field>
                  <div />
                  <Field label="Start Date" error={showEditError("startDate")}>
                    <Input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, startDate: true }))} className={errClass(!!showEditError("startDate"))} />
                  </Field>
                  <Field label="End Date" error={showEditError("endDate")}>
                    <Input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, endDate: true }))} className={errClass(!!showEditError("endDate"))} />
                    <div className="pt-1">
                      <CurrentCheckbox checked={!editForm.endDate} onChange={v => setEditForm(f => ({ ...f, endDate: v ? "" : f.endDate }))} label="I currently work here" />
                    </div>
                  </Field>
                </div>
                <BulletEditor
                  bullets={editBullets}
                  onAdd={text => setEditBullets(b => [...b, text])}
                  onRemove={i => setEditBullets(b => b.filter((_, idx) => idx !== i))}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(exp)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" error={showError("company")}>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, company: true }))} placeholder="Acme Corp" className={errClass(!!showError("company"))} maxLength={200} />
            </Field>
            <Field label="Role" error={showError("role")}>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, role: true }))} placeholder="Software Engineer" className={errClass(!!showError("role"))} maxLength={200} />
            </Field>
            <Field label="Location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote" maxLength={200} /></Field>
            <div />
            <Field label="Start Date" error={showError("startDate")}>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, startDate: true }))} className={errClass(!!showError("startDate"))} />
            </Field>
            <Field label="End Date" error={showError("endDate")}>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, endDate: true }))} className={errClass(!!showError("endDate"))} />
              <div className="pt-1">
                <CurrentCheckbox checked={!form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v ? "" : f.endDate }))} label="I currently work here" />
              </div>
            </Field>
          </div>
          <div className="border-t border-border/40 pt-3">
            <BulletEditor
              bullets={newBullets}
              onAdd={text => setNewBullets(b => [...b, text])}
              onRemove={i => setNewBullets(b => b.filter((_, idx) => idx !== i))}
            />
          </div>
          <div className="flex justify-center">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

type EducationForm = { institution: string; degree: string; field: string; startDate: string; endDate: string };

function getEducationErrors(f: EducationForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(f.institution)) errors.institution = "Institution is required.";
  if (!sanitizeText(f.degree)) errors.degree = "Degree is required.";
  if (!f.startDate) errors.startDate = "Start date is required.";
  else if (!isValidDate(f.startDate)) errors.startDate = "Enter a valid date.";
  if (f.endDate && !isValidDate(f.endDate)) errors.endDate = "Enter a valid date.";
  else if (f.endDate && !isDateOnOrAfter(f.startDate, f.endDate)) errors.endDate = "End date must be after the start date.";
  return errors;
}

function EducationSection({ cvId, educations, setEducations }: {
  cvId: string;
  educations: Education[];
  setEducations: (v: Education[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<EducationForm>({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EducationForm>({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
  const [editAchievements, setEditAchievements] = useState<string[]>([]);
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const errors = getEducationErrors(form);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);
  const editErrors = getEducationErrors(editForm);
  const showEditError = (key: string) => (editTouched[key] || editAttempted ? editErrors[key] : undefined);

  async function add() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const edu = await api.education.create(cvId, {
        institution: sanitizeText(form.institution),
        degree: sanitizeText(form.degree),
        field: sanitizeText(form.field),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isCurrent: !form.endDate,
        achievements: newAchievements,
        orderIndex: educations.length,
      });
      setEducations([...educations, edu]);
      setForm({ institution: "", degree: "", field: "", startDate: "", endDate: "" });
      setNewAchievements([]);
      setTouched({});
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.education.delete(cvId, id).catch(() => null);
    setEducations(educations.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(edu: Education) {
    setEditingId(edu.id);
    setEditForm({ institution: edu.institution, degree: edu.degree, field: edu.field, startDate: edu.startDate, endDate: edu.endDate ?? "" });
    setEditAchievements(edu.achievements);
    setEditTouched({});
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(edu: Education) {
    setEditAttempted(true);
    if (Object.keys(editErrors).length > 0) return;
    setSavingEdit(true);
    try {
      const updated = await api.education.update(cvId, edu.id, {
        ...edu,
        institution: sanitizeText(editForm.institution),
        degree: sanitizeText(editForm.degree),
        field: sanitizeText(editForm.field),
        startDate: editForm.startDate,
        endDate: editForm.endDate || undefined,
        isCurrent: !editForm.endDate,
        achievements: editAchievements,
      });
      setEducations(educations.map(e => e.id === edu.id ? updated : e));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
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
                  onClick={() => editingId === edu.id ? cancelEdit() : startEdit(edu)}
                >
                  {editingId === edu.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(edu.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === edu.id && (
              <div className="border-t border-border/50 pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Institution" className="col-span-2" error={showEditError("institution")}>
                    <Input value={editForm.institution} onChange={e => setEditForm(f => ({ ...f, institution: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, institution: true }))} className={errClass(!!showEditError("institution"))} maxLength={200} />
                  </Field>
                  <Field label="Degree" error={showEditError("degree")}>
                    <DegreeSelect value={editForm.degree} onChange={v => setEditForm(f => ({ ...f, degree: v }))} />
                  </Field>
                  <Field label="Field"><Input value={editForm.field} onChange={e => setEditForm(f => ({ ...f, field: e.target.value }))} maxLength={200} /></Field>
                  <Field label="Start Date" error={showEditError("startDate")}>
                    <Input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, startDate: true }))} className={errClass(!!showEditError("startDate"))} />
                  </Field>
                  <Field label="End Date" error={showEditError("endDate")}>
                    <Input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, endDate: true }))} className={errClass(!!showEditError("endDate"))} />
                    <div className="pt-1">
                      <CurrentCheckbox checked={!editForm.endDate} onChange={v => setEditForm(f => ({ ...f, endDate: v ? "" : f.endDate }))} label="I'm currently studying here" />
                    </div>
                  </Field>
                </div>
                <BulletEditor
                  label="Achievements / Notes"
                  placeholder="e.g. Dean's list, relevant coursework..."
                  bullets={editAchievements}
                  onAdd={text => setEditAchievements(a => [...a, text])}
                  onRemove={i => setEditAchievements(a => a.filter((_, idx) => idx !== i))}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(edu)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Institution" className="col-span-2" error={showError("institution")}>
              <Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, institution: true }))} placeholder="University of Cape Town" className={errClass(!!showError("institution"))} maxLength={200} />
            </Field>
            <Field label="Degree" error={showError("degree")}>
              <DegreeSelect value={form.degree} onChange={v => setForm(f => ({ ...f, degree: v }))} />
            </Field>
            <Field label="Field"><Input value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} placeholder="Computer Science" maxLength={200} /></Field>
            <Field label="Start Date" error={showError("startDate")}>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, startDate: true }))} className={errClass(!!showError("startDate"))} />
            </Field>
            <Field label="End Date" error={showError("endDate")}>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, endDate: true }))} className={errClass(!!showError("endDate"))} />
              <div className="pt-1">
                <CurrentCheckbox checked={!form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v ? "" : f.endDate }))} label="I'm currently studying here" />
              </div>
            </Field>
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
          <div className="flex justify-center">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────────

type SkillForm = { category: string; items: string };

function getSkillErrors(f: SkillForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(f.category)) errors.category = "Category is required.";
  if (splitSanitizedList(f.items).length === 0) errors.items = "Add at least one skill.";
  return errors;
}

function SkillsSection({ cvId, skills, setSkills }: {
  cvId: string;
  skills: Skill[];
  setSkills: (v: Skill[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<SkillForm>({ category: "", items: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SkillForm>({ category: "", items: "" });
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const errors = getSkillErrors(form);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);
  const editErrors = getSkillErrors(editForm);
  const showEditError = (key: string) => (editTouched[key] || editAttempted ? editErrors[key] : undefined);

  async function add() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const skill = await api.skills.create(cvId, {
        category: sanitizeText(form.category),
        items: splitSanitizedList(form.items),
        orderIndex: skills.length,
      });
      setSkills([...skills, skill]);
      setForm({ category: "", items: "" });
      setTouched({});
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.skills.delete(cvId, id).catch(() => null);
    setSkills(skills.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(skill: Skill) {
    setEditingId(skill.id);
    setEditForm({ category: skill.category, items: skill.items.join(", ") });
    setEditTouched({});
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(skill: Skill) {
    setEditAttempted(true);
    if (Object.keys(editErrors).length > 0) return;
    setSavingEdit(true);
    try {
      const updated = await api.skills.update(cvId, skill.id, {
        ...skill,
        category: sanitizeText(editForm.category),
        items: splitSanitizedList(editForm.items),
      });
      setSkills(skills.map(s => s.id === skill.id ? updated : s));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" /> Skills
      </h2>

      {skills.map((skill) => (
        <Card key={skill.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{skill.category}</p>
                <p className="text-xs text-muted-foreground mt-1">{skill.items.join(", ")}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => editingId === skill.id ? cancelEdit() : startEdit(skill)}
                >
                  {editingId === skill.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(skill.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === skill.id && (
              <div className="border-t border-border/50 pt-3 space-y-3">
                <Field label="Category" error={showEditError("category")}>
                  <CategorySelect value={editForm.category} onChange={v => setEditForm(f => ({ ...f, category: v }))} />
                </Field>
                <Field label="Skills (comma separated)" error={showEditError("items")}>
                  <Input value={editForm.items} onChange={e => setEditForm(f => ({ ...f, items: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, items: true }))} className={errClass(!!showEditError("items"))} maxLength={500} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(skill)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Category</p>
          <Field label="Category" error={showError("category")}>
            <CategorySelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
          </Field>
          <Field label="Skills (comma separated)" error={showError("items")}>
            <Input value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, items: true }))} placeholder="React, TypeScript, Tailwind CSS" className={errClass(!!showError("items"))} maxLength={500} />
          </Field>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
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

type ProjectForm = { name: string; description: string; url: string };

function getProjectErrors(f: ProjectForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(f.name)) errors.name = "Project name is required.";
  if (!isValidUrl(f.url)) errors.url = "Enter a valid URL.";
  return errors;
}

function ProjectsSection({ cvId, projects, setProjects }: {
  cvId: string;
  projects: Project[];
  setProjects: (v: Project[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProjectForm>({ name: "", description: "", url: "" });
  const [newBullets, setNewBullets] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProjectForm>({ name: "", description: "", url: "" });
  const [editBullets, setEditBullets] = useState<string[]>([]);
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const errors = getProjectErrors(form);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);
  const editErrors = getProjectErrors(editForm);
  const showEditError = (key: string) => (editTouched[key] || editAttempted ? editErrors[key] : undefined);

  async function add() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const proj = await api.projects.create(cvId, {
        name: sanitizeText(form.name),
        description: sanitizeText(form.description) || undefined,
        url: sanitizeText(form.url) || undefined,
        bullets: newBullets,
        orderIndex: projects.length,
      });
      setProjects([...projects, proj]);
      setForm({ name: "", description: "", url: "" });
      setNewBullets([]);
      setTouched({});
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.projects.delete(cvId, id).catch(() => null);
    setProjects(projects.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(proj: Project) {
    setEditingId(proj.id);
    setEditForm({ name: proj.name, description: proj.description ?? "", url: proj.url ?? "" });
    setEditBullets(proj.bullets);
    setEditTouched({});
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(proj: Project) {
    setEditAttempted(true);
    if (Object.keys(editErrors).length > 0) return;
    setSavingEdit(true);
    try {
      const updated = await api.projects.update(cvId, proj.id, {
        ...proj,
        name: sanitizeText(editForm.name),
        description: sanitizeText(editForm.description) || undefined,
        url: sanitizeText(editForm.url) || undefined,
        bullets: editBullets,
      });
      setProjects(projects.map(p => p.id === proj.id ? updated : p));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
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
                  onClick={() => editingId === proj.id ? cancelEdit() : startEdit(proj)}
                >
                  {editingId === proj.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(proj.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === proj.id && (
              <div className="border-t border-border/50 pt-3 space-y-4">
                <Field label="Project Name" error={showEditError("name")}>
                  <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, name: true }))} className={errClass(!!showEditError("name"))} maxLength={200} />
                </Field>
                <Field label="Description"><Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} maxLength={500} /></Field>
                <Field label="URL" error={showEditError("url")}>
                  <Input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, url: true }))} className={errClass(!!showEditError("url"))} maxLength={300} />
                </Field>
                <BulletEditor
                  placeholder="Describe a feature or achievement..."
                  bullets={editBullets}
                  onAdd={text => setEditBullets(b => [...b, text])}
                  onRemove={i => setEditBullets(b => b.filter((_, idx) => idx !== i))}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(proj)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Project</p>
          <Field label="Project Name" error={showError("name")}>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="My Awesome App" className={errClass(!!showError("name"))} maxLength={200} />
          </Field>
          <Field label="Description"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" maxLength={500} /></Field>
          <Field label="URL" error={showError("url")}>
            <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, url: true }))} placeholder="github.com/you/project" className={errClass(!!showError("url"))} maxLength={300} />
          </Field>
          <div className="border-t border-border/40 pt-3">
            <BulletEditor
              placeholder="Describe a feature or achievement..."
              bullets={newBullets}
              onAdd={text => setNewBullets(b => [...b, text])}
              onRemove={i => setNewBullets(b => b.filter((_, idx) => idx !== i))}
            />
          </div>
          <div className="flex justify-center">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Certifications ────────────────────────────────────────────────────────────

type CertificationForm = { name: string; issuer: string; issueDate: string; expiryDate: string; url: string };

function getCertificationErrors(f: CertificationForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sanitizeText(f.name)) errors.name = "Name is required.";
  if (!sanitizeText(f.issuer)) errors.issuer = "Issuer is required.";
  if (!f.issueDate) errors.issueDate = "Issue date is required.";
  else if (!isValidDate(f.issueDate)) errors.issueDate = "Enter a valid date.";
  if (f.expiryDate && !isValidDate(f.expiryDate)) errors.expiryDate = "Enter a valid date.";
  else if (f.expiryDate && !isDateOnOrAfter(f.issueDate, f.expiryDate)) errors.expiryDate = "Expiry date must be after the issue date.";
  if (!isValidUrl(f.url)) errors.url = "Enter a valid URL.";
  return errors;
}

function CertificationsSection({ cvId, certifications, setCertifications }: {
  cvId: string;
  certifications: Certification[];
  setCertifications: (v: Certification[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CertificationForm>({ name: "", issuer: "", issueDate: "", expiryDate: "", url: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CertificationForm>({ name: "", issuer: "", issueDate: "", expiryDate: "", url: "" });
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const errors = getCertificationErrors(form);
  const showError = (key: string) => (touched[key] || attempted ? errors[key] : undefined);
  const editErrors = getCertificationErrors(editForm);
  const showEditError = (key: string) => (editTouched[key] || editAttempted ? editErrors[key] : undefined);

  async function add() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const cert = await api.certifications.create(cvId, {
        name: sanitizeText(form.name),
        issuer: sanitizeText(form.issuer),
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        url: sanitizeText(form.url) || undefined,
        orderIndex: certifications.length,
      });
      setCertifications([...certifications, cert]);
      setForm({ name: "", issuer: "", issueDate: "", expiryDate: "", url: "" });
      setTouched({});
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.certifications.delete(cvId, id).catch(() => null);
    setCertifications(certifications.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(cert: Certification) {
    setEditingId(cert.id);
    setEditForm({ name: cert.name, issuer: cert.issuer, issueDate: cert.issueDate, expiryDate: cert.expiryDate ?? "", url: cert.url ?? "" });
    setEditTouched({});
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(cert: Certification) {
    setEditAttempted(true);
    if (Object.keys(editErrors).length > 0) return;
    setSavingEdit(true);
    try {
      const updated = await api.certifications.update(cvId, cert.id, {
        ...cert,
        name: sanitizeText(editForm.name),
        issuer: sanitizeText(editForm.issuer),
        issueDate: editForm.issueDate,
        expiryDate: editForm.expiryDate || undefined,
        url: sanitizeText(editForm.url) || undefined,
      });
      setCertifications(certifications.map(c => c.id === cert.id ? updated : c));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" /> Certifications
      </h2>

      {certifications.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.issueDate}{cert.expiryDate ? ` – ${cert.expiryDate}` : ""}</p>
                {cert.url && <p className="text-xs text-primary mt-0.5">{cert.url}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => editingId === cert.id ? cancelEdit() : startEdit(cert)}
                >
                  {editingId === cert.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(cert.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === cert.id && (
              <div className="border-t border-border/50 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" className="col-span-2" error={showEditError("name")}>
                    <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, name: true }))} className={errClass(!!showEditError("name"))} maxLength={200} />
                  </Field>
                  <Field label="Issuer" error={showEditError("issuer")}>
                    <Input value={editForm.issuer} onChange={e => setEditForm(f => ({ ...f, issuer: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, issuer: true }))} className={errClass(!!showEditError("issuer"))} maxLength={200} />
                  </Field>
                  <Field label="URL" error={showEditError("url")}>
                    <Input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, url: true }))} className={errClass(!!showEditError("url"))} maxLength={300} />
                  </Field>
                  <Field label="Issue Date" error={showEditError("issueDate")}>
                    <Input type="date" value={editForm.issueDate} onChange={e => setEditForm(f => ({ ...f, issueDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, issueDate: true }))} className={errClass(!!showEditError("issueDate"))} />
                  </Field>
                  <Field label="Expiry Date" error={showEditError("expiryDate")}>
                    <Input type="date" value={editForm.expiryDate} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} onBlur={() => setEditTouched(t => ({ ...t, expiryDate: true }))} className={errClass(!!showEditError("expiryDate"))} />
                  </Field>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(cert)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Certification</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" className="col-span-2" error={showError("name")}>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, name: true }))} placeholder="AWS Solutions Architect" className={errClass(!!showError("name"))} maxLength={200} />
            </Field>
            <Field label="Issuer" error={showError("issuer")}>
              <Input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, issuer: true }))} placeholder="Amazon Web Services" className={errClass(!!showError("issuer"))} maxLength={200} />
            </Field>
            <Field label="URL" error={showError("url")}>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, url: true }))} placeholder="credly.com/badges/..." className={errClass(!!showError("url"))} maxLength={300} />
            </Field>
            <Field label="Issue Date" error={showError("issueDate")}>
              <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, issueDate: true }))} className={errClass(!!showError("issueDate"))} />
            </Field>
            <Field label="Expiry Date" error={showError("expiryDate")}>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} onBlur={() => setTouched(t => ({ ...t, expiryDate: true }))} className={errClass(!!showError("expiryDate"))} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
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

const ACHIEVEMENT_MAX_LENGTH = 500;

function AchievementsSection({ cvId, achievements, setAchievements }: {
  cvId: string;
  achievements: Achievement[];
  setAchievements: (v: Achievement[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [attempted, setAttempted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editAttempted, setEditAttempted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const error = attempted && !sanitizeText(draft) ? "Description is required." : undefined;
  const editError = editAttempted && !sanitizeText(editDraft) ? "Description is required." : undefined;

  async function add() {
    setAttempted(true);
    if (!sanitizeText(draft)) return;
    setAdding(true);
    try {
      const ach = await api.achievements.create(cvId, {
        description: sanitizeText(draft),
        orderIndex: achievements.length,
      });
      setAchievements([...achievements, ach]);
      setDraft("");
      setAttempted(false);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await api.achievements.delete(cvId, id).catch(() => null);
    setAchievements(achievements.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(ach: Achievement) {
    setEditingId(ach.id);
    setEditDraft(ach.description);
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(ach: Achievement) {
    setEditAttempted(true);
    if (!sanitizeText(editDraft)) return;
    setSavingEdit(true);
    try {
      const updated = await api.achievements.update(cvId, ach.id, { ...ach, description: sanitizeText(editDraft) });
      setAchievements(achievements.map(a => a.id === ach.id ? updated : a));
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" /> Achievements
      </h2>

      {achievements.map((ach) => (
        <Card key={ach.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm flex-1">{ach.description}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => editingId === ach.id ? cancelEdit() : startEdit(ach)}
                >
                  {editingId === ach.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => remove(ach.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {editingId === ach.id && (
              <div className="border-t border-border/50 pt-3 space-y-3">
                <Field label="Description" error={editError}>
                  <Textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={2} maxLength={ACHIEVEMENT_MAX_LENGTH} className={errClass(!!editError)} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={() => saveEdit(ach)} disabled={savingEdit} className="gap-1.5">
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Achievement</p>
          <Field label="Description" error={error}>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="e.g. Won 1st place at HackZA 2023 hackathon"
              rows={2}
              maxLength={ACHIEVEMENT_MAX_LENGTH}
              className={errClass(!!error)}
            />
          </Field>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={adding} className="gap-1.5">
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

function Field({ label, children, className, error }: { label: string; children: React.ReactNode; className?: string; error?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
