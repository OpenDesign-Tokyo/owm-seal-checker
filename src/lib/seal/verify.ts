/**
 * Seal Verification Service
 * 画像の真正性を検証し、seal/resolve API経由で台帳と照合
 */

import { extractSealSignature, calculatePHash } from './extract';
import type { SealRecord, SealStatus } from './types';

// Confidence閾値（DWT用に調整）
// DWT は JPEG 圧縮・スクショ後も 70-85% の検出率
const THRESHOLD_AUTHENTIC = 0.75;
const THRESHOLD_INCONCLUSIVE = 0.40;

const OWM_API_URL = process.env.OWM_API_URL || 'https://open-wardrobe-market.com';
const SEAL_CHECKER_API_KEY = process.env.SEAL_CHECKER_API_KEY;

interface VerifyResult {
  status: SealStatus;
  confidence: number;
  sealId: string | null;
  sealRecord: SealRecord | null;
  displayName: string | null;
}

/**
 * Call seal/resolve API to look up seal and record verification event
 */
async function resolveViaAPI(
  sealId: string,
  eventMetadata: Record<string, unknown>
): Promise<{
  success: boolean;
  seal?: {
    sealId: string;
    userId: string;
    cdnUrl: string;
    r2Path: string;
    modelProvider: string;
    modelName: string | null;
    pipelineMode: string;
    visibility: string;
    revokedAt: string | null;
    createdAt: string;
  };
  creator?: { displayName: string | null; avatarUrl: string | null } | null;
} | null> {
  if (!SEAL_CHECKER_API_KEY) {
    console.error('[seal/verify] SEAL_CHECKER_API_KEY is not configured');
    return null;
  }

  const res = await fetch(`${OWM_API_URL}/api/seal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SEAL_CHECKER_API_KEY,
    },
    body: JSON.stringify({ sealId, recordEvent: eventMetadata }),
  });

  if (!res.ok) return null;
  return res.json();
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

    // 2. pHashも計算
    const pHash = await calculatePHash(imageBuffer);
    console.log('[seal/verify] pHash:', pHash);

    // 3. API経由で台帳検索 + イベント記録
    const result = await resolveViaAPI(extracted.sealId, {
      confidence: extracted.confidence,
      pHash,
      timestamp: new Date().toISOString(),
    });

    if (!result?.success || !result.seal) {
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

    // APIレスポンスからSealRecordを構築
    const seal = result.seal;
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

    // 5. ユーザー情報
    const displayName = (sealRecord.visibility !== 'private' && result.creator?.displayName) || null;

    // 6. 閾値判定
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

export function buildVerifyResponse(result: VerifyResult) {
  const { status, confidence, sealId, sealRecord, displayName } = result;

  let metadata = null;

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
