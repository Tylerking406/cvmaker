import type { CvTemplateData } from "@/lib/cv-template-data";
import { formatDate, yearOnly, normalizeUrl, dateRange } from "@/lib/cv-template-utils";

const TEAL = "#2B9EB3";

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-zinc-500">&middot;</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="text-[13pt] font-bold pb-0.5" style={{ color: TEAL, borderBottom: `1.5px solid ${TEAL}` }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AtsClassicTemplate({ data }: { data: CvTemplateData }) {
  const { info, experience, education, skills, projects, certifications, achievements } = data;

  return (
    <article className="bg-white text-zinc-900 font-serif text-[10.5pt] leading-[1.5] h-full px-[18mm] py-[14mm]">
      {info && (
        <header>
          <h1 className="text-center text-[22pt] font-bold leading-tight" style={{ color: TEAL }}>
            {info.fullName}
          </h1>

          <div className="grid grid-cols-2 gap-x-8 mt-2 text-[9.5pt]">
            <div className="space-y-0.5">
              {info.phone && <p><span className="font-semibold">Phone:</span> {info.phone}</p>}
              {info.gitHub && (
                <p>
                  <span className="font-semibold">Portfolio:</span>{" "}
                  <a href={normalizeUrl(info.gitHub)} style={{ color: TEAL }}>{info.gitHub}</a>
                </p>
              )}
              {info.website && (
                <p>
                  <span className="font-semibold">Website:</span>{" "}
                  <a href={normalizeUrl(info.website)} style={{ color: TEAL }}>{info.website}</a>
                </p>
              )}
            </div>
            <div className="space-y-0.5">
              {info.email && (
                <p><span className="font-semibold">Email:</span> <a href={`mailto:${info.email}`} style={{ color: TEAL }}>{info.email}</a></p>
              )}
              {info.linkedIn && (
                <p>
                  <span className="font-semibold">LinkedIn:</span>{" "}
                  <a href={normalizeUrl(info.linkedIn)} style={{ color: TEAL }}>{info.linkedIn}</a>
                </p>
              )}
              {info.location && <p><span className="font-semibold">Location:</span> {info.location}</p>}
            </div>
          </div>

          <hr className="mt-3 mb-0" style={{ borderColor: TEAL, borderTopWidth: "1.5px" }} />
        </header>
      )}

      {info?.summary && (
        <Section title="Summary">
          <p className="text-[10pt] leading-relaxed mt-1">{info.summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((exp, i) => (
            <div key={exp.id} className={i > 0 ? "mt-3" : ""}>
              <p className="font-bold">
                {dateRange(exp.startDate, exp.endDate, exp.isCurrent)}{" | "}{exp.role}{" | "}{exp.company}{exp.location ? `, ${exp.location}` : ""}
              </p>
              {exp.bullets.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {exp.bullets.map((b, j) => <Bullet key={j}>{b}</Bullet>)}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu, i) => (
            <div key={edu.id} className={i > 0 ? "mt-3" : ""}>
              <p className="font-bold">
                {dateRange(edu.startDate, edu.endDate, edu.isCurrent, yearOnly)}{" | "}{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{" |"}{edu.institution}
              </p>
              {edu.achievements.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {edu.achievements.map((a, j) => <Bullet key={j}>{a}</Bullet>)}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={p.id} className={i > 0 ? "mt-3" : ""}>
              <p className="font-bold">{p.name}</p>
              <div className="mt-0.5 space-y-0.5">
                {p.description && <Bullet>{p.description}</Bullet>}
                {p.bullets.map((b, j) => <Bullet key={j}>{b}</Bullet>)}
                {p.url && <Bullet><a href={normalizeUrl(p.url)} style={{ color: TEAL }}>{p.url}</a></Bullet>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <div className="mt-1 space-y-0.5">
            {skills.map((s) => (
              <Bullet key={s.id}><span className="font-bold">{s.category}:</span> {s.items.join(", ")}</Bullet>
            ))}
          </div>
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          <div className="mt-1 space-y-0.5">
            {certifications.map((c) => (
              <Bullet key={c.id}>
                <span className="font-bold">{c.name}</span>
                {c.issuer && <span> — {c.issuer}</span>}
                {c.issueDate && <span className="text-zinc-600"> ({formatDate(c.issueDate)}{c.expiryDate ? ` – ${formatDate(c.expiryDate)}` : ""})</span>}
                {c.url && <>{" "}<a href={normalizeUrl(c.url)} style={{ color: TEAL }}>{c.url}</a></>}
              </Bullet>
            ))}
          </div>
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          <div className="mt-1 space-y-0.5">
            {achievements.map((a) => <Bullet key={a.id}>{a.description}</Bullet>)}
          </div>
        </Section>
      )}
    </article>
  );
}
