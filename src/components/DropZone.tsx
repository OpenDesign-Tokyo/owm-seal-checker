'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function DropZone({ onFileSelected, isLoading }: DropZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // プレビュー生成
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative overflow-hidden rounded-[24px] border border-dashed p-5 transition-all cursor-pointer
        ${isDragActive ? 'border-[#4ECDC4] bg-[#4ECDC4]/6' : 'border-white/10 bg-white/[0.03]'}
        ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4ECDC4]/50 hover:bg-white/[0.04]'}
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(78,205,196,0.08),transparent_30%)]" />
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative flex flex-col items-center gap-4 sm:gap-5">
          <div className="relative h-[280px] w-full overflow-hidden rounded-[20px] border border-white/8 bg-black/30 shadow-2xl shadow-black/40 sm:h-80 sm:max-w-md">
            <Image
              src={preview}
              alt="確認画像のプレビュー"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-[#E5E5E5]">
              アップロード画像を確認中
            </p>
            <p className="text-xs text-[#737373] sm:text-sm">
              {isLoading ? '照合処理を進めています…' : '別の画像を選ぶと、この画像と差し替わります'}
            </p>
          </div>
          <p className="text-sm text-[#666666]">
            {isLoading ? '確認中です…' : '別の画像を入れると差し替えられます'}
          </p>
        </div>
      ) : (
        <div className="relative flex min-h-[360px] flex-col items-center justify-center gap-5 py-8 text-center sm:min-h-[400px]">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/8 bg-white/[0.04] sm:h-20 sm:w-20">
            <svg
              className="h-9 w-9 text-[#4ECDC4] sm:h-10 sm:w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#F1F1F1] sm:text-2xl">
              {isDragActive ? 'ここに画像をドロップ' : '画像をドラッグ＆ドロップ'}
            </p>
            <p className="mx-auto max-w-md text-sm leading-6 text-[#8A8A8A] sm:text-base">
              OWM で保存した画像、または確認したい画像をアップロードしてください。
            </p>
            <p className="text-xs text-[#666666] mt-1 sm:text-sm">
              またはクリックして選択（JPEG / PNG / WebP、10MBまで）
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] text-[#909090]">
              モバイル対応
            </span>
            <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] text-[#909090]">
              証明書発行
            </span>
            <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] text-[#909090]">
              日本語表示
            </span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-[#050505]/88 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#E0E0E0] sm:text-base">
              画像を確認しています…
            </p>
            <p className="text-xs text-[#7D7D7D]">登録情報との照合を進めています</p>
          </div>
        </div>
      )}
    </div>
  );
}
