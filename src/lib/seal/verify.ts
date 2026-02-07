/**
 * Seal Verification Service
 * 画像の真正性を検証し、seal/resolve API経由で台帳と照合
 */

import { extractSealSignature, calculatePHash } from './extract';
import type { SealRecord, SealStatus, LicenseType } from './types';

// Confidence閾値（DWT用に調整）
// DWT は JPEG 圧縮・スクショ後も 70-85% の検出率
const THRESHOLD_AUTHENTIC = 0.75;
const THRESHOLD_INCONCLUSIVE = 0.40;

const OWM_API_URL = process.env.OWM_API_URL || 'https://open-wardrobe-market.com';
const SEAL_CHECKER_API_KEY = process.env.SEAL_CHECKER_API_KEY;

// pHash similarity threshold (percentage, 0-100)
// 85% = ~10 bits difference out of 64
const PHASH_SIMILARITY_THRESHOLD = 85;

interface VerifyResult {
  status: SealStatus;
  confidence: number;
  sealId: string | null;
  sealRecord: SealRecord | null;
  displayName: string | null;
  licenseType: LicenseType;
  matchedByPHash?: boolean;
  pHashSimilarity?: number;
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
  licenseType?: LicenseType;
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

/**
 * Search for similar images by pHash (fallback when watermark not detected)
 */
async function searchByPHash(
  pHash: string
): Promise<{
  success: boolean;
  found: boolean;
  match?: {
    sealId: string;
    userId: string;
    cdnUrl: string;
    modelProvider: string;
    modelName: string | null;
    pipelineMode: string;
    visibility: string;
    revokedAt: string | null;
    createdAt: string;
  };
  similarity?: {
    hammingDistance: number;
    percentage: number;
  };
  creator?: { displayName: string | null; avatarUrl: string | null } | null;
} | null> {
  if (!SEAL_CHECKER_API_KEY) {
    console.error('[seal/verify] SEAL_CHECKER_API_KEY is not configured');
    return null;
  }

  try {
    const res = await fetch(`${OWM_API_URL}/api/seal/search-phash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SEAL_CHECKER_API_KEY,
      },
      body: JSON.stringify({ pHash }),
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('[seal/verify] pHash search failed:', error);
    return null;
  }
}

export async function verifySeal(imageBuffer: Buffer): Promise<VerifyResult> {
  try {
    // 1. 画像からシグネチャを抽出
    const extracted = await extractSealSignature(imageBuffer);

    // 2. pHashも計算（透かし検出成否に関わらず使用）
    const pHash = await calculatePHash(imageBuffer);
    console.log('[seal/verify] pHash:', pHash);

    // 3. 透かしが検出されなかった場合、pHashでフォールバック検索
    if (!extracted.sealId) {
      console.log('[seal/verify] Watermark not detected, trying pHash search...');

      const pHashResult = await searchByPHash(pHash);

      if (pHashResult?.found && pHashResult.match && pHashResult.similarity) {
        const similarity = pHashResult.similarity.percentage;

        if (similarity >= PHASH_SIMILARITY_THRESHOLD) {
          console.log(`[seal/verify] pHash match found: ${pHashResult.match.sealId.substring(0, 8)}... (${similarity.toFixed(1)}% similar)`);

          const match = pHashResult.match;
          const sealRecord: SealRecord = {
            id: '',
            seal_id: match.sealId,
            watermark_version: 0,
            user_id: match.userId,
            design_id: null,
            job_id: null,
            session_id: null,
            r2_bucket: '',
            r2_path: '',
            cdn_url: match.cdnUrl,
            model_provider: match.modelProvider,
            model_name: match.modelName,
            pipeline_mode: match.pipelineMode,
            prompt_hash: null,
            input_hash: null,
            visibility: match.visibility as 'public' | 'private' | 'unlisted',
            revoked_at: match.revokedAt,
            created_at: match.createdAt,
          };

          const displayName = (sealRecord.visibility !== 'private' && pHashResult.creator?.displayName) || null;

          // pHashマッチはInconclusiveとして返す（透かし自体は検出できなかったため）
          return {
            status: 'inconclusive',
            confidence: similarity / 100, // Convert to 0-1 scale
            sealId: match.sealId,
            sealRecord,
            displayName,
            licenseType: null,
            matchedByPHash: true,
            pHashSimilarity: similarity,
          };
        }
      }

      return {
        status: 'not_found',
        confidence: 0,
        sealId: null,
        sealRecord: null,
        displayName: null,
        licenseType: null
      };
    }

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
          displayName: null,
          licenseType: null
        };
      }
      return {
        status: 'not_found',
        confidence: 0,
        sealId: null,
        sealRecord: null,
        displayName: null,
        licenseType: null
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

    // Get license type from API response
    const licenseType = result.licenseType || null;

    // 4. 取り下げチェック
    if (sealRecord.revoked_at) {
      return {
        status: 'revoked',
        confidence: extracted.confidence,
        sealId: extracted.sealId,
        sealRecord,
        displayName: null,
        licenseType
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
        displayName,
        licenseType
      };
    }

    return {
      status: 'inconclusive',
      confidence: extracted.confidence,
      sealId: extracted.sealId,
      sealRecord,
      displayName,
      licenseType
    };
  } catch (error) {
    console.error('[seal/verify] Verification failed:', error);
    return {
      status: 'not_found',
      confidence: 0,
      sealId: null,
      sealRecord: null,
      displayName: null,
      licenseType: null
    };
  }
}

// License type labels and descriptions
const LICENSE_INFO: Record<string, { label: string; description: string }> = {
  standard: {
    label: 'Standard License',
    description: 'Commercial use allowed with attribution'
  },
  cc_by: {
    label: 'CC BY（表示）',
    description: 'Creative Commons Attribution - 表示をすれば商用利用可能'
  },
  cc_by_nc: {
    label: 'CC BY-NC（非商用）',
    description: 'Creative Commons Attribution-NonCommercial - 非商用のみ'
  },
  all_rights_reserved: {
    label: 'All Rights Reserved',
    description: '閲覧のみ許可 - 購入・複製不可'
  }
};

export function buildVerifyResponse(result: VerifyResult) {
  const { status, confidence, sealId, sealRecord, displayName, licenseType, matchedByPHash, pHashSimilarity } = result;

  let metadata = null;

  if (sealRecord && sealRecord.visibility !== 'private') {
    // Build license info
    let license = null;
    if (licenseType) {
      const info = LICENSE_INFO[licenseType];
      if (info) {
        license = {
          type: licenseType,
          label: info.label,
          description: info.description
        };
      }
    }

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
      },
      license
    };
  }

  return {
    status,
    confidence,
    sealId,
    metadata,
    ...(matchedByPHash && { matchedByPHash, pHashSimilarity }),
  };
}
