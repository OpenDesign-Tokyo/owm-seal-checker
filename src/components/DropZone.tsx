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
        relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer bg-[#0D0D0D]
        ${isDragActive ? 'border-[#4ECDC4] bg-[#4ECDC4]/5' : 'border-[#333333]'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#4ECDC4]/50 hover:bg-[#0D0D0D]'}
      `}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-64 w-full max-w-sm overflow-hidden rounded-lg shadow-lg shadow-black/50">
            <Image
              src={preview}
              alt="確認画像のプレビュー"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <p className="text-sm text-[#666666]">
            {isLoading ? '確認中です…' : '別の画像を入れると差し替えられます'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#4ECDC4]"
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
          <div className="text-center">
            <p className="text-lg font-medium text-[#E0E0E0]">
              {isDragActive ? 'ここに画像をドロップ' : '画像をドラッグ＆ドロップ'}
            </p>
            <p className="text-sm text-[#666666] mt-1">
              またはクリックして選択（JPEG / PNG / WebP、10MBまで）
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/90 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#E0E0E0]">
              画像を確認しています…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
