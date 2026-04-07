import { describe, it, expect } from 'vitest';
import { parseW2Text, parseW2FromAIResponse } from '@/services/ocr/w2Parser';

describe('W-2 Text Parser', () => {
  it('extracts fields from well-formatted OCR text', () => {
    const ocrText = `
      W-2 Wage and Tax Statement 2025
      Box b Employer's EIN: 99-1234567
      Box c Employer's name: Pacific Engineering Co
      Box 1 Wages, tips, other compensation: $58,000.00
      Box 2 Federal income tax withheld: $7,200.00
      Box 3 Social security wages: $58,000.00
      Box 4 Social security tax withheld: $3,596.00
      Box 5 Medicare wages and tips: $58,000.00
      Box 6 Medicare tax withheld: $841.00
    `;

    const result = parseW2Text(ocrText);

    expect(result.data.wagesBox1).toBe(58000);
    expect(result.data.federalWithheldBox2).toBe(7200);
    expect(result.data.socialSecurityWagesBox3).toBe(58000);
    expect(result.data.socialSecurityWithheldBox4).toBe(3596);
    expect(result.data.medicareWagesBox5).toBe(58000);
    expect(result.data.medicareWithheldBox6).toBe(841);
    expect(result.data.employerEin).toBe('99-1234567');
    expect(result.confidence).toBeGreaterThanOrEqual(75);
  });

  it('extracts EIN even from messy text', () => {
    const ocrText = `Some random text 12-3456789 more text`;
    const result = parseW2Text(ocrText);
    expect(result.data.employerEin).toBe('12-3456789');
  });

  it('handles missing fields gracefully', () => {
    const ocrText = `Box 1 Wages: $45,000.00`;
    const result = parseW2Text(ocrText);
    expect(result.data.wagesBox1).toBe(45000);
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(50);
  });

  it('returns zero confidence on garbage input', () => {
    const result = parseW2Text('askdjhaksjdh random garbage text 123');
    expect(result.confidence).toBeLessThan(30);
    expect(result.missingFields.length).toBeGreaterThan(5);
  });

  it('warns when withholding exceeds wages', () => {
    const ocrText = `
      Box 1 Wages: $30,000.00
      Box 2 Federal income tax withheld: $50,000.00
    `;
    const result = parseW2Text(ocrText);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('withholding');
  });
});

describe('W-2 AI Response Parser', () => {
  it('parses clean JSON from AI', () => {
    const json = JSON.stringify({
      employerName: 'Acme Corp',
      employerEin: '12-3456789',
      wagesBox1: 65000,
      federalWithheldBox2: 8500,
      socialSecurityWagesBox3: 65000,
      socialSecurityWithheldBox4: 4030,
      medicareWagesBox5: 65000,
      medicareWithheldBox6: 942.5,
    });

    const result = parseW2FromAIResponse(json);

    expect(result.data.employerName).toBe('Acme Corp');
    expect(result.data.wagesBox1).toBe(65000);
    expect(result.data.medicareWithheldBox6).toBe(942.5);
    expect(result.confidence).toBe(100);
    expect(result.missingFields).toHaveLength(0);
  });

  it('handles JSON with markdown fences', () => {
    const json = '```json\n{"wagesBox1": 50000, "federalWithheldBox2": 6000}\n```';
    const result = parseW2FromAIResponse(json);
    expect(result.data.wagesBox1).toBe(50000);
    expect(result.data.federalWithheldBox2).toBe(6000);
  });

  it('handles null values from AI', () => {
    const json = JSON.stringify({
      employerName: 'Test Corp',
      employerEin: null,
      wagesBox1: 40000,
      federalWithheldBox2: null,
      socialSecurityWagesBox3: 40000,
      socialSecurityWithheldBox4: null,
      medicareWagesBox5: 40000,
      medicareWithheldBox6: null,
    });

    const result = parseW2FromAIResponse(json);
    expect(result.data.employerName).toBe('Test Corp');
    expect(result.data.wagesBox1).toBe(40000);
    expect(result.missingFields).toContain('employerEin');
    expect(result.missingFields).toContain('federalWithheldBox2');
    expect(result.confidence).toBeLessThan(100);
  });

  it('returns zero confidence on invalid JSON', () => {
    const result = parseW2FromAIResponse('not valid json at all');
    expect(result.confidence).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('handles dollar signs and commas in string values', () => {
    const json = JSON.stringify({
      wagesBox1: '$55,000.00',
      federalWithheldBox2: '$7,200',
    });
    const result = parseW2FromAIResponse(json);
    expect(result.data.wagesBox1).toBe(55000);
    expect(result.data.federalWithheldBox2).toBe(7200);
  });
});
