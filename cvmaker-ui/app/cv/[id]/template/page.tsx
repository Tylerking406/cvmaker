"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type Cv } from "@/lib/api";
import { CV_TEMPLATES } from "@/components/cv-templates";
import { SAMPLE_CV_DATA } from "@/lib/cv-template-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Check, Loader2 } from "lucide-react";

// Roughly A4 at 96dpi — matches the "mm"/"pt" units the templates use internally.
const PAGE_W = 794;
const PAGE_H = 1123;
const THUMB_SCALE = 0.34;

export default function ChooseTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    api.cvs.get(id).then(setCv).finally(() => setLoading(false));
  }, [id]);

  async function selectTemplate(templateId: string) {
    if (!cv) return;
    setSavingId(templateId);
    try {
      const updated = await api.cvs.update(id, { title: cv.title, template: templateId });
      setCv(updated);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-3 flex items-center gap-4">
        <Link href={`/cv/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Editor
          </Button>
        </Link>
        <span className="font-medium text-sm text-foreground">Choose a Template</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Choose a Template</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pick the look for your CV — this is example content so you can compare styles. Your own content stays the same when you switch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CV_TEMPLATES.map(({ id: templateId, name, description, Component }) => {
            const isActive = cv?.template === templateId;
            return (
              <Card key={templateId} className={isActive ? "border-primary flex flex-col" : "flex flex-col"}>
                <CardContent className="pt-4 flex flex-col gap-3 flex-1">
                  <div
                    className="mx-auto rounded-md border border-border/50 overflow-hidden bg-white shadow-sm"
                    style={{ width: PAGE_W * THUMB_SCALE, height: PAGE_H * THUMB_SCALE }}
                  >
                    <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}>
                      <Component data={SAMPLE_CV_DATA} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground">{name}</p>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={isActive ? "secondary" : "default"}
                    disabled={isActive || savingId === templateId}
                    onClick={() => selectTemplate(templateId)}
                    className="gap-1.5"
                  >
                    {savingId === templateId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isActive ? <Check className="h-3.5 w-3.5" /> : null}
                    {isActive ? "Selected" : "Use this template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
