/**
 * Aether Seal Types
 * OWM証明システムの型定義
 */

export type SealStatus =
  | 'authentic'
  | 'inconclusive'
  | 'not_found'
  | 'revoked'
  | 'verified'
  | 'likely_verified'
  | 'soft-lineage_only'
  | 'tamper_suspected'
  | 'unverifiable';

export type LicenseType = 'standard' | 'cc_by' | 'cc_by_nc' | 'all_rights_reserved' | null;

export interface AuthenticityFactor {
  key: string;
  label: string;
  value: number;
  max: number;
  detail: string;
}

export interface AuthenticityReport {
  status: 'verified' | 'likely_verified' | 'tamper_suspected' | 'revoked' | 'soft-lineage_only' | 'unverifiable';
  score: number;
  summary: string;
  factors: AuthenticityFactor[];
}

export interface PlannerAssessment {
  plannerVersion?: string;
  qualityBand?: 'strong' | 'balanced' | 'weak' | 'unknown';
  preferredZoneCount?: number;
  candidateCount?: number;
  protectedCoverageRatio?: number;
  averageContrast?: number;
  averageEdgeDensity?: number;
  note?: string;
}

export interface VerifyResponse {
  verified: boolean;
  success?: boolean;
  status: SealStatus;
  message?: string;
  message_ja?: string;
  pHash?: string;
  confidence?: number;
  matchedByPHash?: boolean;
  pHashSimilarity?: number | null;
  pHashDistance?: number | null;
  seal?: {
    id: string;
    confidence: number;
    created_at: string;
    pipeline_mode: string;
    model_provider: string;
    model_name?: string | null;
    watermark_version?: number | null;
    manifest_version?: number | null;
    authenticity_score?: number | null;
    verifier_summary?: string | null;
  } | null;
  design?: {
    id: string | null;
    title: string | null;
    image_url: string | null;
  } | null;
  creator?: {
    user_id: string;
    display_name: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  license?: {
    type: LicenseType | string;
  } | null;
  lineage?: {
    rootSealId?: string;
    generationNumber?: number;
    ancestorCount?: number;
    descendantCount?: number;
  } | null;
  authenticity?: AuthenticityReport | null;
  confidence_bucket?: 'high' | 'medium' | 'low' | 'none' | null;
  reason_codes?: string[] | null;
  unsupported_cases?: string[] | null;
  lineage_state?: 'hard_lineage_confirmed' | 'hard_lineage_degraded' | 'soft_lineage_only' | 'lineage_broken' | 'lineage_unknown' | null;
  planner_assessment?: PlannerAssessment | null;
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
    username: string | null;
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
