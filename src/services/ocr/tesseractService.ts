// ============================================================
// Open1040 — Tesseract OCR Service (Client-Side)
// Runs entirely in-browser via WebAssembly.
// No data leaves the user's device.
// ============================================================

import { parseW2Text, type W2ParseResult } from './w2Parser';

export interface OCRProgress {
  status: string;
  progress: number; // 0-1
}

/**
 * Run Tesseract.js OCR on an image file.
 * Loads Tesseract dynamically to avoid bundling it unnecessarily.
 * Returns structured W-2 parse result.
 */
export async function ocrW2Image(
  imageFile: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<W2ParseResult> {
  // Dynamic import — Tesseract.js is only loaded when needed
  const Tesseract = await import('tesseract.js');

  onProgress?.({ status: 'Initializing OCR engine...', progress: 0 });

  const worker = await Tesseract.createWorker('eng', undefined, {
    logger: (m: any) => {
      if (m.status && typeof m.progress === 'number') {
        onProgress?.({
          status: formatStatus(m.status),
          progress: m.progress,
        });
      }
    },
  });

  try {
    onProgress?.({ status: 'Reading your W-2...', progress: 0.3 });

    const { data } = await worker.recognize(imageFile);
    const rawText = data.text;

    onProgress?.({ status: 'Extracting fields...', progress: 0.9 });

    const result = parseW2Text(rawText);

    onProgress?.({ status: 'Done', progress: 1 });

    return result;
  } finally {
    await worker.terminate();
  }
}

/**
 * Check if a file is a supported image type.
 */
export function isSupportedImageType(file: File): boolean {
  const supported = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/gif',
  ];
  return supported.includes(file.type);
}

/**
 * Check if file is a PDF (needs different handling).
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Convert file size to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    'loading tesseract core': 'Loading OCR engine...',
    'initializing tesseract': 'Initializing...',
    'loading language traineddata': 'Loading language data...',
    'initializing api': 'Preparing reader...',
    'recognizing text': 'Reading your W-2...',
  };
  return map[status] || status;
}
