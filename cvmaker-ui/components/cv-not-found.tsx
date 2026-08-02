import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when the API returns 404 for a CV — because it was deleted, or because it belongs
 * to someone else. The API deliberately does not distinguish the two (a 403 would confirm
 * the id exists), so the copy shouldn't either.
 */
export function CvNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
          <FileQuestion className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">CV not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This CV doesn&apos;t exist, or it isn&apos;t one of yours. If you followed an old
          link, it may have been deleted.
        </p>
        <Link href="/dashboard" className="inline-block mt-6">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to my CVs
          </Button>
        </Link>
      </div>
    </div>
  );
}
