'use client';

import { useAppState } from '@/hooks/useAppState';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/components/layout/Landing';
import { EligibilityScreen } from '@/components/eligibility/EligibilityScreen';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { ReviewScreen } from '@/components/review/ReviewScreen';
import { ExportScreen } from '@/components/export/ExportScreen';

export default function Home() {
  const {
    state,
    startFlow,
    submitEligibility,
    submitIntake,
    acknowledgeReview,
    goToStep,
    resetApp,
  } = useAppState();

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentStep={state.currentStep} onReset={resetApp} />

      <main className="flex-1">
        {state.currentStep === 'landing' && <Landing onStart={startFlow} />}

        {state.currentStep === 'eligibility' && (
          <EligibilityScreen onSubmit={submitEligibility} />
        )}

        {state.currentStep === 'intake' && (
          <IntakeForm
            onSubmit={submitIntake}
            existingInput={state.returnInput}
            validationResult={state.validationResult}
          />
        )}

        {state.currentStep === 'review' && state.reviewSummary && (
          <ReviewScreen
            summary={state.reviewSummary}
            onAcknowledge={acknowledgeReview}
            onGoBack={() => goToStep('intake')}
          />
        )}

        {state.currentStep === 'export' && state.reviewSummary && state.returnInput && (
          <ExportScreen
            summary={state.reviewSummary}
            returnInput={state.returnInput}
            onStartOver={resetApp}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
