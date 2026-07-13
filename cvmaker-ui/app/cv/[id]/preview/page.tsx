"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  type Cv,
  type PersonalInfo,
  type WorkExperience,
  type Education,
  type Skill,
  type Project,
  type Certification,
  type Achievement,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Loader2 } from "lucide-react";

const TEAL = "#2B9EB3";

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
  const [year, month] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function yearOnly(d?: string | null): string {
  return d ? d.split("-")[0] : "";
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-zinc-500">&middot;</span>
      <span className="flex-1">{children}</span>
    </div>
  );
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
      {/* Toolbar */}
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
          className="bg-white text-zinc-900 mx-auto max-w-[210mm] px-[18mm] py-[14mm] print:shadow-none print:mx-0 print:max-w-none shadow-xl font-serif text-[10.5pt] leading-[1.5]"
          style={{ minHeight: "297mm" }}
        >
          {/* ── Header ── */}
          {info && (
            <header>
              <h1 className="text-center text-[22pt] font-bold leading-tight" style={{ color: TEAL }}>
                {info.fullName}
              </h1>

              {/* 2-column contact row */}
              <div className="grid grid-cols-2 gap-x-8 mt-2 text-[9.5pt]">
                <div className="space-y-0.5">
                  {info.phone && (
                    <p><span className="font-semibold">Cellphone Number:</span> {info.phone}</p>
                  )}
                  {info.gitHub && (
                    <p>
                      <span className="font-semibold">Github:</span>{" "}
                      <a
                        href={info.gitHub.startsWith("http") ? info.gitHub : `https://${info.gitHub}`}
                        style={{ color: TEAL }}
                      >
                        {info.gitHub}
                      </a>
                    </p>
                  )}
                  {info.website && (
                    <p>
                      <span className="font-semibold">Website:</span>{" "}
                      <a
                        href={info.website.startsWith("http") ? info.website : `https://${info.website}`}
                        style={{ color: TEAL }}
                      >
                        {info.website}
                      </a>
                    </p>
                  )}
                </div>
                <div className="space-y-0.5">
                  {info.email && (
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      <a href={`mailto:${info.email}`} style={{ color: TEAL }}>{info.email}</a>
                    </p>
                  )}
                  {info.linkedIn && (
                    <p>
                      <span className="font-semibold">LinkedIn:</span>{" "}
                      <a
                        href={info.linkedIn.startsWith("http") ? info.linkedIn : `https://${info.linkedIn}`}
                        style={{ color: TEAL }}
                      >
                        {info.linkedIn}
                      </a>
                    </p>
                  )}
                  {info.location && (
                    <p><span className="font-semibold">Location:</span> {info.location}</p>
                  )}
                </div>
              </div>

              {/* Teal rule */}
              <hr className="mt-3 mb-0" style={{ borderColor: TEAL, borderTopWidth: "1.5px" }} />
            </header>
          )}

          {/* ── Summary ── */}
          {info?.summary && (
            <Section title="Summary">
              <p className="text-[10pt] leading-relaxed mt-1">{info.summary}</p>
            </Section>
          )}

          {/* ── Experience ── */}
          {experience.length > 0 && (
            <Section title="Experience">
              {experience.map((exp, i) => {
                const start = formatDate(exp.startDate);
                const end = exp.isCurrent ? "Present" : formatDate(exp.endDate);
                const dateStr = start && end ? `${start} – ${end}` : start || end;
                return (
                  <div key={exp.id} className={i > 0 ? "mt-3" : ""}>
                    <p className="font-bold">
                      {dateStr}{" | "}{exp.role}{" | "}{exp.company}{exp.location ? `, ${exp.location}` : ""}
                    </p>
                    {exp.bullets.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {exp.bullets.map((b, j) => (
                          <Bullet key={j}>{b}</Bullet>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>
          )}

          {/* ── Education ── */}
          {education.length > 0 && (
            <Section title="Education">
              {education.map((edu, i) => {
                const startY = yearOnly(edu.startDate);
                const endY = edu.isCurrent ? "Present" : yearOnly(edu.endDate);
                const dateStr = startY && endY ? `${startY} - ${endY}` : startY || endY;
                return (
                  <div key={edu.id} className={i > 0 ? "mt-3" : ""}>
                    <p className="font-bold">
                      {dateStr}{" | "}{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{" |"}{edu.institution}
                    </p>
                    {edu.achievements.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {edu.achievements.map((a, j) => (
                          <Bullet key={j}>{a}</Bullet>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>
          )}

          {/* ── Projects ── */}
          {projects.length > 0 && (
            <Section title="Projects">
              {projects.map((p, i) => (
                <div key={p.id} className={i > 0 ? "mt-3" : ""}>
                  <p className="font-bold">{p.name}</p>
                  <div className="mt-0.5 space-y-0.5">
                    {p.description && <Bullet>{p.description}</Bullet>}
                    {p.bullets.map((b, j) => (
                      <Bullet key={j}>{b}</Bullet>
                    ))}
                    {p.url && (
                      <Bullet>
                        <a
                          href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                          style={{ color: TEAL }}
                        >
                          {p.url}
                        </a>
                      </Bullet>
                    )}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* ── Skills ── */}
          {skills.length > 0 && (
            <Section title="Technical Skills">
              <div className="mt-1 space-y-0.5">
                {skills.map((s) => (
                  <Bullet key={s.id}>
                    <span className="font-bold">{s.category}:</span>{" "}
                    {s.items.join(", ")}
                  </Bullet>
                ))}
              </div>
            </Section>
          )}

          {/* ── Certifications ── */}
          {certifications.length > 0 && (
            <Section title="Certifications">
              <div className="mt-1 space-y-0.5">
                {certifications.map((c) => (
                  <Bullet key={c.id}>
                    <span className="font-bold">{c.name}</span>
                    {c.issuer && <span> — {c.issuer}</span>}
                    {c.issueDate && <span className="text-zinc-600"> ({formatDate(c.issueDate)}{c.expiryDate ? ` – ${formatDate(c.expiryDate)}` : ""})</span>}
                    {c.url && (
                      <>{" "}<a href={c.url.startsWith("http") ? c.url : `https://${c.url}`} style={{ color: TEAL }}>{c.url}</a></>
                    )}
                  </Bullet>
                ))}
              </div>
            </Section>
          )}

          {/* ── Achievements ── */}
          {achievements.length > 0 && (
            <Section title="Achievements">
              <div className="mt-1 space-y-0.5">
                {achievements.map((a) => (
                  <Bullet key={a.id}>{a.description}</Bullet>
                ))}
              </div>
            </Section>
          )}
        </article>
      </div>

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
      <h2
        className="text-[13pt] font-bold pb-0.5"
        style={{ color: TEAL, borderBottom: `1.5px solid ${TEAL}` }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
