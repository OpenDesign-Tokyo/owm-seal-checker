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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">
                OWM Aether Seal
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Verify authenticity of OWM assets
              </p>
            </div>
          </div>
          <a
            href="https://open-wardrobe-market.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            open-wardrobe-market.com
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Verify Image Authenticity
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Check if an image was generated and registered on Open Wardrobe Market
          </p>
        </div>

        <DropZone onFileSelected={handleFileSelected} isLoading={isLoading} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Authentic</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Image was generated and registered on OWM platform
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Inconclusive</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Heavy modification or low quality prevents verification
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Not Found</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No OWM signature detected in this image
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Aether Seal verifies that an image was generated and registered on OWM.
            It does not guarantee copyright ownership or authorship.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Open Wardrobe Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
