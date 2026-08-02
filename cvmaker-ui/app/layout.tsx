import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActivityLogProvider } from "@/lib/activity-log";
import { DevTerminal } from "@/components/dev-terminal";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CvMaker",
  description: "Build beautiful CVs in minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <ActivityLogProvider>
              {children}
              {/* Debug-only: it logs every API call and status to a floating panel that
                  defaults to open, which real users should never see. */}
              {process.env.NODE_ENV === "development" && <DevTerminal />}
            </ActivityLogProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
