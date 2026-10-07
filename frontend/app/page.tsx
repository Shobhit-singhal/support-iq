"use client";

import Link from "next/link";
import { useAuth, dashboardPathForRole } from "@/lib/auth";

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col items-center pb-20 pt-10 sm:pt-20">
      {/* Hero Section */}
      <div className="w-full max-w-4xl px-4 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-indigo-500"></span>
          Now with Next-Gen AI Triage
        </div>
        <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Support that thinks <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">
            ahead of the curve.
          </span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400 sm:text-xl">
          SupportIQ uses machine learning to automatically categorize, prioritize, and route incoming tickets. Resolve issues faster, track SLAs, and keep your customers happy.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {loading ? (
            <div className="h-12 w-32 animate-pulse rounded-lg bg-slate-800"></div>
          ) : user ? (
            <Link
              href={dashboardPathForRole(user.role)}
              className="flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-base font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-indigo-600 px-8 text-base font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 text-base font-medium text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-32 grid w-full max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center transition-all hover:bg-slate-900/80">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl text-indigo-400">
            🤖
          </div>
          <h3 className="mb-3 text-xl font-bold text-slate-100">AI Triage</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Every ticket is instantly analyzed for sentiment, categorized, and prioritized using our Python ML service before an agent even sees it.
          </p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center transition-all hover:bg-slate-900/80">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-500/20 text-2xl text-teal-400">
            ⏱️
          </div>
          <h3 className="mb-3 text-xl font-bold text-slate-100">SLA Tracking</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Never miss a deadline. SupportIQ tracks first-response and resolution times, flagging "At Risk" and "Breached" tickets in real time.
          </p>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center transition-all hover:bg-slate-900/80">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/20 text-2xl text-purple-400">
            📊
          </div>
          <h3 className="mb-3 text-xl font-bold text-slate-100">Actionable Analytics</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Monitor agent performance and customer satisfaction (CSAT) trends through comprehensive admin dashboards and dynamic charts.
          </p>
        </div>
      </div>
    </div>
  );
}
