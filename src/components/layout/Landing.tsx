'use client';

import {
  APP_NAME,
  APP_TAGLINE,
  DISCLAIMERS,
  SUPPORTED_SCENARIOS,
  UNSUPPORTED_SCENARIOS,
  ABOUT_COPY,
  LEGAL_ENTITY,
} from '@/lib/constants';
import { useState } from 'react';

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-10 sm:mb-12">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 bg-navy-800 rounded-2xl flex items-center justify-center mx-auto mb-5"
          aria-hidden="true"
        >
          <span className="text-white font-display font-bold text-xl sm:text-2xl">10</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-3">
          {APP_NAME}
        </h1>
        <p className="text-base sm:text-lg text-navy-500 max-w-lg mx-auto leading-relaxed">
          {APP_TAGLINE}
        </p>
      </div>

      {/* What this is */}
      <section className="card mb-5 sm:mb-6" aria-labelledby="what-this-is">
        <h2 id="what-this-is" className="font-display text-lg sm:text-xl font-semibold text-navy-900 mb-3">
          What this is
        </h2>
        <p className="text-navy-600 leading-relaxed mb-4 text-sm sm:text-base">
          {APP_NAME} is a free, open-source tool that helps you understand and prepare a simple
          federal income tax return. It shows you every calculation, explains every number, and
          never hides anything behind a paywall.
        </p>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Supported scenarios">
          {SUPPORTED_SCENARIOS.map((s) => (
            <span key={s} role="listitem" className="badge-supported">{s}</span>
          ))}
        </div>
      </section>

      {/* What this is NOT */}
      <section className="card mb-5 sm:mb-6" aria-labelledby="what-this-is-not">
        <h2 id="what-this-is-not" className="font-display text-lg sm:text-xl font-semibold text-navy-900 mb-3">
          What this is not
        </h2>
        <p className="text-navy-600 leading-relaxed mb-4 text-sm sm:text-base">
          This tool does not file your return with the IRS. It does not handle complex tax
          situations. If any of the following apply to you, please use a comprehensive tax service
          or consult a professional.
        </p>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Unsupported scenarios">
          {UNSUPPORTED_SCENARIOS.map((s) => (
            <span key={s} role="listitem" className="badge-unsupported">{s}</span>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="disclaimer-box mb-6 sm:mb-8" role="note" aria-label="Important disclaimer">
        <p className="leading-relaxed text-sm">{DISCLAIMERS.primary}</p>
      </div>

      {/* CTA */}
      <div className="text-center mb-10 sm:mb-12">
        <button
          onClick={onStart}
          className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 w-full sm:w-auto"
          aria-label="Start preparing your simple federal tax return"
        >
          Start Simple Return
        </button>
        <p className="text-xs sm:text-sm text-navy-400 mt-3">
          Free forever · No account required · Your data stays in your browser
        </p>
      </div>

      {/* Divider */}
      <hr className="border-navy-100 mb-8" />

      {/* About Section */}
      <section aria-labelledby="about-heading">
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="w-full flex items-center justify-between py-3 text-left group"
          aria-expanded={showAbout}
          aria-controls="about-content"
        >
          <h2 id="about-heading" className="font-display text-lg font-semibold text-navy-800 group-hover:text-navy-600 transition-colors">
            Why is this free?
          </h2>
          <span className="text-navy-400 text-sm" aria-hidden="true">
            {showAbout ? '▲' : '▼'}
          </span>
        </button>

        {showAbout && (
          <div id="about-content" className="pb-8 space-y-5">
            <p className="text-sm sm:text-base text-navy-600 leading-relaxed">
              {ABOUT_COPY.mission}
            </p>

            <div>
              <h3 className="font-display font-semibold text-navy-800 mb-1.5 text-sm sm:text-base">
                No catch. No upsell.
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                {ABOUT_COPY.whyFree}
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-navy-800 mb-1.5 text-sm sm:text-base">
                Who built this
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                {ABOUT_COPY.whoBuiltThis}
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-navy-800 mb-1.5 text-sm sm:text-base">
                What about IRS Direct File?
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                {ABOUT_COPY.directFileNote}
              </p>
            </div>

            <div className="bg-navy-50 rounded-lg p-4">
              <h3 className="font-display font-semibold text-navy-800 mb-1.5 text-sm">
                Support the project
              </h3>
              <p className="text-sm text-navy-500 leading-relaxed">
                {ABOUT_COPY.sustainability}
              </p>
            </div>

            <p className="text-xs text-navy-300">
              A {LEGAL_ENTITY.name} project · Open source under MIT License
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
