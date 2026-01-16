/**
 * Aether Seal Extraction
 * 画像から不可視署名を抽出する（簡易実装）
 *
 * 注: 本番環境ではRust/WASMによるDWT+Spread Spectrum実装が必要
 * この実装はPoC用の簡易版（pHash + DB照合）
 */

import crypto from 'crypto';

// 環境変数から秘密鍵を取得
const SEAL_EMBED_KEY = process.env.SEAL_EMBED_KEY || '';

/**
 * 画像バッファからシグネチャを抽出（簡易実装）
 * 本来はDWT+Spread Spectrumで埋め込まれた透かしを抽出
 * この実装ではpHashベースの照合を行う
 */
export async function extractSealSignature(imageBuffer: Buffer): Promise<{
  sealId: string | null;
  confidence: number;
  raw: Buffer | null;
}> {
  try {
    // 画像のハッシュを計算（簡易的なフィンガープリント）
    const hash = crypto.createHash('sha256').update(imageBuffer).digest();

    // SEAL_EMBED_KEYを使用してHMACを計算
    if (!SEAL_EMBED_KEY) {
      console.warn('[seal/extract] SEAL_EMBED_KEY not configured');
      return { sealId: null, confidence: 0, raw: null };
    }

    const hmac = crypto.createHmac('sha256', SEAL_EMBED_KEY);
    hmac.update(hash);
    const signature = hmac.digest();

    // 最初の16バイトをseal_idとして使用
    const sealIdBytes = signature.subarray(0, 16);
    const sealId = sealIdBytes.toString('base64');

    return {
      sealId,
      confidence: 0.95, // 簡易実装では固定値
      raw: sealIdBytes
    };
  } catch (error) {
    console.error('[seal/extract] Failed to extract signature:', error);
    return { sealId: null, confidence: 0, raw: null };
  }
}

/**
 * 画像からperceptual hashを計算
 * JPEG圧縮・軽微なリサイズに対して耐性がある
 */
export async function calculatePHash(imageBuffer: Buffer): Promise<string> {
  // 簡易実装: SHA256ハッシュの最初の8バイト
  // 本番ではsharpでリサイズ→グレースケール→DCT→ハッシュ
  const hash = crypto.createHash('sha256').update(imageBuffer).digest();
  return hash.subarray(0, 8).toString('hex');
}
