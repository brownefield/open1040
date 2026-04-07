// ============================================================
// Open1040 — API Route: /api/ocr/extract
// Server-side proxy for Claude Vision API.
// Only called when user explicitly consents to enhanced reader.
//
// IMPORTANT: Requires ANTHROPIC_API_KEY environment variable.
// The W-2 image is sent to Anthropic's API and is subject to
// Anthropic's data handling policies.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const EXTRACTION_PROMPT = `You are a precise document reader. Extract the following fields from this W-2 tax form image.

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
- Do NOT guess or fabricate values`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Enhanced reader is not configured. ANTHROPIC_API_KEY is missing.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: 'Missing image data or media type.' },
        { status: 400 }
      );
    }

    // Validate media type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${mediaType}` },
        { status: 400 }
      );
    }

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: image,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Claude API error:', response.status, errorBody);
      return NextResponse.json(
        { error: 'Enhanced reader encountered an error. Please try again or enter values manually.' },
        { status: 502 }
      );
    }

    const result = await response.json();
    const extractedText = result.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    return NextResponse.json({ extractedText });
  } catch (err) {
    console.error('OCR extraction error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during extraction.' },
      { status: 500 }
    );
  }
}
