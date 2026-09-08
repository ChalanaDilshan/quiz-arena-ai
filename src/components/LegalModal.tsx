import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export function LegalModal({ isOpen, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-elevated border border-rim/80 rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-rim/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sienna/10 border border-sienna/30 flex items-center justify-center text-sienna">
                {activeTab === 'privacy' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-alabaster tracking-tight">
                  {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
                <p className="text-xs text-smoke">
                  Quiz Arena · Last updated: September 2026
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-ghost !p-2 rounded-xl text-smoke hover:text-alabaster"
              aria-label="Close legal modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="px-6 pt-3 flex gap-2 border-b border-rim/40 bg-canvas/30">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'privacy'
                  ? 'border-sienna text-alabaster'
                  : 'border-transparent text-smoke hover:text-alabaster'
              }`}
            >
              Privacy & Student Data
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'terms'
                  ? 'border-sienna text-alabaster'
                  : 'border-transparent text-smoke hover:text-alabaster'
              }`}
            >
              Terms of Service
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-smoke leading-relaxed">
            {activeTab === 'privacy' ? (
              <>
                {/* Notice Banner */}
                <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-emerald-300">
                    <strong className="block text-emerald-200 font-bold mb-0.5">
                      Student Privacy First (FERPA & COPPA Mindful)
                    </strong>
                    Students join live quiz sessions using only a 6-digit PIN and a temporary nickname. No student emails, account registrations, or permanent tracking are collected from players.
                  </div>
                </div>

                {/* 1. Information We Collect */}
                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-sienna" />
                    1. Information We Collect
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-smoke/90 text-xs">
                    <li>
                      <strong>Host Identity (Google Sign-In):</strong> When a teacher or host signs in with Google, Firebase Authentication provides display name, email address, and avatar URL. We never access passwords or private Google account data.
                    </li>
                    <li>
                      <strong>Student Players:</strong> No accounts required. Participants submit only an ephemeral nickname and game PIN. Responses and scores are stored in active server memory and purged when the session concludes.
                    </li>
                    <li>
                      <strong>Uploaded Documents:</strong> PDF lecture notes and syllabi uploaded by hosts are processed in-memory solely to generate quiz questions via AI. Documents are never sold, indexed, or used to train public LLM models.
                    </li>
                  </ul>
                </div>

                {/* 2. Client-Side Data Storage */}
                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-sienna" />
                    2. Local Client Storage (localStorage)
                  </h4>
                  <p className="text-xs text-smoke/90 mb-2">
                    Quiz history records, saved drafts, and daily login streaks are cached directly within your local browser storage (<code className="text-sienna">qa_history_*</code>, <code className="text-sienna">qa_login_*</code>).
                  </p>
                  <p className="text-xs text-smoke/90">
                    This ensures host records remain private to your local device. You can clear your records at any time from the Admin Dashboard or by clearing your browser cache.
                  </p>
                </div>

                {/* 3. Subprocessors & AI Generation */}
                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    3. AI Services & Subprocessors
                  </h4>
                  <p className="text-xs text-smoke/90">
                    Quiz questions and tutor commentary are processed via enterprise cloud AI endpoints (Amazon Bedrock and Google Cloud). Text snippets sent to these providers are encrypted in transit over HTTPS and handled under zero-data-retention educational policies.
                  </p>
                </div>

                {/* 4. Your Rights & Data Deletion */}
                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    4. Your Rights & Data Deletion
                  </h4>
                  <p className="text-xs text-smoke/90">
                    Hosts may delete any individual quiz session or export session performance reports via CSV at any time from the Admin Dashboard. To disconnect your Google account, simply sign out or revoke permissions in your Google Security settings.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Terms of Service */}
                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    1. Acceptance of Terms
                  </h4>
                  <p className="text-xs text-smoke/90">
                    By accessing or using Quiz Arena, you agree to these Terms of Service. If you are an educator using Quiz Arena on behalf of a school, university, or educational institution, you warrant that you are authorized to administer quizzes for your students.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    2. Acceptable Use
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-smoke/90 text-xs">
                    <li>Quiz Arena is intended for classroom engagement, student learning, and team competitions.</li>
                    <li>Users may not upload materials that contain malicious code, copyright-infringing content, or unlawful speech.</li>
                    <li>Attempts to manipulate live room scoring or inject malicious prompts into AI endpoints are prohibited.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    3. Intellectual Property
                  </h4>
                  <p className="text-xs text-smoke/90">
                    You retain ownership of any course materials or PDFs you upload. Quiz Arena and its developers claim no ownership over your lecture content or custom quiz questions.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-alabaster mb-1.5">
                    4. Disclaimer & Limitation of Liability
                  </h4>
                  <p className="text-xs text-smoke/90">
                    Quiz Arena provides AI-assisted question generation on an "as is" basis. Educators are encouraged to review AI-generated questions prior to classroom match play.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-rim/60 bg-canvas/40 flex items-center justify-between gap-4">
            <span className="text-[11px] text-smoke">
              For privacy inquiries: <span className="text-alabaster font-semibold">hasithadilshanrcc@gmail.com</span>
            </span>
            <button
              onClick={onClose}
              className="btn-primary !py-2 !px-5 text-xs font-bold"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
