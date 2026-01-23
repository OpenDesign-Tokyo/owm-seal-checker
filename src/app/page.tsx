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
        throw new Error(data.error || 'Verification failed');
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
    if (!result?.sealId) return;

    setIsLoadingCert(true);

    try {
      const response = await fetch('/api/seal/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sealId: result.sealId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to issue certificate');
      }

      const data: CertificateResponse = await response.json();
      setCertificate(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingCert(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-[#222222] bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#4ECDC4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4ECDC4]/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-[#E0E0E0] tracking-wide">
                OWM Aether Seal
              </h1>
              <p className="text-xs text-[#666666]">
                Verify authenticity of OWM assets
              </p>
            </div>
          </div>
          <a
            href="https://open-wardrobe-market.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#666666] hover:text-[#4ECDC4] transition-colors"
          >
            open-wardrobe-market.com
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2 tracking-wide">
            Verify Image Authenticity
          </h2>
          <p className="text-[#666666]">
            Check if an image was generated and registered on Open Wardrobe Market
          </p>
        </div>

        <DropZone onFileSelected={handleFileSelected} isLoading={isLoading} />

        {error && (
          <div className="mt-4 p-4 bg-red-950/50 border border-red-800/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <VerifyResult
            result={result}
            onRequestCertificate={handleRequestCertificate}
            certificate={certificate}
            isLoadingCert={isLoadingCert}
          />
        )}

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-[#0D0D0D] rounded-xl p-5 border border-[#222222]">
            <div className="w-10 h-10 bg-[#4ECDC4]/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#E0E0E0] mb-1">Authentic</h3>
            <p className="text-sm text-[#666666]">
              Image was generated and registered on OWM platform
            </p>
          </div>

          <div className="bg-[#0D0D0D] rounded-xl p-5 border border-[#222222]">
            <div className="w-10 h-10 bg-[#FACC15]/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#FACC15]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#E0E0E0] mb-1">Inconclusive</h3>
            <p className="text-sm text-[#666666]">
              Heavy modification or low quality prevents verification
            </p>
          </div>

          <div className="bg-[#0D0D0D] rounded-xl p-5 border border-[#222222]">
            <div className="w-10 h-10 bg-[#666666]/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#E0E0E0] mb-1">Not Found</h3>
            <p className="text-sm text-[#666666]">
              No OWM signature detected in this image
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-[#0D0D0D] border border-[#222222] rounded-lg">
          <p className="text-xs text-[#666666] text-center">
            Aether Seal verifies that an image was generated and registered on OWM.
            It does not guarantee copyright ownership or authorship.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-[#444444]">
          <p>&copy; {new Date().getFullYear()} Open Wardrobe Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
