/**
 * Aether Seal Types
 * OWM証明システムの型定義
 */

export type SealStatus = 'authentic' | 'inconclusive' | 'not_found' | 'revoked';

export type LicenseType = 'standard' | 'cc_by' | 'cc_by_nc' | 'all_rights_reserved' | null;

export interface SealMetadata {
  sealId: string;
  createdAt: string;
  creator: {
    userId: string;
    displayName: string | null;
    profileUrl: string | null;
  };
  asset: {
    cdnUrl: string;
    r2Path: string;
  };
  provenance: {
    modelProvider: string;
    modelName: string | null;
    pipelineMode: string;
  };
  license: {
    type: LicenseType;
    label: string;
    description: string;
  } | null;
}

export interface VerifyResponse {
  status: SealStatus;
  confidence: number;
  sealId: string | null;
  metadata: SealMetadata | null;
}

export interface AetherSealCertificate {
  type: 'OWM_AETHER_SEAL_CERT';
  version: number;
  sealId: string;
  status: 'authentic';
  confidence: number;
  asset: {
    cdnUrl: string;
    r2Path: string;
  };
  creator: {
    userId: string;
    displayName: string | null;
    profileUrl: string | null;
  };
  provenance: {
    createdAt: string;
    modelProvider: string;
    modelName: string | null;
    pipelineMode: string;
  };
  revoked: boolean;
  issuedAt: string;
}

export interface CertificateResponse {
  jws: string;
  certificate: AetherSealCertificate;
}

export interface SealRecord {
  id: string;
  seal_id: string;
  watermark_version: number;
  user_id: string;
  design_id: string | null;
  job_id: string | null;
  session_id: string | null;
  r2_bucket: string;
  r2_path: string;
  cdn_url: string;
  model_provider: string;
  model_name: string | null;
  pipeline_mode: string;
  prompt_hash: string | null;
  input_hash: string | null;
  visibility: 'public' | 'private' | 'unlisted';
  revoked_at: string | null;
  created_at: string;
}
