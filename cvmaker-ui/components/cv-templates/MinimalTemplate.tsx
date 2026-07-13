import type { CvTemplateData } from "@/lib/cv-template-data";
import { yearOnly, normalizeUrl, dateRange } from "@/lib/cv-template-utils";

const ACCENT = "#334155"; // slate-700 — quiet, works for any profession

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="text-[9pt] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MinimalTemplate({ data }: { data: CvTemplateData }) {
  const { info, experience, education, skills, projects, certifications, achievements } = data;

  const contactLine = [info?.email, info?.phone, info?.location, info?.linkedIn, info?.website, info?.gitHub]
    .filter(Boolean)
    .join("   ·   ");

  return (
    <article className="h-full w-full bg-white text-zinc-800 font-sans text-[9.5pt] leading-[1.6] px-[20mm] py-[16mm]">
      {info && (
        <header className="mb-6">
          <h1 className="text-[21pt] font-light tracking-tight" style={{ color: ACCENT }}>{info.fullName}</h1>
          {info.jobTitle && <p className="text-[10.5pt] text-zinc-500 mt-0.5">{info.jobTitle}</p>}
          {contactLine && <p className="text-[8.5pt] text-zinc-500 mt-2">{contactLine}</p>}
        </header>
      )}

      {info?.summary && (
        <Section title="Summary">
          <p className="text-[9.5pt] leading-relaxed text-zinc-700">{info.summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-[10pt]">{exp.role} <span className="text-zinc-400 font-normal">— {exp.company}</span></p>
                  <p className="text-[8.5pt] text-zinc-400 shrink-0 whitespace-nowrap">{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-zinc-600">
                    {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-baseline justify-between gap-3">
                <p className="font-medium text-[10pt]">
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""} <span className="text-zinc-400 font-normal">— {edu.institution}</span>
                </p>
                <p className="text-[8.5pt] text-zinc-400 shrink-0 whitespace-nowrap">{dateRange(edu.startDate, edu.endDate, edu.isCurrent, yearOnly)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <div className="space-y-1 text-zinc-600">
            {skills.map((s) => (
              <p key={s.id}><span className="text-zinc-800 font-medium">{s.category}:</span> {s.items.join(", ")}</p>
            ))}
          </div>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          <div className="space-y-2 text-zinc-600">
            {projects.map((p) => (
              <div key={p.id}>
                <p className="font-medium text-zinc-800">{p.name}</p>
                {p.description && <p>{p.description}</p>}
                {p.url && <a href={normalizeUrl(p.url)} className="text-[8.5pt]" style={{ color: ACCENT }}>{p.url}</a>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          <div className="space-y-1 text-zinc-600">
            {certifications.map((c) => (
              <p key={c.id}><span className="text-zinc-800 font-medium">{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ""}</p>
            ))}
          </div>
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          <div className="space-y-1 text-zinc-600">
            {achievements.map((a) => <p key={a.id}>{a.description}</p>)}
          </div>
        </Section>
      )}
    </article>
  );
}
