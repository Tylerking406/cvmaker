"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type Cv, type PersonalInfo, type WorkExperience, type Education, type Skill, type Project, type Certification, type Achievement } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Loader2 } from "lucide-react";

interface CvData {
  cv: Cv;
  info: PersonalInfo | null;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
}

function formatDate(d?: string | null): string {
  if (!d) return "";
  // DateOnly comes as "YYYY-MM-DD"
  const [year, month] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function DateRange({ start, end, current }: { start?: string | null; end?: string | null; current?: boolean }) {
  const s = formatDate(start);
  const e = current ? "Present" : formatDate(end);
  if (!s && !e) return null;
  return <span>{s}{e ? ` – ${e}` : ""}</span>;
}

export default function CvPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.cvs.get(id),
      api.personalInfo.get(id).catch(() => null),
      api.workExperience.list(id).catch(() => []),
      api.education.list(id).catch(() => []),
      api.skills.list(id).catch(() => []),
      api.projects.list(id).catch(() => []),
      api.certifications.list(id).catch(() => []),
      api.achievements.list(id).catch(() => []),
    ]).then(([cv, info, experience, education, skills, projects, certifications, achievements]) => {
      if (cancelled) return;
      setData({ cv, info, experience, education, skills, projects, certifications, achievements });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { cv, info, experience, education, skills, projects, certifications, achievements } = data;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <Link href={`/cv/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Editor
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{cv.title}</span>
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Paper */}
      <div className="py-8 px-4 print:p-0 print:py-0">
        <article
          id="cv-document"
          className="
            bg-white text-zinc-900
            mx-auto max-w-[210mm]
            px-[18mm] py-[14mm]
            print:shadow-none print:mx-0 print:max-w-none
            shadow-xl
            font-serif text-[10.5pt] leading-[1.45]
          "
          style={{ minHeight: "297mm" }}
        >
          {/* ── Header ── */}
          {info && (
            <header className="mb-4">
              <h1 className="text-[22pt] font-bold tracking-tight text-zinc-900 leading-tight">
                {info.fullName}
              </h1>
              {info.jobTitle && (
                <p className="text-[11pt] text-zinc-600 mt-0.5">{info.jobTitle}</p>
              )}

              {/* Contact line */}
              <p className="mt-2 text-[9pt] text-zinc-600 flex flex-wrap gap-x-3 gap-y-0.5">
                {info.email && <span>{info.email}</span>}
                {info.phone && <span>{info.phone}</span>}
                {info.location && <span>{info.location}</span>}
                {info.linkedIn && <span>{info.linkedIn}</span>}
                {info.gitHub && <span>{info.gitHub}</span>}
                {info.website && <span>{info.website}</span>}
              </p>

              {info.summary && (
                <p className="mt-3 text-[10pt] text-zinc-700 leading-relaxed">{info.summary}</p>
              )}
            </header>
          )}

          {/* ── Work Experience ── */}
          {experience.length > 0 && (
            <Section title="Experience">
              {experience.map((exp, i) => (
                <div key={exp.id} className={i > 0 ? "mt-3" : ""}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-zinc-900">{exp.role}</span>
                    <span className="text-[9pt] text-zinc-500 shrink-0">
                      <DateRange start={exp.startDate} end={exp.endDate} current={exp.isCurrent} />
                    </span>
                  </div>
                  <div className="text-[9.5pt] text-zinc-600">
                    {exp.company}{exp.location ? `, ${exp.location}` : ""}
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 ml-4 space-y-0.5 list-disc marker:text-zinc-400">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="text-zinc-700">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* ── Education ── */}
          {education.length > 0 && (
            <Section title="Education">
              {education.map((edu, i) => (
                <div key={edu.id} className={i > 0 ? "mt-3" : ""}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-zinc-900">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </span>
                    <span className="text-[9pt] text-zinc-500 shrink-0">
                      <DateRange start={edu.startDate} end={edu.endDate} current={edu.isCurrent} />
                    </span>
                  </div>
                  <div className="text-[9.5pt] text-zinc-600">{edu.institution}</div>
                  {edu.achievements.length > 0 && (
                    <ul className="mt-1 ml-4 space-y-0.5 list-disc marker:text-zinc-400">
                      {edu.achievements.map((a, j) => (
                        <li key={j} className="text-zinc-700">{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* ── Skills ── */}
          {skills.length > 0 && (
            <Section title="Skills">
              <div className="space-y-1">
                {skills.map((s) => (
                  <div key={s.id} className="flex gap-2">
                    <span className="font-semibold text-zinc-800 shrink-0 w-32">{s.category}:</span>
                    <span className="text-zinc-700">{s.items.join(", ")}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Projects ── */}
          {projects.length > 0 && (
            <Section title="Projects">
              {projects.map((p, i) => (
                <div key={p.id} className={i > 0 ? "mt-3" : ""}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-zinc-900">{p.name}</span>
                    {p.url && <span className="text-[9pt] text-zinc-500 shrink-0">{p.url}</span>}
                  </div>
                  {p.description && (
                    <p className="text-[9.5pt] text-zinc-600 mt-0.5">{p.description}</p>
                  )}
                  {p.bullets.length > 0 && (
                    <ul className="mt-1 ml-4 space-y-0.5 list-disc marker:text-zinc-400">
                      {p.bullets.map((b, j) => (
                        <li key={j} className="text-zinc-700">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* ── Certifications ── */}
          {certifications.length > 0 && (
            <Section title="Certifications">
              {certifications.map((c, i) => (
                <div key={c.id} className={`flex items-baseline justify-between gap-2 ${i > 0 ? "mt-1.5" : ""}`}>
                  <span>
                    <span className="font-semibold text-zinc-900">{c.name}</span>
                    {c.issuer && <span className="text-zinc-600"> — {c.issuer}</span>}
                  </span>
                  {c.issueDate && (
                    <span className="text-[9pt] text-zinc-500 shrink-0">{formatDate(c.issueDate)}</span>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* ── Achievements ── */}
          {achievements.length > 0 && (
            <Section title="Achievements">
              <ul className="ml-4 space-y-0.5 list-disc marker:text-zinc-400">
                {achievements.map((a) => (
                  <li key={a.id} className="text-zinc-700">{a.description}</li>
                ))}
              </ul>
            </Section>
          )}
        </article>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 0; size: A4; }
          #cv-document {
            padding: 14mm 18mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="text-[10.5pt] font-bold uppercase tracking-[0.12em] text-zinc-900 border-b border-zinc-300 pb-0.5 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
