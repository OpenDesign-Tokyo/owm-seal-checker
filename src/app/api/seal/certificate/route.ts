/**
 * POST /api/seal/certificate
 * 署名付き証明書の発行
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createSignedCertificate } from '@/lib/seal/certificate';

export const runtime = 'nodejs';

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

    // 台帳から取得
    const { data: sealRecord, error } = await supabaseAdmin
      .from('owm_seals')
      .select('*')
      .eq('seal_id', sealId)
      .single();

    if (error || !sealRecord) {
      return NextResponse.json(
        { error: 'Seal not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 取り下げチェック
    if (sealRecord.revoked_at) {
      return NextResponse.json(
        { error: 'Seal has been revoked' },
        { status: 410, headers: corsHeaders }
      );
    }

    // 非公開チェック
    if (sealRecord.visibility === 'private') {
      return NextResponse.json(
        { error: 'This seal is private' },
        { status: 403, headers: corsHeaders }
      );
    }

    // ユーザー情報を取得
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('user_id', sealRecord.user_id)
      .single();

    // 証明書発行
    const { jws, certificate } = await createSignedCertificate({
      sealRecord,
      confidence: 0.98, // 証明書発行時は高信頼度
      displayName: profile?.display_name || null
    });

    // イベント記録
    await supabaseAdmin.from('owm_seal_events').insert({
      seal_id: sealId,
      event_type: 'CERT_ISSUED',
      metadata: {
        issuedAt: certificate.issuedAt
      }
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
