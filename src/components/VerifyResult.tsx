'use client';

import type { VerifyResponse, CertificateResponse } from '@/lib/seal/types';

interface VerifyResultProps {
  result: VerifyResponse;
  onRequestCertificate: () => void;
  certificate: CertificateResponse | null;
  isLoadingCert: boolean;
}

export function VerifyResult({
  result,
  onRequestCertificate,
  certificate,
  isLoadingCert
}: VerifyResultProps) {
  const {
    status,
    confidence = 0,
    matchedByPHash,
    pHashSimilarity,
    creator,
    design,
    license,
    lineage,
    authenticity,
    seal,
    message_ja,
    confidence_bucket,
    reason_codes,
    unsupported_cases,
    lineage_state,
    planner_assessment,
  } = result;

  const isLegacySeal = Boolean(seal?.watermark_version && seal.watermark_version < 2);
  const isV3Seal = Boolean((seal?.watermark_version || 0) >= 2);
  const isSoftLineage = status === 'soft-lineage_only' || lineage_state === 'soft_lineage_only';

  const accent =
    status === 'verified' || status === 'authentic'
      ? 'text-[#4ECDC4]'
      : status === 'likely_verified' || status === 'inconclusive'
        ? 'text-[#FACC15]'
        : isSoftLineage
          ? 'text-[#D0B07A]'
        : status === 'revoked'
          ? 'text-red-500'
          : 'text-[#999999]';

  return (
    <div className="mt-6 space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        {(status === 'authentic' || status === 'verified') && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#4ECDC4]">
                Authentic
              </h3>
              <p className="text-sm text-[#666666]">
                {message_ja || 'OWMで生成・登録された資産です'}
              </p>
            </div>
          </>
        )}

        {(status === 'inconclusive' || status === 'likely_verified' || status === 'tamper_suspected') && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#FACC15]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FACC15]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#FACC15]">
                {status === 'tamper_suspected'
                  ? 'Tamper Suspected'
                  : matchedByPHash
                    ? 'Similar Image Found'
                    : 'Inconclusive'}
              </h3>
              <p className="text-sm text-[#666666]">
                {message_ja ||
                  (matchedByPHash
                    ? `署名は検出できませんでしたが、登録済み画像と${pHashSimilarity?.toFixed(0)}%類似しています`
                    : '追加確認を推奨します')}
              </p>
            </div>
          </>
        )}

        {isSoftLineage && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#D0B07A]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#D0B07A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#D0B07A]">
                Lineage Confirmed
              </h3>
              <p className="text-sm text-[#666666]">
                {message_ja || '強い signal は弱いですが、OWM の登録情報と系譜整合は残っています'}
              </p>
            </div>
          </>
        )}

        {(status === 'not_found' || status === 'unverifiable') && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#666666]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#999999]">
                Not Found
              </h3>
              <p className="text-sm text-[#666666]">
                {message_ja || 'OWMの署名は検出されませんでした'}
              </p>
            </div>
          </>
        )}

        {status === 'revoked' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-500">
                Revoked
              </h3>
              <p className="text-sm text-[#666666]">
                この資産は取り下げられました
              </p>
            </div>
          </>
        )}
      </div>

      {/* Confidence Score */}
      {(confidence > 0 || authenticity) && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#222222]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#666666]">
              {authenticity
                ? isSoftLineage
                  ? 'Lineage Confidence'
                  : 'Authenticity Score'
                : matchedByPHash
                  ? 'Image Similarity'
                  : 'Confidence'}
            </span>
            <span className={`text-sm font-medium ${accent}`}>
              {authenticity ? `${authenticity.score}%` : `${(confidence * 100).toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (authenticity?.score || confidence * 100) >= 85 ? 'bg-[#4ECDC4]' :
                (authenticity?.score || confidence * 100) >= 60 ? 'bg-[#FACC15]' :
                isSoftLineage ? 'bg-[#D0B07A]' :
                status === 'tamper_suspected' ? 'bg-red-500' : 'bg-[#666666]'
              }`}
              style={{ width: `${authenticity?.score || confidence * 100}%` }}
            />
          </div>
          {isLegacySeal ? (
            <p className="text-xs text-[#666666] mt-2">
              これは Aether Seal v3 以前の画像です。現在は台帳と系譜の登録情報を中心に照合しています。
            </p>
          ) : authenticity?.summary ? (
            <p className="text-xs text-[#666666] mt-2">{authenticity.summary}</p>
          ) : matchedByPHash ? (
            <p className="text-xs text-[#666666] mt-2">
              ※ 画像の視覚的類似度に基づく推定です
            </p>
          ) : null}
        </div>
      )}

      {/* Metadata */}
      {(seal || creator || design) && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3 border border-[#222222]">
          <h4 className="font-medium text-[#E0E0E0]">Details</h4>

          {(isLegacySeal || isV3Seal) && (
            <div className={`rounded-lg border px-3 py-2 ${
              isLegacySeal ? 'border-[#3B3124] bg-[#17130E]' : 'border-[#1F2A28] bg-[#0F1514]'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs tracking-[0.22em] text-[#BDB6AD] uppercase">Seal Profile</span>
                <span className={`text-xs font-medium ${
                  isLegacySeal ? 'text-[#D0B07A]' : 'text-[#4ECDC4]'
                }`}>
                  {isLegacySeal ? 'Legacy Seal' : 'Aether Seal v3'}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-[#7F7A73]">
                {isLegacySeal
                  ? '古い画像は registry-backed lineage を中心に検証します。新しい v3 画像ほど多層 signal は返りません。'
                  : 'manifest・planner・lineage を含む Aether Seal v3 の多層検証が利用できます。'}
              </p>
            </div>
          )}

          <div className="grid gap-2 text-sm">
            {creator && (
              <div className="flex justify-between">
                <span className="text-[#666666]">Creator</span>
                <span className="text-[#E0E0E0]">
                  {creator.display_name || creator.username || 'Unknown'}
                </span>
              </div>
            )}

            {seal?.created_at && (
              <div className="flex justify-between">
                <span className="text-[#666666]">Registered</span>
                <span className="text-[#E0E0E0]">
                  {new Date(seal.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {seal?.pipeline_mode && (
              <div className="flex justify-between">
                <span className="text-[#666666]">Pipeline</span>
                <span className="text-[#E0E0E0]">
                  {seal.pipeline_mode}
                </span>
              </div>
            )}

            {design?.title && (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">Design</span>
                <span className="text-right text-[#E0E0E0]">
                  {design.title}
                </span>
              </div>
            )}

            {lineage?.generationNumber ? (
              <div className="flex justify-between">
                <span className="text-[#666666]">Lineage</span>
                <span className="text-[#E0E0E0]">
                  Gen {lineage.generationNumber}
                </span>
              </div>
            ) : null}

            {lineage_state ? (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">Lineage State</span>
                <span className="text-right text-[#E0E0E0]">
                  {lineage_state === 'hard_lineage_confirmed'
                    ? 'Hard lineage confirmed'
                    : lineage_state === 'hard_lineage_degraded'
                      ? 'Hard lineage degraded'
                      : lineage_state === 'soft_lineage_only'
                        ? 'Soft lineage only'
                        : lineage_state === 'lineage_broken'
                          ? 'Lineage broken'
                          : 'Lineage unknown'}
                </span>
              </div>
            ) : null}

            {confidence_bucket ? (
              <div className="flex justify-between">
                <span className="text-[#666666]">Confidence</span>
                <span className="text-[#E0E0E0] capitalize">{confidence_bucket}</span>
              </div>
            ) : null}
          </div>

          {/* License Info */}
          {license?.type && (
            <div className="mt-4 pt-4 border-t border-[#222222]">
              <div className="flex items-center gap-2 mb-2">
                {license.type === 'all_rights_reserved' ? (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${
                  license.type === 'all_rights_reserved' ? 'text-red-400' : 'text-[#4ECDC4]'
                }`}>
                  {license.type}
                </span>
              </div>
              <p className="text-xs text-[#666666]">
                利用条件は OWM 内の表示とライセンス設定に従います。
              </p>
            </div>
          )}

          {authenticity?.factors?.length ? (
            <div className="mt-4 pt-4 border-t border-[#222222] space-y-2">
              <h5 className="text-sm font-medium text-[#E0E0E0]">Verifier Factors</h5>
              <div className="grid gap-2">
                {authenticity.factors
                  .filter((factor) => !(isLegacySeal && ['manifest_payload', 'fragile_digest', 'lineage_continuity'].includes(factor.key) && factor.value === 0))
                  .slice(0, 4)
                  .map((factor) => (
                  <div key={factor.key} className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#BDB6AD]">{factor.label}</span>
                      <span className="text-xs text-[#E0E0E0]">{factor.value}/{factor.max}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-[#7F7A73]">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(planner_assessment || reason_codes?.length || unsupported_cases?.length) ? (
            <div className="mt-4 pt-4 border-t border-[#222222] space-y-3">
              {planner_assessment ? (
                <div>
                  <h5 className="text-sm font-medium text-[#E0E0E0]">Planner Assessment</h5>
                  <p className="mt-1 text-xs text-[#7F7A73]">
                    {planner_assessment.qualityBand || 'unknown'} · {planner_assessment.note || 'region planning quality is included in the audit context'}
                  </p>
                </div>
              ) : null}

              {reason_codes?.length ? (
                <div>
                  <h5 className="text-sm font-medium text-[#E0E0E0]">Reason Codes</h5>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reason_codes.slice(0, 6).map((code) => (
                      <span key={code} className="rounded-full border border-[#2A2A2A] bg-[#111111] px-2.5 py-1 text-[10px] tracking-[0.16em] text-[#BDB6AD] uppercase">
                        {code.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {unsupported_cases?.length ? (
                <div>
                  <h5 className="text-sm font-medium text-[#E0E0E0]">Unsupported Cases</h5>
                  <p className="mt-1 text-xs text-[#7F7A73]">
                    {unsupported_cases.slice(0, 3).join(' / ')}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* Certificate Button */}
      {(status === 'authentic' || status === 'verified') && !certificate && seal?.id && (
        <button
          onClick={onRequestCertificate}
          disabled={isLoadingCert}
          className="w-full py-3 px-4 bg-[#4ECDC4] hover:bg-[#3dbdb5] disabled:bg-[#4ECDC4]/50 text-[#050505] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoadingCert ? (
            <>
              <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Issue Certificate
            </>
          )}
        </button>
      )}

      {/* Certificate Display */}
      {certificate && (
        <CertificateDisplay certificate={certificate} />
      )}
    </div>
  );
}

function CertificateDisplay({ certificate }: { certificate: CertificateResponse }) {
  const downloadCertificate = () => {
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `owm-certificate-${certificate.certificate.sealId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJWS = () => {
    navigator.clipboard.writeText(certificate.jws);
  };

  return (
    <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#8B5CF6]/10 rounded-xl p-5 border border-[#4ECDC4]/30">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h4 className="font-semibold text-[#4ECDC4]">
          OWM Aether Seal Certificate
        </h4>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#666666]">Issued</span>
          <span className="text-[#E0E0E0]">
            {new Date(certificate.certificate.issuedAt).toLocaleString('ja-JP')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666666]">Seal ID</span>
          <span className="text-[#E0E0E0] font-mono text-xs">
            {certificate.certificate.sealId.slice(0, 16)}...
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={downloadCertificate}
          className="flex-1 py-2 px-3 bg-[#4ECDC4] hover:bg-[#3dbdb5] text-[#050505] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          onClick={copyJWS}
          className="py-2 px-3 bg-[#1A1A1A] hover:bg-[#222222] text-[#E0E0E0] text-sm font-medium rounded-lg transition-colors border border-[#333333]"
        >
          Copy JWS
        </button>
      </div>
    </div>
  );
}
