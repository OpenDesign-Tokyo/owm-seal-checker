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
  const { status, confidence, metadata } = result;

  return (
    <div className="mt-6 space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        {status === 'authentic' && (
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
                OWMで生成・登録された資産です
              </p>
            </div>
          </>
        )}

        {status === 'inconclusive' && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#FACC15]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FACC15]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#FACC15]">
                Inconclusive
              </h3>
              <p className="text-sm text-[#666666]">
                改変が大きいか品質が不足しており、判定できません
              </p>
            </div>
          </>
        )}

        {status === 'not_found' && (
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
                OWMの署名は検出されませんでした
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
      {confidence > 0 && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 border border-[#222222]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#666666]">Confidence</span>
            <span className="text-sm font-medium text-[#E0E0E0]">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confidence >= 0.85 ? 'bg-[#4ECDC4]' :
                confidence >= 0.5 ? 'bg-[#FACC15]' : 'bg-[#666666]'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3 border border-[#222222]">
          <h4 className="font-medium text-[#E0E0E0]">Details</h4>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666666]">Creator</span>
              <a
                href={metadata.creator.profileUrl || '#'}
                className="text-[#4ECDC4] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {metadata.creator.displayName || 'Unknown'}
              </a>
            </div>

            <div className="flex justify-between">
              <span className="text-[#666666]">Registered</span>
              <span className="text-[#E0E0E0]">
                {new Date(metadata.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#666666]">Pipeline</span>
              <span className="text-[#E0E0E0]">
                {metadata.provenance.pipelineMode}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#666666]">Model</span>
              <span className="text-[#E0E0E0]">
                {metadata.provenance.modelProvider}
                {metadata.provenance.modelName && ` / ${metadata.provenance.modelName}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Button */}
      {status === 'authentic' && !certificate && (
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
