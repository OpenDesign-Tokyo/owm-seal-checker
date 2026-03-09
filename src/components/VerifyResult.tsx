'use client';

import type { VerifyResponse } from '@/lib/seal/types';

interface VerifyResultProps {
  result: VerifyResponse;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusCopy(result: VerifyResponse) {
  const { status, message_ja, matchedByPHash, pHashSimilarity } = result;

  if (status === 'authentic' || status === 'verified') {
    return {
      title: '確認できました',
      description: message_ja || 'この画像は OWM の登録情報と一致しました。',
      tone: 'ok',
    } as const;
  }

  if (status === 'revoked') {
    return {
      title: '現在は無効です',
      description: 'この作品は公開停止または取り下げ済みです。',
      tone: 'danger',
    } as const;
  }

  if (status === 'likely_verified' || status === 'inconclusive' || status === 'tamper_suspected' || status === 'soft-lineage_only') {
    return {
      title: '追加確認が必要です',
      description: message_ja || (
        matchedByPHash
          ? `登録済みの作品と近い画像が見つかりました${typeof pHashSimilarity === 'number' ? `（類似度 ${pHashSimilarity.toFixed(0)}%）` : ''}。`
          : '一致の可能性はありますが、確認材料が十分ではありません。'
      ),
      tone: 'warn',
    } as const;
  }

  return {
    title: '見つかりませんでした',
    description: message_ja || 'この画像に一致する登録情報は確認できませんでした。',
    tone: 'neutral',
  } as const;
}

function getScoreLabel(result: VerifyResponse): string {
  if (result.matchedByPHash) return '一致の目安';
  return '確認スコア';
}

export function VerifyResult({ result }: VerifyResultProps) {
  const { creator, design, license, seal, authenticity } = result;
  const statusCopy = getStatusCopy(result);
  const score = authenticity?.score ?? Math.round((result.confidence || 0) * 100);

  const accentClass =
    statusCopy.tone === 'ok'
      ? 'text-[#4ECDC4]'
      : statusCopy.tone === 'warn'
        ? 'text-[#FACC15]'
        : statusCopy.tone === 'danger'
          ? 'text-red-400'
          : 'text-[#999999]';

  const barClass =
    score >= 85
      ? 'bg-[#4ECDC4]'
      : score >= 60
        ? 'bg-[#FACC15]'
        : statusCopy.tone === 'danger'
          ? 'bg-red-400'
          : 'bg-[#666666]';

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          statusCopy.tone === 'ok'
            ? 'bg-[#4ECDC4]/10'
            : statusCopy.tone === 'warn'
              ? 'bg-[#FACC15]/10'
              : statusCopy.tone === 'danger'
                ? 'bg-red-500/10'
                : 'bg-[#666666]/10'
        }`}>
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
          <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-xs text-[#666666] mt-2">
          {statusCopy.tone === 'ok'
            ? 'OWM の登録情報と画像内容をもとに確認しています。'
            : statusCopy.tone === 'warn'
              ? '似た作品や一部の一致はありますが、最終判断には追加確認をおすすめします。'
              : statusCopy.tone === 'danger'
                ? '現在の公開状態は有効ではありません。'
                : '登録情報と一致する記録は確認できませんでした。'}
        </p>
      </div>

      {(creator || design || license || seal?.created_at) && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3 border border-[#222222]">
          <h4 className="font-medium text-[#E0E0E0]">確認できた情報</h4>

          <div className="grid gap-2 text-sm">
            {creator && (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">クリエイター</span>
                <span className="text-right text-[#E0E0E0]">
                  {creator.display_name || creator.username || '不明'}
                </span>
              </div>
            )}

            {design?.title && (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">作品名</span>
                <span className="text-right text-[#E0E0E0]">{design.title}</span>
              </div>
            )}

            {seal?.created_at && (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">登録日</span>
                <span className="text-right text-[#E0E0E0]">{formatDate(seal.created_at)}</span>
              </div>
            )}

            {license?.type && (
              <div className="flex justify-between gap-4">
                <span className="text-[#666666]">利用条件</span>
                <span className="text-right text-[#E0E0E0]">
                  {license.type === 'all_rights_reserved' ? '権利保護あり' : 'ライセンス設定あり'}
                </span>
              </div>
            )}
          </div>

          {license?.type && (
            <p className="text-xs text-[#666666] pt-2 border-t border-[#222222]">
              詳しい利用条件は OWM 上の作品ページで確認してください。
            </p>
          )}
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
