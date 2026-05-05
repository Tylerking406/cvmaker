"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Cv } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";

const DEV_USER_EMAIL = "dev@cvmaker.local";
const DEV_USER_ID_KEY = "cvmaker_dev_user_id";

async function getOrCreateDevUser(): Promise<string> {
  const cached = localStorage.getItem(DEV_USER_ID_KEY);
  if (cached) return cached;

  const users = await api.users.list();
  const existing = users.find((u) => u.email === DEV_USER_EMAIL);
  if (existing) {
    localStorage.setItem(DEV_USER_ID_KEY, existing.id);
    return existing.id;
  }

  const created = await api.users.create(DEV_USER_EMAIL);
  localStorage.setItem(DEV_USER_ID_KEY, created.id);
  return created.id;
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getOrCreateDevUser()
      .then((uid) => {
        if (cancelled) return;
        setUserId(uid);
        return api.cvs.list(uid);
      })
      .then((data) => {
        if (cancelled || !data) return;
        setCvs(data);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the API — is it running on port 5133?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function createCv() {
    if (!userId) return;
    setCreating(true);
    try {
      const cv = await api.cvs.create({ userId, title: `My CV ${cvs.length + 1}` });
      setCvs((prev) => [cv, ...prev]);
    } catch {
      setError("Failed to create CV.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteCv(id: string) {
    await api.cvs.delete(id).catch(() => null);
    setCvs((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors">
            CvMaker
          </Link>
        </div>
        <Button onClick={createCv} disabled={creating || !userId} size="sm" className="gap-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New CV
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">My CVs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {cvs.length === 0 && !loading ? "No CVs yet — create your first one." : `${cvs.length} CV${cvs.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={createCv}
              disabled={creating}
              className="rounded-xl border border-dashed border-border/70 bg-card/50 p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group min-h-[160px]"
            >
              <div className="h-10 w-10 rounded-full border border-current flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New CV</span>
            </button>

            {cvs.map((cv) => (
              <Card key={cv.id} className="flex flex-col hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{cv.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">Draft</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(cv.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="gap-2 pt-0">
                  <Link href={`/cv/${cv.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-1.5">
                      Edit <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteCv(cv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
