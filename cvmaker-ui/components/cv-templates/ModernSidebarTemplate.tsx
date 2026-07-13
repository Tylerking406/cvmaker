import type { CvTemplateData } from "@/lib/cv-template-data";
import { yearOnly, normalizeUrl, dateRange } from "@/lib/cv-template-utils";

const ACCENT = "#0f766e"; // teal-700, print-safe dark accent

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 first:mt-0">
      <h2 className="text-[9.5pt] font-bold uppercase tracking-wider text-teal-200 pb-1 mb-2 border-b border-teal-600/50">
        {title}
      </h2>
      {children}
    </div>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="text-[12pt] font-bold uppercase tracking-wide mb-2" style={{ color: ACCENT }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ModernSidebarTemplate({ data }: { data: CvTemplateData }) {
  const { info, experience, education, skills, projects, certifications, achievements } = data;

  return (
    <article className="h-full w-full bg-white text-zinc-800 font-sans text-[9.5pt] leading-[1.5] flex">
      {/* Sidebar */}
      <aside className="w-[36%] shrink-0 text-white px-6 py-8" style={{ backgroundColor: ACCENT }}>
        {info && (
          <div className="mb-6">
            <h1 className="text-[17pt] font-bold leading-tight">{info.fullName}</h1>
            {info.jobTitle && <p className="text-[10pt] text-teal-100 mt-1">{info.jobTitle}</p>}
          </div>
        )}

        <SidebarSection title="Contact">
          <div className="space-y-1.5 text-[9pt] break-words">
            {info?.email && <p>{info.email}</p>}
            {info?.phone && <p>{info.phone}</p>}
            {info?.location && <p>{info.location}</p>}
            {info?.linkedIn && <p>{info.linkedIn}</p>}
            {info?.website && <p>{info.website}</p>}
            {info?.gitHub && <p>{info.gitHub}</p>}
          </div>
        </SidebarSection>

        {skills.length > 0 && (
          <SidebarSection title="Skills">
            <div className="space-y-3">
              {skills.map((s) => (
                <div key={s.id}>
                  <p className="font-semibold text-[9pt] text-teal-100">{s.category}</p>
                  <p className="text-[8.5pt] text-teal-50/90 mt-0.5">{s.items.join(", ")}</p>
                </div>
              ))}
            </div>
          </SidebarSection>
        )}

        {certifications.length > 0 && (
          <SidebarSection title="Certifications">
            <div className="space-y-2">
              {certifications.map((c) => (
                <div key={c.id} className="text-[8.5pt]">
                  <p className="font-semibold">{c.name}</p>
                  {c.issuer && <p className="text-teal-100/80">{c.issuer}</p>}
                </div>
              ))}
            </div>
          </SidebarSection>
        )}
      </aside>

      {/* Main column */}
      <div className="flex-1 px-7 py-8">
        {info?.summary && (
          <MainSection title="Summary">
            <p className="text-[9.5pt] leading-relaxed">{info.summary}</p>
          </MainSection>
        )}

        {experience.length > 0 && (
          <MainSection title="Experience">
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-bold text-[10pt]">{exp.role}</p>
                    <p className="text-[8.5pt] text-zinc-500 shrink-0">{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
                  </div>
                  <p className="text-[9pt] text-zinc-600 mb-1">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {education.length > 0 && (
          <MainSection title="Education">
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-bold text-[10pt]">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                    <p className="text-[8.5pt] text-zinc-500 shrink-0">{dateRange(edu.startDate, edu.endDate, edu.isCurrent, yearOnly)}</p>
                  </div>
                  <p className="text-[9pt] text-zinc-600">{edu.institution}</p>
                  {edu.achievements.length > 0 && (
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {edu.achievements.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {projects.length > 0 && (
          <MainSection title="Projects">
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id}>
                  <p className="font-bold text-[10pt]">{p.name}</p>
                  {p.description && <p className="text-[9pt] text-zinc-600">{p.description}</p>}
                  {p.bullets.length > 0 && (
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                  {p.url && <a href={normalizeUrl(p.url)} className="text-[8.5pt]" style={{ color: ACCENT }}>{p.url}</a>}
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {achievements.length > 0 && (
          <MainSection title="Achievements">
            <ul className="list-disc pl-4 space-y-0.5">
              {achievements.map((a) => <li key={a.id}>{a.description}</li>)}
            </ul>
          </MainSection>
        )}
      </div>
    </article>
  );
}
