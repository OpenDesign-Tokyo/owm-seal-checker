/**
 * Aether Seal Extraction
 * 画像から不可視署名を抽出する
 *
 * PoC実装: EXIFメタデータからsealIdを読み取る
 */

import crypto from 'crypto';
import sharp from 'sharp';
import ExifParser from 'exif-parser';

// 環境変数から秘密鍵を取得
const SEAL_EMBED_KEY = process.env.SEAL_EMBED_KEY || '';

/**
 * 画像バッファからシグネチャを抽出
 * EXIFメタデータに埋め込まれたsealIdを読み取る
 */
export async function extractSealSignature(imageBuffer: Buffer): Promise<{
  sealId: string | null;
  confidence: number;
  raw: Buffer | null;
}> {
  if (!SEAL_EMBED_KEY) {
    console.warn('[seal/extract] SEAL_EMBED_KEY not configured');
    return { sealId: null, confidence: 0, raw: null };
  }

  try {
    const metadata = await sharp(imageBuffer).metadata();

    // EXIFからseal情報を読み取り
    if (metadata.exif) {
      const parser = ExifParser.create(imageBuffer);
      const result = parser.parse();

      const description = result.tags?.ImageDescription;
      if (description) {
        try {
          const sealData = JSON.parse(description);
          if (sealData.owm_seal_id) {
            // 署名を検証
            const hmac = crypto.createHmac('sha256', SEAL_EMBED_KEY);
            hmac.update(sealData.owm_seal_id);
            hmac.update(`${metadata.width}x${metadata.height}`);
            const expectedSig = hmac.digest().toString('base64').substring(0, 16);

            const confidence = sealData.owm_seal_sig === expectedSig ? 0.98 : 0.5;

            console.log(`[seal/extract] Found seal: ${sealData.owm_seal_id.substring(0, 12)}... (confidence: ${confidence})`);

            return {
              sealId: sealData.owm_seal_id,
              confidence,
              raw: Buffer.from(sealData.owm_seal_id, 'base64'),
            };
          }
        } catch {
          // JSON parse失敗は無視
        }
      }
    }

    console.log('[seal/extract] No seal found in image');
    return { sealId: null, confidence: 0, raw: null };
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
