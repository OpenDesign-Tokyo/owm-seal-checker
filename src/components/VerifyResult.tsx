'use client';

import type { CertificateResponse, VerifyResponse } from '@/lib/seal/types';

interface VerifyResultProps {
  result: VerifyResponse;
  certificate: CertificateResponse | null;
  isLoadingCert: boolean;
  onRequestCertificate: () => void;
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
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getBadgeClass(statusCopy.tone)}`}>
          <svg className={`w-6 h-6 ${accentClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {statusCopy.tone === 'ok' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : statusCopy.tone === 'danger' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            )}
          </svg>
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${accentClass}`}>{statusCopy.title}</h3>
          <p className="text-sm text-[#666666]">{statusCopy.description}</p>
        </div>
      </div>

      <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#222222]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#666666]">{getScoreLabel(result)}</span>
          <span className={`text-sm font-medium ${accentClass}`}>{score}%</span>
        </div>
        <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${scoreBarClass}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-xs text-[#666666] mt-2">
          {statusCopy.tone === 'ok'
            ? '登録済み作品との一致を確認できた画像です。'
            : statusCopy.tone === 'warn'
              ? '一部の一致は確認できています。必要に応じて作品ページもあわせて確認してください。'
              : statusCopy.tone === 'danger'
                ? 'この作品は現在の有効な公開対象ではありません。'
                : '一致する登録記録は確認できませんでした。'}
        </p>
      </div>

      <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3 border border-[#222222]">
        <h4 className="font-medium text-[#E0E0E0]">確認の概要</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#666666]">判定状態</span>
            <span className="text-right text-[#E0E0E0]">{statusCopy.title}</span>
          </div>
          {confidenceLabel && (
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">信頼度</span>
              <span className="text-right text-[#E0E0E0]">{confidenceLabel}</span>
            </div>
          )}
          {lineageLabel && (
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">系譜情報</span>
              <span className="text-right text-[#E0E0E0]">{lineageLabel}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-[#666666] pt-2 border-t border-[#222222]">
          画像内の登録シールと OWM の登録台帳、公開情報を照合して確認しています。
        </p>
      </div>

      <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3 border border-[#222222]">
        <h4 className="font-medium text-[#E0E0E0]">登録情報</h4>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#666666]">クリエイター</span>
            <span className="text-right text-[#E0E0E0]">{creatorName}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-[#666666]">作品名</span>
            <span className="text-right text-[#E0E0E0]">{design?.title || '未設定'}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-[#666666]">登録日</span>
            <span className="text-right text-[#E0E0E0]">{formatDate(seal?.created_at) || '未確認'}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-[#666666]">登録番号</span>
            <span className="text-right text-[#E0E0E0] font-mono text-xs">
              {seal?.id ? `${seal.id.slice(0, 12)}...` : '未確認'}
            </span>
          </div>

          {modeLabel && (
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">制作モード</span>
              <span className="text-right text-[#E0E0E0]">{modeLabel}</span>
            </div>
          )}

          {(seal?.model_provider || seal?.model_name) && (
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">生成情報</span>
              <span className="text-right text-[#E0E0E0]">
                {[seal?.model_provider, seal?.model_name].filter(Boolean).join(' / ')}
              </span>
            </div>
          )}

          {licenseLabel && (
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">利用条件</span>
              <span className="text-right text-[#E0E0E0]">{licenseLabel}</span>
            </div>
          )}
        </div>

        {licenseLabel && (
          <p className="text-xs text-[#666666] pt-2 border-t border-[#222222]">
            詳細な利用条件は OWM 上の作品ページで確認してください。
          </p>
        )}
      </div>

      {canIssueCertificate && !certificate && (
        <button
          onClick={onRequestCertificate}
          disabled={isLoadingCert}
          className="w-full py-3 px-4 bg-[#4ECDC4] hover:bg-[#3dbdb5] disabled:bg-[#4ECDC4]/50 text-[#050505] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoadingCert ? (
            <>
              <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
              証明書を発行しています…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              証明書を発行する
            </>
          )}
        </button>
      )}

      {certificate && (
        <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#1B2A2E] rounded-xl p-5 border border-[#4ECDC4]/30">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h4 className="font-semibold text-[#4ECDC4]">OWM 登録証明書</h4>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">発行日時</span>
              <span className="text-right text-[#E0E0E0]">
                {formatDate(certificate.certificate.issuedAt, true) || '未確認'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">登録番号</span>
              <span className="text-right text-[#E0E0E0] font-mono text-xs">
                {certificate.certificate.sealId}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">クリエイター</span>
              <span className="text-right text-[#E0E0E0]">
                {certificate.certificate.creator.displayName || creatorName}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#666666]">作品状態</span>
              <span className="text-right text-[#E0E0E0]">
                {certificate.certificate.revoked ? '無効' : '有効'}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => downloadCertificate(certificate)}
              className="w-full py-2 px-3 bg-[#4ECDC4] hover:bg-[#3dbdb5] text-[#050505] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              証明書をダウンロード
            </button>
          </div>
        </div>
      )}

      {statusCopy.tone !== 'ok' && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#222222]">
          <h4 className="font-medium text-[#E0E0E0] mb-2">確認のポイント</h4>
          <ul className="text-sm text-[#666666] space-y-1">
            <li>画像を編集・圧縮し直した場合は判定が弱くなることがあります。</li>
            <li>スクリーンショットより、保存した元画像のほうが確認しやすいです。</li>
            <li>気になる場合は OWM 上の作品ページや公開情報もあわせて確認してください。</li>
          </ul>
        </div>
      )}
    </div>
  );
}
