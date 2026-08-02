"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, type Cv } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, ArrowRight, Loader2, Eye, LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The server scopes this to the caller's token — no user id is sent.
    api.cvs
      .list()
      .then((data) => {
        if (cancelled) return;
        setCvs(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // A dead session is handled globally (auth context clears state); anything else is
        // reported here. The old copy blamed the API being down for every failure.
        if (err instanceof ApiError && err.status === 401) return;
        setError(
          err instanceof ApiError
            ? `Couldn't load your CVs: ${err.message}`
            : "Couldn't reach the server. Check your connection and try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function createCv() {
    setCreating(true);
    try {
      const cv = await api.cvs.create({ title: `My CV ${cvs.length + 1}` });
      setCvs((prev) => [cv, ...prev]);
    } catch {
      // Surfaced as a toast by the API layer.
    } finally {
      setCreating(false);
    }
  }

  async function deleteCv(id: string) {
    try {
      await api.cvs.delete(id);
      // Only drop the card once the server has actually accepted the delete — it used to
      // disappear even when the request failed, so a rejected delete looked successful
      // until the next refresh brought it back.
      setCvs((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // Surfaced as a toast by the API layer.
    }
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
        <div className="flex items-center gap-3">
          <Button onClick={createCv} disabled={creating} size="sm" className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New CV
          </Button>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center hover:bg-primary/25 transition-colors"
                title={user.email}
              >
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    {user.name && <p className="text-sm font-medium text-foreground truncate">{user.name}</p>}
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
                <Link href={`/cv/${cv.id}`} className="flex-1 flex flex-col">
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
                </Link>
                <CardFooter className="gap-2 pt-0">
                  <Link href={`/cv/${cv.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full gap-1.5">
                      Edit <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/cv/${cv.id}/preview`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
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
