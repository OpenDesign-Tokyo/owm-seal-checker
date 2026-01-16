/**
 * Seal Verification Service
 * 画像の真正性を検証し、台帳と照合
 */

import { supabaseAdmin } from '../supabase/client';
import { extractSealSignature, calculatePHash } from './extract';
import type { SealRecord, SealStatus, VerifyResponse, SealMetadata } from './types';

// Confidence閾値
const THRESHOLD_AUTHENTIC = 0.85;
const THRESHOLD_INCONCLUSIVE = 0.5;

interface VerifyResult {
  status: SealStatus;
  confidence: number;
  sealId: string | null;
  sealRecord: SealRecord | null;
  displayName: string | null;
}

export async function verifySeal(imageBuffer: Buffer): Promise<VerifyResult> {
  try {
    // 1. 画像からシグネチャを抽出
    const extracted = await extractSealSignature(imageBuffer);

    if (!extracted.sealId) {
      return {
        status: 'not_found',
        confidence: 0,
        sealId: null,
        sealRecord: null,
        displayName: null
      };
    }

    // 2. pHashも計算（将来的な照合用）
    const pHash = await calculatePHash(imageBuffer);
    console.log('[seal/verify] pHash:', pHash);

    // 3. 台帳から検索
    const { data: sealRecord, error } = await supabaseAdmin
      .from('owm_seals')
      .select('*')
      .eq('seal_id', extracted.sealId)
      .single();

    if (error || !sealRecord) {
      // 台帳に存在しない場合
      if (extracted.confidence >= THRESHOLD_INCONCLUSIVE) {
        return {
          status: 'inconclusive',
          confidence: extracted.confidence,
          sealId: extracted.sealId,
          sealRecord: null,
          displayName: null
        };
      }
      return {
        status: 'not_found',
        confidence: 0,
        sealId: null,
        sealRecord: null,
        displayName: null
      };
    }

    // 4. 取り下げチェック
    if (sealRecord.revoked_at) {
      return {
        status: 'revoked',
        confidence: extracted.confidence,
        sealId: extracted.sealId,
        sealRecord,
        displayName: null
      };
    }

    // 5. ユーザー情報を取得
    let displayName: string | null = null;
    if (sealRecord.visibility !== 'private') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('user_id', sealRecord.user_id)
        .single();

      displayName = profile?.display_name || null;
    }

    // 6. 検証イベントを記録
    await supabaseAdmin.from('owm_seal_events').insert({
      seal_id: extracted.sealId,
      event_type: 'VERIFIED',
      metadata: {
        confidence: extracted.confidence,
        pHash,
        timestamp: new Date().toISOString()
      }
    });

    // 7. 閾値判定
    if (extracted.confidence >= THRESHOLD_AUTHENTIC) {
      return {
        status: 'authentic',
        confidence: extracted.confidence,
        sealId: extracted.sealId,
        sealRecord,
        displayName
      };
    }

    return {
      status: 'inconclusive',
      confidence: extracted.confidence,
      sealId: extracted.sealId,
      sealRecord,
      displayName
    };
  } catch (error) {
    console.error('[seal/verify] Verification failed:', error);
    return {
      status: 'not_found',
      confidence: 0,
      sealId: null,
      sealRecord: null,
      displayName: null
    };
  }
}

export function buildVerifyResponse(result: VerifyResult): VerifyResponse {
  const { status, confidence, sealId, sealRecord, displayName } = result;

  let metadata: SealMetadata | null = null;

  if (sealRecord && sealRecord.visibility !== 'private') {
    metadata = {
      sealId: sealRecord.seal_id,
      createdAt: sealRecord.created_at,
      creator: {
        userId: sealRecord.user_id,
        displayName,
        profileUrl: `https://open-wardrobe-market.com/profile/${sealRecord.user_id}`
      },
      asset: {
        cdnUrl: sealRecord.cdn_url,
        r2Path: sealRecord.r2_path
      },
      provenance: {
        modelProvider: sealRecord.model_provider,
        modelName: sealRecord.model_name,
        pipelineMode: sealRecord.pipeline_mode
      }
    };
  }

  return {
    status,
    confidence,
    sealId,
    metadata
  };
}
