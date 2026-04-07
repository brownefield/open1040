// ============================================================
// Open1040 — AI Vision OCR Service (Enhanced Reader)
// Uses Claude Vision API to extract W-2 fields from images.
// Only called with explicit user consent.
//
// PRIVACY NOTE: This sends the W-2 image to Anthropic's API.
// The user must explicitly opt in before this is called.
// ============================================================

import { parseW2FromAIResponse, type W2ParseResult } from './w2Parser';

const W2_EXTRACTION_PROMPT = `You are a precise document reader. Extract the following fields from this W-2 tax form image.

Return ONLY a JSON object with these exact keys (use null for any field you cannot read clearly):

{
  "employerName": "string — employer name from Box c",
  "employerEin": "string — employer EIN from Box b, format XX-XXXXXXX",
  "wagesBox1": number — wages from Box 1,
  "federalWithheldBox2": number — federal tax withheld from Box 2,
  "socialSecurityWagesBox3": number — SS wages from Box 3,
  "socialSecurityWithheldBox4": number — SS tax withheld from Box 4,
  "medicareWagesBox5": number — Medicare wages from Box 5,
  "medicareWithheldBox6": number — Medicare tax withheld from Box 6
}

Rules:
- Return ONLY valid JSON, no other text
- Use numbers without dollar signs or commas
- If a field is blank or unreadable, use null
- Do NOT guess or fabricate values
- Do NOT include any fields beyond the ones listed above`;

/**
 * Send a W-2 image to Claude Vision API for extraction.
 * Requires the user's explicit consent since data leaves the browser.
 */
export async function aiExtractW2(imageFile: File): Promise<W2ParseResult> {
  const base64 = await fileToBase64(imageFile);
  const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

  const response = await fetch('/api/ocr/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mediaType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      data: {},
      confidence: 0,
      extractedFields: [],
      missingFields: [
        'employerName', 'employerEin', 'wagesBox1', 'federalWithheldBox2',
        'socialSecurityWagesBox3', 'socialSecurityWithheldBox4',
        'medicareWagesBox5', 'medicareWithheldBox6',
      ],
      warnings: [`Enhanced reader failed: ${errorText}. Please enter values manually.`],
      rawText: '',
    };
  }

  const result = await response.json();
  return parseW2FromAIResponse(result.extractedText);
}

/**
 * Get the prompt used for AI extraction (for transparency).
 */
export function getExtractionPrompt(): string {
  return W2_EXTRACTION_PROMPT;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
