'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2, RefreshCw } from 'lucide-react';
import { compressImageFile } from '../../lib/utils';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  originalValue?: string;
  onResetToOriginal?: () => void;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  helpText,
  required = false,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7,
  originalValue,
  onResetToOriginal
}: ImageUploadFieldProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const compressedBase64 = await compressImageFile(file, maxWidth, maxHeight, quality);
      onChange(compressedBase64);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setError(err?.message || 'حدث خطأ أثناء معالجة الصورة.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Estimate base64 size in KB
  const isBase64 = value?.startsWith('data:image/');
  const estimatedSizeKB = isBase64
    ? Math.round((value.length * 0.75) / 1024)
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {originalValue && value !== originalValue && onResetToOriginal && (
          <button
            type="button"
            onClick={onResetToOriginal}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>استعادة الصورة الأصلية</span>
          </button>
        )}
      </div>

      {helpText && (
        <p className="text-[11px] text-slate-500">{helpText}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview Card (if value exists) */}
      {value ? (
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-3 flex items-center gap-3.5 group">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="معاينة الصورة"
              className="w-full h-full object-cover"
              onError={() => setError('تعذر تحميل الصورة من الرابط الحالي.')}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <Check className="w-3 h-3" />
                <span>جاهزة للحفظ</span>
              </span>
              {estimatedSizeKB !== null && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ~{estimatedSizeKB} كيلوبايت (مضغوطة)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 truncate font-mono" dir="ltr">
              {isBase64 ? 'صورة مرفوعة من الجهاز (Base64)' : value}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                <span>تغيير الصورة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setError(null);
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>إزالة</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area & URL Input when no image */
        <div className="space-y-2.5">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
                : 'border-slate-200 hover:border-amber-400 hover:bg-slate-50/70 bg-white'
            }`}
          >
            {isProcessing ? (
              <div className="py-2 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-xs font-bold text-slate-700">جاري ضغط وتجهيز الصورة...</span>
                <span className="text-[10px] text-slate-400">يتم تحسين الحجم تلقائياً لتخزينها بسلاسة</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    اضغط هنا لرفع صورة من جهازك
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    أو اسحب وأفلت ملف الصورة هنا (JPG, PNG, WebP)
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold">
                  <ImageIcon className="w-3 h-3" />
                  <span>تخزين فوري تلقائي في قاعدة البيانات كـ نص</span>
                </span>
              </div>
            )}
          </div>

          {/* Or URL input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-3.5 h-3.5" />
              </div>
              <input
                type="url"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setError(null);
                }}
                placeholder={placeholder}
                className="w-full text-xs font-medium pr-8 pl-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono"
                dir="ltr"
              />
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">أو رابط مباشر</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
