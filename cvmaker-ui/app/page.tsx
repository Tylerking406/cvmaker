import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Download, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">CvMaker</span>
        </div>
        <Link href="/dashboard">
          <Button size="sm">Get Started</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary mb-8">
          <Sparkles className="h-3 w-3" />
          Build your professional CV in minutes
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl mb-6 leading-tight">
          Your CV.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            Beautifully crafted.
          </span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl mb-10 leading-relaxed">
          Create, edit, and export professional CVs with ease. Structured sections,
          clean design, ready to impress.
        </p>

        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <FileText className="h-4 w-4" />
              Open Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Layers, title: "Structured Sections", desc: "Work experience, education, skills, projects, certifications — all organised." },
            { icon: Sparkles, title: "Clean Editor", desc: "Simple forms for each section. No clutter, just your content." },
            { icon: Download, title: "PDF Export", desc: "Download a polished PDF ready to send to employers." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 px-6 py-6 text-center text-xs text-muted-foreground">
        CvMaker — local dev build
      </footer>
    </main>
  );
}
