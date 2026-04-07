'use client';

import { useState } from 'react';
import { APP_NAME, APP_VERSION, DISCLAIMERS, LEGAL_ENTITY, TERMS_OF_SERVICE } from '@/lib/constants';

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="border-t border-navy-100 bg-navy-50 mt-auto" role="contentinfo">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <p className="text-xs text-navy-400 leading-relaxed mb-3">
            {DISCLAIMERS.notTaxAdvice}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-navy-300">
            <span>
              {APP_NAME} v{APP_VERSION} · A{' '}
              <span className="text-navy-400">{LEGAL_ENTITY.name}</span> project · MIT License
            </span>
            <nav className="flex gap-3" aria-label="Legal links">
              <button
                onClick={() => setShowTerms(true)}
                className="hover:text-navy-500 transition-colors underline-offset-2 hover:underline"
              >
                Terms of Use
              </button>
              <button
                onClick={() => setShowPrivacy(true)}
                className="hover:text-navy-500 transition-colors underline-offset-2 hover:underline"
              >
                Privacy
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-navy-500 transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Terms Modal */}
      {showTerms && (
        <Modal title="Terms of Use" onClose={() => setShowTerms(false)}>
          <pre className="whitespace-pre-wrap text-sm text-navy-700 leading-relaxed font-body">
            {TERMS_OF_SERVICE}
          </pre>
        </Modal>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <Modal title="Privacy" onClose={() => setShowPrivacy(false)}>
          <div className="text-sm text-navy-700 leading-relaxed space-y-4">
            <p>{DISCLAIMERS.privacy}</p>
            <div>
              <h3 className="font-semibold text-navy-800 mb-1">What data does {APP_NAME} collect?</h3>
              <p>
                None. In the current version, all data exists only in your browser&apos;s memory.
                When you close the tab, it&apos;s gone. We do not use cookies, analytics,
                tracking pixels, or any form of data collection.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-navy-800 mb-1">What about the AI-powered W-2 reader?</h3>
              <p>
                If you choose to use the optional enhanced W-2 reader, your W-2 image is sent to
                Anthropic&apos;s API for processing. This only happens with your explicit consent.
                The image is used solely to extract text and is not stored by Anthropic after
                processing. The in-browser reader and manual entry do not transmit any data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-navy-800 mb-1">What about SSN?</h3>
              <p>
                {APP_NAME} only asks for the last 4 digits of your Social Security Number, for
                your own reference only. Your full SSN is never requested and never stored anywhere.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-navy-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-navy-600 text-xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
