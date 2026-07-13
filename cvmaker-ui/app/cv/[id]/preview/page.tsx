"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { CvTemplateData } from "@/lib/cv-template-data";
import { getTemplate } from "@/components/cv-templates";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Loader2, Palette } from "lucide-react";

export default function CvPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CvTemplateData | null>(null);
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

  const { cv } = data;
  const { Component: TemplateComponent } = getTemplate(cv.template);

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
          <Link href={`/cv/${id}/template`}>
            <Button size="sm" variant="outline" className="gap-2">
              <Palette className="h-4 w-4" />
              Change Template
            </Button>
          </Link>
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Paper */}
      <div className="py-8 px-4 print:p-0 print:py-0">
        <div
          id="cv-document"
          className="mx-auto max-w-[210mm] print:shadow-none print:mx-0 print:max-w-none shadow-xl"
          style={{ minHeight: "297mm" }}
        >
          <TemplateComponent data={data} />
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 0; size: A4; }
          #cv-document {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
