'use client';

import type { CertificateResponse, VerifyResponse } from '@/lib/seal/types';

interface VerifyResultProps {
  result: VerifyResponse;
  certificate: CertificateResponse | null;
  isLoadingCert: boolean;
  onRequestCertificate: () => void;
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-black/15 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#6F6F6F]">{label}</p>
      <p className={`mt-1 break-words leading-6 text-[#EFEFEF] ${mono ? 'font-mono text-xs sm:text-sm' : 'text-sm sm:text-[15px]'}`}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value?: string | null, withTime = false): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString(
    'ja-JP',
    withTime
      ? {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
  );
}

function getStatusCopy(result: VerifyResponse) {
  if (result.status === 'authentic' || result.status === 'verified') {
    return {
      title: '確認できました',
      description: 'この画像は OWM の登録情報と一致しました。',
      tone: 'ok',
    } as const;
  }

  if (result.status === 'revoked') {
    return {
      title: '現在は無効です',
      description: 'この作品は現在の公開対象ではありません。',
      tone: 'danger',
    } as const;
  }

  if (
    result.status === 'likely_verified' ||
    result.status === 'inconclusive' ||
    result.status === 'tamper_suspected' ||
    result.status === 'soft-lineage_only'
  ) {
    return {
      title: '追加確認が必要です',
      description: '一致する情報はありますが、最終判断には追加確認をおすすめします。',
      tone: 'warn',
    } as const;
  }

  return {
    title: '見つかりませんでした',
    description: 'この画像に一致する登録情報は確認できませんでした。',
    tone: 'neutral',
  } as const;
}

function getScoreLabel(result: VerifyResponse): string {
  return result.matchedByPHash ? '参考スコア' : '確認スコア';
}

function getAccentClass(tone: 'ok' | 'warn' | 'danger' | 'neutral') {
  if (tone === 'ok') return 'text-[#4ECDC4]';
  if (tone === 'warn') return 'text-[#FACC15]';
  if (tone === 'danger') return 'text-red-400';
  return 'text-[#999999]';
}

function getBadgeClass(tone: 'ok' | 'warn' | 'danger' | 'neutral') {
  if (tone === 'ok') return 'bg-[#4ECDC4]/10';
  if (tone === 'warn') return 'bg-[#FACC15]/10';
  if (tone === 'danger') return 'bg-red-500/10';
  return 'bg-[#666666]/10';
}

function getScoreBarClass(score: number, tone: 'ok' | 'warn' | 'danger' | 'neutral') {
  if (score >= 85) return 'bg-[#4ECDC4]';
  if (score >= 60) return 'bg-[#FACC15]';
  if (tone === 'danger') return 'bg-red-400';
  return 'bg-[#666666]';
}

function getCreatorName(result: VerifyResponse, certificate: CertificateResponse | null): string {
  return (
    result.creator?.display_name ||
    result.creator?.username ||
    certificate?.certificate.creator.displayName ||
    certificate?.certificate.creator.username ||
    '非公開または未設定'
  );
}

function getLicenseLabel(type?: string | null): string | null {
  if (!type) return null;
  if (type === 'all_rights_reserved') return '権利保護あり';
  if (type === 'cc_by') return '表示付き利用可';
  if (type === 'cc_by_nc') return '非営利利用可';
  if (type === 'standard') return 'OWM 標準条件';
  return 'ライセンス設定あり';
}

function getModeLabel(mode?: string | null): string | null {
  if (!mode) return null;
  if (mode === 'FUSION') return 'FUSION';
  if (mode === 'REMIX') return 'REMIX';
  if (mode === 'COLLAB') return 'COLLAB';
  if (mode === 'COMPOSER') return 'COMPOSER';
  if (mode === 'REFINE') return 'REFINE';
  if (mode === 'NANO') return 'NANO';
  return mode;
}

function getLineageLabel(result: VerifyResponse): string | null {
  if (typeof result.lineage?.generationNumber === 'number') {
    return `第${result.lineage.generationNumber}世代`;
  }

  if (result.lineage_state === 'hard_lineage_confirmed') return '系譜確認済み';
  if (result.lineage_state === 'hard_lineage_degraded') return '系譜あり';
  if (result.lineage_state === 'soft_lineage_only') return '補助的な系譜情報あり';
  if (result.lineage_state === 'lineage_broken') return '系譜不一致';
  if (result.lineage_state === 'lineage_unknown') return '系譜情報なし';
  return null;
}

function getConfidenceLabel(bucket?: VerifyResponse['confidence_bucket']): string | null {
  if (!bucket) return null;
  if (bucket === 'high') return '高';
  if (bucket === 'medium') return '中';
  if (bucket === 'low') return '低';
  if (bucket === 'none') return 'なし';
  return null;
}

function downloadCertificate(certificate: CertificateResponse) {
  const blob = new Blob([JSON.stringify(certificate, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `owm-certificate-${certificate.certificate.sealId.slice(0, 8)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function VerifyResult({
  result,
  certificate,
  isLoadingCert,
  onRequestCertificate,
}: VerifyResultProps) {
  const { design, license, seal, authenticity } = result;
  const statusCopy = getStatusCopy(result);
  const score = authenticity?.score ?? Math.round((result.confidence || 0) * 100);
  const accentClass = getAccentClass(statusCopy.tone);
  const scoreBarClass = getScoreBarClass(score, statusCopy.tone);
  const creatorName = getCreatorName(result, certificate);
  const licenseLabel = getLicenseLabel(license?.type ?? null);
  const modeLabel = getModeLabel(seal?.pipeline_mode ?? null);
  const lineageLabel = getLineageLabel(result);
  const confidenceLabel = getConfidenceLabel(result.confidence_bucket);
  const canIssueCertificate =
    (result.status === 'authentic' || result.status === 'verified') && Boolean(seal?.id);

  return (
    <div className="mt-6 space-y-4">
      <div className="owm-card rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getBadgeClass(statusCopy.tone)} sm:h-14 sm:w-14`}>
              <svg className={`h-6 w-6 ${accentClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {statusCopy.tone === 'ok' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : statusCopy.tone === 'danger' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                )}
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6C6C6C]">Verification</p>
              <h3 className={`text-2xl font-semibold tracking-[-0.03em] ${accentClass} sm:text-[32px]`}>
                {statusCopy.title}
              </h3>
              <p className="max-w-xl text-sm leading-6 text-[#8A8A8A] sm:text-base">
                {statusCopy.description}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/25 px-4 py-4 sm:min-w-[220px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6C6C6C]">{getScoreLabel(result)}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <span className={`text-4xl font-semibold tracking-[-0.04em] ${accentClass}`}>{score}</span>
              <span className="pb-1 text-sm text-[#8B8B8B]">/ 100</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#191919]">
              <div className={`h-full rounded-full transition-all ${scoreBarClass}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="owm-card rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6C6C6C]">Summary</p>
              <h4 className="mt-1 text-lg font-semibold text-[#F1F1F1] sm:text-xl">確認の概要</h4>
            </div>
            {confidenceLabel && (
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[#C9C9C9]">
                信頼度 {confidenceLabel}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="判定状態" value={statusCopy.title} />
            <InfoRow label="系譜情報" value={lineageLabel || '系譜情報なし'} />
            <InfoRow label="確認スコア" value={`${score}%`} />
            <InfoRow label="証明書" value={canIssueCertificate ? '発行可能' : '対象外'} />
          </div>

          <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-7 text-[#8A8A8A]">
            画像内の登録シールと OWM の登録台帳、公開情報を照合して確認しています。
          </p>
        </div>

        <div className="owm-card rounded-[28px] p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6C6C6C]">Registry</p>
            <h4 className="mt-1 text-lg font-semibold text-[#F1F1F1] sm:text-xl">登録情報</h4>
          </div>

          <div className="grid gap-3">
            <InfoRow label="クリエイター" value={creatorName} />
            <InfoRow label="作品名" value={design?.title || '未設定'} />
            <InfoRow label="登録日" value={formatDate(seal?.created_at) || '未確認'} />
            <InfoRow label="登録番号" value={seal?.id ? `${seal.id.slice(0, 12)}...` : '未確認'} mono />
            {modeLabel && <InfoRow label="制作モード" value={modeLabel} />}
            {licenseLabel && <InfoRow label="利用条件" value={licenseLabel} />}
          </div>

          {licenseLabel && (
            <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-7 text-[#8A8A8A]">
              詳細な利用条件は OWM 上の作品ページで確認してください。
            </p>
          )}
        </div>
      </div>

      {canIssueCertificate && !certificate && (
        <button
          onClick={onRequestCertificate}
          disabled={isLoadingCert}
          className="owm-card flex w-full items-center justify-center gap-3 rounded-[24px] px-5 py-4 text-sm font-medium text-[#F3F3F3] transition-colors hover:border-[#4ECDC4]/40 disabled:opacity-60 sm:text-base"
        >
          {isLoadingCert ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-[#4ECDC4] border-t-transparent animate-spin" />
              証明書を発行しています…
            </>
          ) : (
            <>
              <div className="owm-gradient flex h-9 w-9 items-center justify-center rounded-full">
                <svg className="w-4 h-4 text-[#050505]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              証明書を発行する
            </>
          )}
        </button>
      )}

      {certificate && (
        <div className="owm-card overflow-hidden rounded-[28px]">
          <div className="bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(78,205,196,0.14))] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="owm-gradient flex h-11 w-11 items-center justify-center rounded-2xl">
                <svg className="w-5 h-5 text-[#050505]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E8E8E]">Certificate</p>
                <h4 className="mt-1 text-lg font-semibold text-[#F2F2F2] sm:text-xl">OWM 登録証明書</h4>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="発行日時" value={formatDate(certificate.certificate.issuedAt, true) || '未確認'} />
              <InfoRow label="作品状態" value={certificate.certificate.revoked ? '無効' : '有効'} />
              <InfoRow label="クリエイター" value={certificate.certificate.creator.displayName || certificate.certificate.creator.username || creatorName} />
              <InfoRow label="登録番号" value={certificate.certificate.sealId} mono />
            </div>

            <div className="mt-5">
              <button
                onClick={() => downloadCertificate(certificate)}
                className="owm-gradient flex w-full items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-medium text-[#050505] transition-transform hover:scale-[1.01] sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                証明書をダウンロード
              </button>
            </div>
          </div>
        </div>
      )}

      {statusCopy.tone !== 'ok' && (
        <div className="owm-card rounded-[24px] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6C6C6C]">Notes</p>
          <h4 className="mt-1 text-lg font-semibold text-[#F1F1F1]">確認のポイント</h4>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[#8A8A8A]">
            <li>画像を編集・圧縮し直した場合は判定が弱くなることがあります。</li>
            <li>スクリーンショットより、保存した元画像のほうが確認しやすいです。</li>
            <li>気になる場合は OWM 上の作品ページや公開情報もあわせて確認してください。</li>
          </ul>
        </div>
      )}
    </div>
  );
}
