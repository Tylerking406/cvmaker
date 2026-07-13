import type { CvTemplateData } from "@/lib/cv-template-data";
import { AtsClassicTemplate } from "./AtsClassicTemplate";
import { ModernSidebarTemplate } from "./ModernSidebarTemplate";
import { MinimalTemplate } from "./MinimalTemplate";

export interface CvTemplateDef {
  id: string;
  name: string;
  description: string;
  Component: React.ComponentType<{ data: CvTemplateData }>;
}

export const CV_TEMPLATES: CvTemplateDef[] = [
  {
    id: "ats-classic",
    name: "Classic",
    description: "Serif, single-column, and formatted to parse cleanly through applicant tracking systems.",
    Component: AtsClassicTemplate,
  },
  {
    id: "modern-sidebar",
    name: "Modern",
    description: "Two-column layout with a colored sidebar for contact info and skills — a bit more visual polish.",
    Component: ModernSidebarTemplate,
  },
  {
    id: "minimal-clean",
    name: "Minimal",
    description: "Clean, spacious, and understated — a safe, professional choice for any field.",
    Component: MinimalTemplate,
  },
];

export const DEFAULT_TEMPLATE_ID = CV_TEMPLATES[0].id;

export function getTemplate(id: string): CvTemplateDef {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}
