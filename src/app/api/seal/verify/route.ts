/**
 * POST /api/seal/verify
 * Proxy to the official OWM Aether Seal v3 verifier.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const OWM_API_URL = process.env.OWM_API_URL || 'https://open-wardrobe-market.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let imageBuffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Raw binary body
      const arrayBuffer = await request.arrayBuffer();

      if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400, headers: corsHeaders }
        );
      }

      imageBuffer = Buffer.from(arrayBuffer);
    }

    if (imageBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    const response = await fetch(`${OWM_API_URL}/api/aether/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: imageBuffer.toString('base64'),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Verification failed', details: data.details || null },
        { status: response.status, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[api/seal/verify] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
