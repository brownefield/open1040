// ============================================================
// Open1040 — W-2 Field Parser
// Takes raw OCR text output and attempts to extract structured
// W-2 box values. Works with both Tesseract and AI outputs.
//
// W-2 boxes we care about:
//   Box 1:  Wages, tips, other compensation
//   Box 2:  Federal income tax withheld
//   Box 3:  Social security wages
//   Box 4:  Social security tax withheld
//   Box 5:  Medicare wages and tips
//   Box 6:  Medicare tax withheld
//   Box c:  Employer's name, address
//   Box b:  Employer's EIN
// ============================================================

import type { W2Input } from '@/domain/types';
import { generateId } from '@/lib/utils';

export interface W2ParseResult {
  /** Parsed W-2 data with whatever fields we could extract */
  data: Partial<W2Input>;
  /** Confidence score 0-100 */
  confidence: number;
  /** Fields we successfully extracted */
  extractedFields: string[];
  /** Fields we could not extract */
  missingFields: string[];
  /** Warnings about uncertain values */
  warnings: string[];
  /** Raw text that was parsed */
  rawText: string;
}

const REQUIRED_FIELDS = [
  'employerName',
  'employerEin',
  'wagesBox1',
  'federalWithheldBox2',
  'socialSecurityWagesBox3',
  'socialSecurityWithheldBox4',
  'medicareWagesBox5',
  'medicareWithheldBox6',
] as const;

/**
 * Parse raw OCR text into structured W-2 fields.
 * Uses pattern matching against known W-2 label formats.
 */
export function parseW2Text(rawText: string): W2ParseResult {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  const data: Partial<W2Input> = { id: generateId() };
  const extractedFields: string[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // ---- Extract dollar amounts near box labels ----

  // Box 1 — Wages
  const box1 = extractBoxAmount(text, [
    /(?:box\s*1|wages[,.]?\s*tips|other\s*compensation)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /1\s+wages[^$\d]*\$?([\d,]+\.?\d*)/i,
    /wages\s*\$?([\d,]+\.?\d*)/i,
  ]);
  if (box1 !== null) {
    data.wagesBox1 = box1;
    extractedFields.push('wagesBox1');
  }

  // Box 2 — Federal income tax withheld
  const box2 = extractBoxAmount(text, [
    /(?:box\s*2|federal\s*income\s*tax\s*withheld)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /2\s+federal\s*income\s*tax[^$\d]*\$?([\d,]+\.?\d*)/i,
    /federal\s*(?:income\s*)?tax\s*withheld\s*\$?([\d,]+\.?\d*)/i,
  ]);
  if (box2 !== null) {
    data.federalWithheldBox2 = box2;
    extractedFields.push('federalWithheldBox2');
  }

  // Box 3 — Social security wages
  const box3 = extractBoxAmount(text, [
    /(?:box\s*3|social\s*security\s*wages)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /3\s+social\s*security\s*wages[^$\d]*\$?([\d,]+\.?\d*)/i,
    /social\s*security\s*wages\s*\$?([\d,]+\.?\d*)/i,
  ]);
  if (box3 !== null) {
    data.socialSecurityWagesBox3 = box3;
    extractedFields.push('socialSecurityWagesBox3');
  }

  // Box 4 — Social security tax withheld
  const box4 = extractBoxAmount(text, [
    /(?:box\s*4|social\s*security\s*tax\s*withheld)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /4\s+social\s*security\s*tax[^$\d]*\$?([\d,]+\.?\d*)/i,
    /social\s*security\s*tax\s*withheld\s*\$?([\d,]+\.?\d*)/i,
  ]);
  if (box4 !== null) {
    data.socialSecurityWithheldBox4 = box4;
    extractedFields.push('socialSecurityWithheldBox4');
  }

  // Box 5 — Medicare wages
  const box5 = extractBoxAmount(text, [
    /(?:box\s*5|medicare\s*wages)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /5\s+medicare\s*wages[^$\d]*\$?([\d,]+\.?\d*)/i,
    /medicare\s*wages\s*(?:and\s*tips\s*)?\$?([\d,]+\.?\d*)/i,
  ]);
  if (box5 !== null) {
    data.medicareWagesBox5 = box5;
    extractedFields.push('medicareWagesBox5');
  }

  // Box 6 — Medicare tax withheld
  const box6 = extractBoxAmount(text, [
    /(?:box\s*6|medicare\s*tax\s*withheld)\s*[:\-—]?\s*\$?([\d,]+\.?\d*)/i,
    /6\s+medicare\s*tax[^$\d]*\$?([\d,]+\.?\d*)/i,
    /medicare\s*tax\s*withheld\s*\$?([\d,]+\.?\d*)/i,
  ]);
  if (box6 !== null) {
    data.medicareWithheldBox6 = box6;
    extractedFields.push('medicareWithheldBox6');
  }

  // ---- Employer EIN (Box b) ----
  const einMatch = text.match(/(\d{2}[-–]\d{7})/);
  if (einMatch) {
    data.employerEin = einMatch[1].replace('–', '-');
    extractedFields.push('employerEin');
  }

  // ---- Employer Name (Box c) — heuristic ----
  const namePatterns = [
    /(?:employer'?s?\s*name|box\s*c)\s*[:\-—]?\s*(.+)/i,
    /(?:employer)\s*[:\-—]\s*(.+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().split('\n')[0].trim();
      if (name.length > 2 && name.length < 80) {
        data.employerName = name;
        extractedFields.push('employerName');
        break;
      }
    }
  }

  // ---- Determine missing fields ----
  for (const field of REQUIRED_FIELDS) {
    if (!extractedFields.includes(field)) {
      missingFields.push(field);
    }
  }

  // ---- Sanity warnings ----
  if (data.wagesBox1 !== undefined && data.federalWithheldBox2 !== undefined) {
    if (data.federalWithheldBox2 > data.wagesBox1) {
      warnings.push(
        'Federal withholding appears to exceed wages. Please double-check Boxes 1 and 2.'
      );
    }
  }

  if (data.wagesBox1 !== undefined && data.wagesBox1 > 1_000_000) {
    warnings.push('Wages exceed $1,000,000. Please verify Box 1 was read correctly.');
  }

  // ---- Confidence score ----
  const confidence = Math.round((extractedFields.length / REQUIRED_FIELDS.length) * 100);

  return {
    data,
    confidence,
    extractedFields,
    missingFields,
    warnings,
    rawText,
  };
}

/**
 * Try multiple regex patterns and return the first matched dollar amount.
 */
function extractBoxAmount(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount >= 0) {
        return Math.round(amount * 100) / 100;
      }
    }
  }
  return null;
}

/**
 * Parse structured JSON from AI vision API response.
 * Expects the AI to return a JSON object with W-2 field names.
 */
export function parseW2FromAIResponse(jsonStr: string): W2ParseResult {
  const warnings: string[] = [];
  const extractedFields: string[] = [];
  const missingFields: string[] = [];

  try {
    // Strip markdown code fences if present
    const cleaned = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const data: Partial<W2Input> = { id: generateId() };

    const fieldMap: Record<string, keyof W2Input> = {
      employer_name: 'employerName',
      employerName: 'employerName',
      employer_ein: 'employerEin',
      employerEin: 'employerEin',
      ein: 'employerEin',
      wages_box1: 'wagesBox1',
      wagesBox1: 'wagesBox1',
      box1: 'wagesBox1',
      federal_withheld_box2: 'federalWithheldBox2',
      federalWithheldBox2: 'federalWithheldBox2',
      box2: 'federalWithheldBox2',
      ss_wages_box3: 'socialSecurityWagesBox3',
      socialSecurityWagesBox3: 'socialSecurityWagesBox3',
      box3: 'socialSecurityWagesBox3',
      ss_withheld_box4: 'socialSecurityWithheldBox4',
      socialSecurityWithheldBox4: 'socialSecurityWithheldBox4',
      box4: 'socialSecurityWithheldBox4',
      medicare_wages_box5: 'medicareWagesBox5',
      medicareWagesBox5: 'medicareWagesBox5',
      box5: 'medicareWagesBox5',
      medicare_withheld_box6: 'medicareWithheldBox6',
      medicareWithheldBox6: 'medicareWithheldBox6',
      box6: 'medicareWithheldBox6',
    };

    for (const [sourceKey, targetKey] of Object.entries(fieldMap)) {
      if (parsed[sourceKey] !== undefined && parsed[sourceKey] !== null) {
        const val = parsed[sourceKey];
        if (typeof val === 'string' && ['employerName', 'employerEin'].includes(targetKey)) {
          (data as any)[targetKey] = val;
          extractedFields.push(targetKey);
        } else {
          const num = typeof val === 'string' ? parseFloat(val.replace(/[,$]/g, '')) : Number(val);
          if (!isNaN(num)) {
            (data as any)[targetKey] = Math.round(num * 100) / 100;
            extractedFields.push(targetKey);
          }
        }
      }
    }

    // Deduplicate extracted fields
    const uniqueExtracted = [...new Set(extractedFields)];

    for (const field of REQUIRED_FIELDS) {
      if (!uniqueExtracted.includes(field)) {
        missingFields.push(field);
      }
    }

    const confidence = Math.round((uniqueExtracted.length / REQUIRED_FIELDS.length) * 100);

    return {
      data,
      confidence,
      extractedFields: uniqueExtracted,
      missingFields,
      warnings,
      rawText: jsonStr,
    };
  } catch (err) {
    return {
      data: { id: generateId() },
      confidence: 0,
      extractedFields: [],
      missingFields: [...REQUIRED_FIELDS],
      warnings: ['Failed to parse AI response. Please enter values manually.'],
      rawText: jsonStr,
    };
  }
}
