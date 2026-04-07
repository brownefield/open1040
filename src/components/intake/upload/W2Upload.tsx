'use client';

import { useState, useRef, useCallback } from 'react';
import type { W2Input } from '@/domain/types';
import type { W2ParseResult, OCRProgress } from '@/services/ocr';
import { formatFileSize } from '@/services/ocr';

interface W2UploadProps {
  onFieldsExtracted: (fields: Partial<W2Input>) => void;
  w2Index: number;
}

type UploadStep = 'idle' | 'processing' | 'low_confidence' | 'consent' | 'ai_processing' | 'preview';

export function W2Upload({ onFieldsExtracted, w2Index }: W2UploadProps) {
  const [step, setStep] = useState<UploadStep>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [parseResult, setParseResult] = useState<W2ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
    if (!supportedTypes.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or WebP image of your W-2.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Please use an image under 10MB.');
      return;
    }

    // Start client-side OCR
    setStep('processing');

    try {
      // Dynamic import to keep Tesseract out of initial bundle
      const { ocrW2Image } = await import('@/services/ocr/tesseractService');

      const result = await ocrW2Image(selectedFile, (p) => {
        setProgress(p);
      });

      setParseResult(result);

      if (result.confidence >= 60) {
        // Good enough — show preview
        setStep('preview');
      } else {
        // Low confidence — offer enhanced reader
        setStep('low_confidence');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('Could not read the image. Please try a clearer photo or enter values manually.');
      setStep('idle');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEnhancedReader = async () => {
    if (!file) return;
    setStep('ai_processing');

    try {
      const { aiExtractW2 } = await import('@/services/ocr/aiVisionService');
      const result = await aiExtractW2(file);
      setParseResult(result);
      setStep('preview');
    } catch (err) {
      console.error('AI extraction error:', err);
      setError('Enhanced reader failed. Please enter values manually.');
      setStep('idle');
    }
  };

  const handleAcceptFields = () => {
    if (parseResult?.data) {
      onFieldsExtracted(parseResult.data);
      setStep('idle');
      setFile(null);
      setParseResult(null);
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setFile(null);
    setParseResult(null);
    setProgress(null);
    setError(null);
  };

  // ---- IDLE: Upload zone ----
  if (step === 'idle') {
    return (
      <div className="mb-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-navy-200 rounded-lg p-6 text-center 
                     cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors"
        >
          <div className="text-navy-400 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-navy-600 font-medium">
            Upload a photo of your W-2
          </p>
          <p className="text-xs text-navy-400 mt-1">
            Drag & drop or click · JPG, PNG, WebP · Max 10MB
          </p>
          <p className="text-xs text-navy-300 mt-2">
            Your image is processed in your browser. Nothing is uploaded to a server.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
    );
  }

  // ---- PROCESSING: OCR in progress ----
  if (step === 'processing') {
    return (
      <div className="border border-navy-200 rounded-lg p-6 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-700">
            {progress?.status || 'Processing...'}
          </p>
        </div>
        <div className="w-full bg-navy-100 rounded-full h-1.5">
          <div
            className="bg-navy-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(progress?.progress ?? 0) * 100}%` }}
          />
        </div>
        <p className="text-xs text-navy-400 mt-2">
          Reading {file?.name} ({file ? formatFileSize(file.size) : ''}) — all processing happens in your browser
        </p>
      </div>
    );
  }

  // ---- LOW CONFIDENCE: Offer enhanced reader ----
  if (step === 'low_confidence') {
    return (
      <div className="border border-warm-200 bg-warm-50 rounded-lg p-6 mb-4">
        <h4 className="font-display font-semibold text-navy-800 mb-2">
          We couldn&apos;t read all fields clearly
        </h4>
        <p className="text-sm text-navy-600 mb-2">
          Our in-browser reader extracted {parseResult?.extractedFields.length ?? 0} of 8 fields
          ({parseResult?.confidence ?? 0}% confidence).
          {parseResult?.missingFields && parseResult.missingFields.length > 0 && (
            <span> Missing: {parseResult.missingFields.join(', ')}.</span>
          )}
        </p>

        <div className="bg-white border border-navy-100 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-navy-700 mb-1">
            Try Enhanced Reader?
          </p>
          <p className="text-xs text-navy-500 mb-3">
            This uses an AI service (Claude by Anthropic) to read your W-2 more accurately.
            Your W-2 image will be sent to Anthropic&apos;s servers for processing.
            Anthropic does not store or use your image after processing.
          </p>
          <div className="flex gap-3">
            <button onClick={handleEnhancedReader} className="btn-primary text-sm">
              Yes, use Enhanced Reader
            </button>
            <button
              onClick={() => setStep('preview')}
              className="btn-secondary text-sm"
            >
              No, I&apos;ll fill in the rest manually
            </button>
          </div>
        </div>

        <button onClick={handleCancel} className="text-xs text-navy-400 hover:text-navy-600">
          Cancel upload
        </button>
      </div>
    );
  }

  // ---- CONSENT / AI PROCESSING ----
  if (step === 'ai_processing') {
    return (
      <div className="border border-navy-200 rounded-lg p-6 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-700">
            Enhanced reader is analyzing your W-2...
          </p>
        </div>
        <p className="text-xs text-navy-400">
          Your image is being processed by Claude AI. This usually takes a few seconds.
        </p>
      </div>
    );
  }

  // ---- PREVIEW: Show extracted fields for user review ----
  if (step === 'preview' && parseResult) {
    const d = parseResult.data;
    return (
      <div className="border border-sage-200 bg-sage-50 rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display font-semibold text-navy-800">
            Extracted W-2 Fields
          </h4>
          <span className="text-xs px-2 py-1 rounded-full bg-sage-100 text-sage-700 font-medium">
            {parseResult.confidence}% confidence
          </span>
        </div>

        <p className="text-sm text-navy-600 mb-4">
          Review the values below. Correct anything that looks wrong before accepting.
        </p>

        {parseResult.warnings.length > 0 && (
          <div className="bg-warm-50 border border-warm-200 rounded p-3 mb-4">
            {parseResult.warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-700">⚠ {w}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <FieldPreview label="Employer Name" value={d.employerName} />
          <FieldPreview label="Employer EIN" value={d.employerEin} />
          <FieldPreview label="Box 1 — Wages" value={d.wagesBox1} isCurrency />
          <FieldPreview label="Box 2 — Federal Withheld" value={d.federalWithheldBox2} isCurrency />
          <FieldPreview label="Box 3 — SS Wages" value={d.socialSecurityWagesBox3} isCurrency />
          <FieldPreview label="Box 4 — SS Withheld" value={d.socialSecurityWithheldBox4} isCurrency />
          <FieldPreview label="Box 5 — Medicare Wages" value={d.medicareWagesBox5} isCurrency />
          <FieldPreview label="Box 6 — Medicare Withheld" value={d.medicareWithheldBox6} isCurrency />
        </div>

        {parseResult.missingFields.length > 0 && (
          <p className="text-xs text-navy-400 mb-4">
            Could not extract: {parseResult.missingFields.join(', ')}. You can fill these in manually after accepting.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={handleAcceptFields} className="btn-primary text-sm">
            Accept & Fill Form
          </button>
          <button onClick={handleCancel} className="btn-secondary text-sm">
            Discard & Enter Manually
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function FieldPreview({
  label,
  value,
  isCurrency,
}: {
  label: string;
  value: string | number | undefined;
  isCurrency?: boolean;
}) {
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = hasValue
    ? isCurrency
      ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : String(value)
    : '—';

  return (
    <div className={`px-3 py-2 rounded ${hasValue ? 'bg-white' : 'bg-navy-50'}`}>
      <p className="text-xs text-navy-400">{label}</p>
      <p className={`font-mono text-sm ${hasValue ? 'text-navy-900' : 'text-navy-300'}`}>
        {displayValue}
      </p>
    </div>
  );
}
