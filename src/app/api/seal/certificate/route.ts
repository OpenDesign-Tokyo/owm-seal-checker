/**
 * POST /api/seal/certificate
 * 署名付き証明書の発行
 * seal/resolve API経由でseal情報を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSignedCertificate } from '@/lib/seal/certificate';
import type { SealRecord } from '@/lib/seal/types';

export const runtime = 'nodejs';

const OWM_API_URL = process.env.OWM_API_URL || 'https://open-wardrobe-market.com';
const SEAL_CHECKER_API_KEY = process.env.SEAL_CHECKER_API_KEY;

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
    const body = await request.json();
    const { sealId } = body;

    if (!sealId) {
      return NextResponse.json(
        { error: 'sealId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!SEAL_CHECKER_API_KEY) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503, headers: corsHeaders }
      );
    }

    // seal/resolve API経由でseal情報を取得 + CERT_ISSUEDイベント記録
    const res = await fetch(`${OWM_API_URL}/api/seal/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SEAL_CHECKER_API_KEY,
      },
      body: JSON.stringify({
        sealId,
        recordEvent: { event_type: 'CERT_ISSUED', issuedAt: new Date().toISOString() },
      }),
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 404) {
        return NextResponse.json(
          { error: 'Seal not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { error: 'Failed to resolve seal' },
        { status: status, headers: corsHeaders }
      );
    }

    const result = await res.json();
    if (!result.success || !result.seal) {
      return NextResponse.json(
        { error: 'Seal not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const seal = result.seal;

    // 取り下げチェック
    if (seal.revokedAt) {
      return NextResponse.json(
        { error: 'Seal has been revoked' },
        { status: 410, headers: corsHeaders }
      );
    }

    // 非公開チェック
    if (seal.visibility === 'private') {
      return NextResponse.json(
        { error: 'This seal is private' },
        { status: 403, headers: corsHeaders }
      );
    }

    // SealRecord構築（certificate.tsが要求する型に合わせる）
    const sealRecord: SealRecord = {
      id: '',
      seal_id: seal.sealId,
      watermark_version: 0,
      user_id: seal.userId,
      design_id: null,
      job_id: null,
      session_id: null,
      r2_bucket: '',
      r2_path: seal.r2Path,
      cdn_url: seal.cdnUrl,
      model_provider: seal.modelProvider,
      model_name: seal.modelName,
      pipeline_mode: seal.pipelineMode,
      prompt_hash: null,
      input_hash: null,
      visibility: seal.visibility as 'public' | 'private' | 'unlisted',
      revoked_at: seal.revokedAt,
      created_at: seal.createdAt,
    };

    const displayName = result.creator?.displayName || null;

    // 証明書発行
    const { jws, certificate } = await createSignedCertificate({
      sealRecord,
      confidence: 0.98,
      displayName
    });

    return NextResponse.json(
      { jws, certificate },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[api/seal/certificate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to issue certificate', details: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
