'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/narvbar';
import AttractButton from '@/components/mvpblocks/attract-button';
import Faq1 from '@/components/mvpblocks/faq-1';
import ThemeToggle from '@/components/theme/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col font-sans antialiased selection:bg-brand-primary selection:text-bg-main">
      {/* 🧭 Modular Glassmorphic Floating Navbar */}
      <Navbar />

      {/* <ThemeToggle /> */}

      {/* 🚀 Section 2: Main Hero Display Canvas Area */}
      <section
        id="workflow"
        className="max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center pt-32 pb-16"
      >
        <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-4 py-1.5 rounded-full border border-brand-primary/20 tracking-wider uppercase mb-6 shadow-sm">
          AI-POWERED LEARNING PLATFORM
        </span>

        <h1 className="text-4xl sm:text-5xl font-black text-text-main tracking-tight max-w-3xl leading-[1.15] mb-6">
          Transforming Classrooms{' '}
          <span className="text-brand-primary drop-shadow-sm">
            with Intelligent Education
          </span>
        </h1>

        <p className="text-base sm:text-lg font-medium text-text-main/70 max-w-2xl leading-relaxed mb-10">
          An AI-powered classroom platform where teachers manage courses, generate quizzes, publish materials, and analyze student progress, while students receive personalized tutoring, summaries, practice quizzes, and study plans—all in one workspace.
        </p>

        {/* ⚡ Matches your exact Navbar invocation syntax and theme override style */}
        <Link href="/login" className="block">
          <AttractButton
            particleCount={20}
            attractRadius={55}
            className="!bg-brand-primary hover:!bg-brand-primary/90 !text-bg-main !border-brand-primary/40 !min-w-64 font-black px-8 py-4 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-brand-primary/10 mb-16 [--primary:var(--color-brand-primary)]"
          >
            ENTER CLASSROOM →
          </AttractButton>
        </Link>
      </section>

      {/* 📊 Section 3: Core Feature Grid Matrix */}
      <section
        id="features"
        className="bg-surface border-y border-surface-border py-20 px-6"
      >
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">
              AI-Powered Learning Features
            </h2>
            <p className="text-sm text-text-main/60 font-medium">
              Everything teachers and students need to create a smarter digital classroom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-4xl mx-auto">
            <div className="bg-surface p-6 rounded-2xl border border-surface-border shadow-sm hover:border-brand-primary/40 transition-all group">
              <div className="text-brand-primary font-bold text-lg mb-2 group-hover:text-brand-primary/80 transition-colors">
                <img width="64" height="64" src="https://img.icons8.com/dusk/64/construction-materials.png" alt="construction-materials" />
                Smart Materials
              </div>
              <p className="text-sm text-text-main/70 font-medium leading-relaxed">
                Upload lecture slides, PDFs, and notes once. AI organizes, indexes, and makes every resource searchable for students.
              </p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-surface-border shadow-sm hover:border-brand-primary/40 transition-all group">
              <div className="text-brand-primary font-bold text-lg mb-2 group-hover:text-brand-primary/80 transition-colors">
                <img width="48" height="48" src="https://img.icons8.com/fluency/48/gemini-ai.png" alt="gemini-ai" />
                AI Teaching Assistant
              </div>
              <p className="text-sm text-text-main/70 font-medium leading-relaxed">
                Generate quizzes, publish announcements, summarize lessons, answer student questions, and automate repetitive classroom tasks.
              </p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-surface-border shadow-sm hover:border-brand-primary/40 transition-all group">
              <div className="text-brand-primary font-bold text-lg mb-2 group-hover:text-brand-primary/80 transition-colors">
                <img width="64" height="64" src="https://img.icons8.com/bubbles/100/learning.png" alt="learning" />
                Learning Analytics
              </div>
              <p className="text-sm text-text-main/70 font-medium leading-relaxed">
                Track student engagement, quiz performance, assignment progress, and identify learners who need extra support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📈 Section 4: Field Metrics / Impact Counter */}
      <section id="workflow" className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-1 p-6 bg-surface rounded-2xl border border-surface-border shadow-sm">
            <span className="text-3xl sm:text-4xl font-black text-text-main">
              24/7


            </span>
            <p className="text-xs font-bold text-text-main/60 uppercase tracking-wider pt-1">
              AI ASSISTANT
            </p>
          </div>
          <div className="space-y-1 p-6 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-sm">
            <span className="text-3xl sm:text-4xl font-black text-brand-primary">
              100+


            </span>
            <p className="text-xs font-bold text-brand-primary/70 uppercase tracking-wider pt-1">
              AUTO-GENERATED QUIZZES
            </p>
          </div>
          <div className="space-y-1 p-6 bg-surface rounded-2xl border border-surface-border shadow-sm">
            <span className="text-3xl sm:text-4xl font-black text-brand-accent">
              Role-Based

            </span>
            <p className="text-xs font-bold text-text-main/60 uppercase tracking-wider pt-1">

              AI AGENTS
            </p>
          </div>
        </div>
      </section>

      {/* 💬 Section 5: Real-World Testimonial Spotlight */}
      <section
        id="security"
        className="bg-surface text-text-main border-t border-surface-border py-20 px-6"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="text-brand-primary font-black text-[10px] tracking-widest uppercase block">
            INSTRUCTOR FEEDBACK
          </span>
          <p className="text-lg sm:text-xl font-medium text-text-main/80 italic leading-relaxed">
            &quot;Preparing quizzes and course announcements used to take hours. Now Edu AI helps me generate learning materials, evaluate progress, and spend more time actually teaching.&quot;
          </p>
          <div>
            <h4 className="font-black text-sm text-text-main">
              Dr. Sarah Ahmed

            </h4>
            <p className="text-[11px] text-text-main/60 font-bold uppercase tracking-wider mt-0.5">
              Assistant Professor
              Department of Software Engineering
            </p>
          </div>
        </div>
      </section>

      <section id="faq">
        <Faq1 />
      </section>

      {/* 📝 Section 7: Core Copyright Base Footer Strip */}
      <footer className="bg-bg-main border-t border-surface-border text-center py-8 text-[11px] font-bold uppercase tracking-wider text-text-main/60 w-full">
        © {new Date().getFullYear()} EduAI Systems. All rights reserved.
        Engineered for frontline community networks.
      </footer>
    </div>
  );
}