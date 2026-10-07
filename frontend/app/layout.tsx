import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SupportIQ",
  description: "AI-Powered Support & Ticket Intelligence",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 relative" suppressHydrationWarning>
        {/* Ambient background glow so the blur has something to reflect */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(15,23,42,0))]" />
        
        <AuthProvider>
          <div className="relative z-10 flex min-h-screen w-full max-w-[1600px] mx-auto border-x border-slate-800/60 bg-slate-950/40 shadow-2xl shadow-black/50">
            <NavBar />
            <main className="flex-1 w-full px-6 sm:px-12 py-10 overflow-x-hidden">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
