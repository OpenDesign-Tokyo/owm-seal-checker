/**
 * Certificate Generation & Verification
 * Ed25519署名による証明書の発行と検証
 */

import { importJWK, importPKCS8, importSPKI, exportJWK, CompactSign, compactVerify } from 'jose';
import type { JWK } from 'jose';
import type { AetherSealCertificate, SealRecord } from './types';

const SEAL_SIGNING_PRIVATE_KEY = process.env.SEAL_SIGNING_PRIVATE_KEY || '';
const SEAL_SIGNING_PUBLIC_KEY = process.env.SEAL_SIGNING_PUBLIC_KEY || '';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

async function getPrivateKey(): Promise<CryptoKey> {
  if (privateKey) return privateKey;

  if (!SEAL_SIGNING_PRIVATE_KEY) {
    throw new Error('SEAL_SIGNING_PRIVATE_KEY not configured');
  }

  // PEM形式またはJWK形式をサポート
  if (SEAL_SIGNING_PRIVATE_KEY.startsWith('{')) {
    const jwk = JSON.parse(SEAL_SIGNING_PRIVATE_KEY);
    privateKey = await importJWK(jwk, 'EdDSA') as CryptoKey;
  } else {
    privateKey = await importPKCS8(SEAL_SIGNING_PRIVATE_KEY, 'EdDSA') as CryptoKey;
  }

  return privateKey;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (publicKey) return publicKey;

  if (!SEAL_SIGNING_PUBLIC_KEY) {
    throw new Error('SEAL_SIGNING_PUBLIC_KEY not configured');
  }

  if (SEAL_SIGNING_PUBLIC_KEY.startsWith('{')) {
    const jwk = JSON.parse(SEAL_SIGNING_PUBLIC_KEY);
    publicKey = await importJWK(jwk, 'EdDSA') as CryptoKey;
  } else {
    publicKey = await importSPKI(SEAL_SIGNING_PUBLIC_KEY, 'EdDSA') as CryptoKey;
  }

  return publicKey;
}

export async function getPublicKeyJWK(): Promise<JWK> {
  const key = await getPublicKey();
  return exportJWK(key);
}

interface CreateCertificateParams {
  sealRecord: SealRecord;
  confidence: number;
  displayName: string | null;
}

export async function createSignedCertificate(
  params: CreateCertificateParams
): Promise<{ jws: string; certificate: AetherSealCertificate }> {
  const { sealRecord, confidence, displayName } = params;

  const certificate: AetherSealCertificate = {
    type: 'OWM_AETHER_SEAL_CERT',
    version: 1,
    sealId: sealRecord.seal_id,
    status: 'authentic',
    confidence,
    asset: {
      cdnUrl: sealRecord.cdn_url,
      r2Path: sealRecord.r2_path
    },
    creator: {
      userId: sealRecord.user_id,
      displayName,
      profileUrl: `https://open-wardrobe-market.com/profile/${sealRecord.user_id}`
    },
    provenance: {
      createdAt: sealRecord.created_at,
      modelProvider: sealRecord.model_provider,
      modelName: sealRecord.model_name,
      pipelineMode: sealRecord.pipeline_mode
    },
    revoked: sealRecord.revoked_at !== null,
    issuedAt: new Date().toISOString()
  };

  const key = await getPrivateKey();

  const jws = await new CompactSign(
    new TextEncoder().encode(JSON.stringify(certificate))
  )
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
    .sign(key);

  return { jws, certificate };
}

export async function verifyCertificate(jws: string): Promise<{
  valid: boolean;
  certificate: AetherSealCertificate | null;
}> {
  try {
    const key = await getPublicKey();
    const { payload } = await compactVerify(jws, key);
    const certificate = JSON.parse(
      new TextDecoder().decode(payload)
    ) as AetherSealCertificate;

    return { valid: true, certificate };
  } catch (error) {
    console.error('[seal/certificate] Verification failed:', error);
    return { valid: false, certificate: null };
  }
}
