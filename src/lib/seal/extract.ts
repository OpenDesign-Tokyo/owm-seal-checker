/**
 * Aether Seal Extraction
 * 画像から不可視署名を抽出する
 *
 * v1: EXIFメタデータから読み取り（後方互換）
 * v2: DWT + Spread Spectrum（Fly.io API経由）
 */

import crypto from 'crypto';
import sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExifParser = require('exif-parser');

// 環境変数
const SEAL_EMBED_KEY = process.env.SEAL_EMBED_KEY || '';
const WATERMARK_API_URL = process.env.WATERMARK_API_URL || 'https://owm-watermark-api.fly.dev';
const WATERMARK_API_KEY = process.env.WATERMARK_API_KEY || '';
const USE_DWT_API = process.env.USE_DWT_API !== 'false'; // デフォルトでDWT API使用

interface ExtractResult {
  sealId: string | null;
  confidence: number;
  raw: Buffer | null;
  version: number | null;
  transforms?: {
    rotationDegrees?: number;
    scaleFactor?: number;
  };
}

/**
 * DWT API を使用して透かしを抽出
 */
async function extractViaDwtApi(imageBuffer: Buffer): Promise<ExtractResult | null> {
  try {
    const response = await fetch(`${WATERMARK_API_URL}/api/v1/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WATERMARK_API_KEY && { 'X-API-Key': WATERMARK_API_KEY }),
      },
      body: JSON.stringify({
        image_base64: imageBuffer.toString('base64'),
      }),
    });

    if (!response.ok) {
      console.warn(`[seal/extract] DWT API error: ${response.status}`);
      return null;
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      console.warn('[seal/extract] DWT API returned unsuccessful result');
      return null;
    }

    const { detected, seal_id, confidence, transforms } = result.data;

    if (!detected || !seal_id) {
      console.log('[seal/extract] DWT API: No watermark detected');
      return {
        sealId: null,
        confidence: 0,
        raw: null,
        version: null,
      };
    }

    console.log(`[seal/extract] DWT extracted: ${seal_id.substring(0, 12)}... (confidence: ${(confidence * 100).toFixed(1)}%)`);

    return {
      sealId: seal_id,
      confidence,
      raw: Buffer.from(seal_id, 'base64'),
      version: 2,
      transforms: transforms ? {
        rotationDegrees: transforms.rotation_degrees,
        scaleFactor: transforms.scale_factor,
      } : undefined,
    };
  } catch (error) {
    console.warn('[seal/extract] DWT API failed:', error);
    return null;
  }
}

/**
 * EXIF メタデータから透かしを抽出（v1 - 後方互換）
 */
async function extractViaExif(imageBuffer: Buffer): Promise<ExtractResult> {
  if (!SEAL_EMBED_KEY) {
    console.warn('[seal/extract] SEAL_EMBED_KEY not configured');
    return { sealId: null, confidence: 0, raw: null, version: null };
  }

  try {
    const metadata = await sharp(imageBuffer).metadata();

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

            console.log(`[seal/extract] EXIF found: ${sealData.owm_seal_id.substring(0, 12)}... (confidence: ${confidence})`);

            return {
              sealId: sealData.owm_seal_id,
              confidence,
              raw: Buffer.from(sealData.owm_seal_id, 'base64'),
              version: sealData.owm_seal_version || 1,
            };
          }
        } catch {
          // JSON parse失敗は無視
        }
      }
    }

    console.log('[seal/extract] No EXIF seal found');
    return { sealId: null, confidence: 0, raw: null, version: null };
  } catch (error) {
    console.error('[seal/extract] EXIF extraction failed:', error);
    return { sealId: null, confidence: 0, raw: null, version: null };
  }
}

/**
 * 画像バッファからシグネチャを抽出
 * DWT API を優先、フォールバックとしてEXIFを使用
 */
export async function extractSealSignature(imageBuffer: Buffer): Promise<ExtractResult> {
  // DWT API を試行
  if (USE_DWT_API) {
    const dwtResult = await extractViaDwtApi(imageBuffer);
    if (dwtResult) {
      // DWT で検出された場合はそのまま返す
      if (dwtResult.sealId) {
        return dwtResult;
      }
      // DWT で検出されなかった場合、EXIF にフォールバック
      console.log('[seal/extract] DWT not detected, trying EXIF fallback...');
    }
  }

  // EXIF フォールバック
  return extractViaExif(imageBuffer);
}

/**
 * 画像からperceptual hashを計算
 * JPEG圧縮・軽微なリサイズに対して耐性がある
 */
export async function calculatePHash(imageBuffer: Buffer): Promise<string> {
  try {
    // 画像を8x8グレースケールにリサイズ
    const resized = await sharp(imageBuffer)
      .greyscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer();

    // 平均値を計算
    const pixels = Array.from(resized);
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;

    // 平均以上なら1、未満なら0のビット列を生成
    let hash = BigInt(0);
    for (let i = 0; i < 64; i++) {
      if (pixels[i] >= avg) {
        hash |= BigInt(1) << BigInt(i);
      }
    }

    return hash.toString(16).padStart(16, '0');
  } catch (error) {
    console.error('[seal/extract] Failed to calculate pHash:', error);
    // フォールバック: SHA256の先頭16文字
    const sha = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    return sha.substring(0, 16);
  }
}
