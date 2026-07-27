import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ActivityLogProvider } from "@/lib/activity-log";
import { DevTerminal } from "@/components/dev-terminal";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CvMaker",
  description: "Build beautiful CVs in minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <ActivityLogProvider>
            {children}
            <DevTerminal />
          </ActivityLogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
