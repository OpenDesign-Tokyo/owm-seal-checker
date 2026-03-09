'use client';

import { useState } from 'react';
import { DropZone } from '@/components/DropZone';
import { VerifyResult } from '@/components/VerifyResult';
import type { VerifyResponse, CertificateResponse } from '@/lib/seal/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [isLoadingCert, setIsLoadingCert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setResult(null);
    setCertificate(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/seal/verify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '画像の確認に失敗しました');
      }

      const data: VerifyResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCertificate = async () => {
    const sealId = result?.seal?.id;
    if (!sealId) return;

    setIsLoadingCert(true);
    setError(null);

    try {
      const response = await fetch('/api/seal/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sealId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '証明書の発行に失敗しました');
      }

      setCertificate(data as CertificateResponse);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingCert(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/8 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="owm-gradient owm-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-[0.22em] text-[#E0E0E0] uppercase sm:text-base">
                OWM シールチェッカー
              </h1>
              <p className="truncate text-[11px] text-[#7A7A7A] sm:text-xs">
                OWM 登録作品の真贋確認
              </p>
            </div>
          </div>
          <a
            href="https://open-wardrobe-market.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-[#C8C8C8] transition-colors hover:border-[#4ECDC4]/40 hover:text-[#4ECDC4] sm:text-xs"
          >
            OWM を開く
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="owm-card overflow-hidden rounded-[28px]">
          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(78,205,196,0.12),transparent_28%),radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_36%)]" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#4ECDC4]/20 bg-[#4ECDC4]/10 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-[#7FE6DF] uppercase">
                  Verify
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#B8B8B8]">
                  モバイル最適化
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="max-w-2xl text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#F5F5F5] sm:text-5xl">
                  画像を入れるだけで
                  <br />
                  OWM 登録情報を確認
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[#8D8D8D] sm:text-base">
                  画像内の登録シールと OWM の登録台帳、公開情報を照合し、作品の登録状態をわかりやすく表示します。
                </p>
              </div>

              <div className="grid gap-3 pt-1 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6F6F6F]">Step 1</p>
                  <p className="mt-1 text-sm font-medium text-[#EAEAEA]">画像を選択</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6F6F6F]">Step 2</p>
                  <p className="mt-1 text-sm font-medium text-[#EAEAEA]">登録情報を照合</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6F6F6F]">Step 3</p>
                  <p className="mt-1 text-sm font-medium text-[#EAEAEA]">証明書を発行</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="owm-card rounded-[28px] p-4 sm:p-5">
          <DropZone onFileSelected={handleFileSelected} isLoading={isLoading} />
        </section>

        {error && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <VerifyResult
            result={result}
            certificate={certificate}
            isLoadingCert={isLoadingCert}
            onRequestCertificate={handleRequestCertificate}
          />
        )}

        <section className="owm-card rounded-[24px] p-4 sm:p-5">
          <p className="text-center text-xs leading-6 text-[#6F6F6F] sm:text-sm">
            この確認結果は OWM 上の登録情報との一致を示すものです。
            著作権や法的な権利関係そのものを保証するものではありません。
          </p>
        </section>
      </main>

      <footer className="mt-10 border-t border-white/8">
        <div className="mx-auto max-w-4xl px-4 py-6 text-center text-xs text-[#4D4D4D] sm:px-6 sm:text-sm">
          <p>&copy; {new Date().getFullYear()} Open Wardrobe Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
