/**
 * GET /api/seal/public-key
 * 公開鍵の配布
 */

import { NextResponse } from 'next/server';
import { getPublicKeyJWK } from '@/lib/seal/certificate';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=86400' // 24時間キャッシュ
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const jwk = await getPublicKeyJWK();

    return NextResponse.json(jwk, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[api/seal/public-key] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get public key' },
      { status: 500, headers: corsHeaders }
    );
  }
}
