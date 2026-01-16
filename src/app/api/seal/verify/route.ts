/**
 * POST /api/seal/verify
 * 公式検証エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySeal, buildVerifyResponse } from '@/lib/seal/verify';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // 検証実行
    const result = await verifySeal(imageBuffer);
    const response = buildVerifyResponse(result);

    return NextResponse.json(response, {
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
