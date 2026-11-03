'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2, RefreshCw, Trash2, Eye } from 'lucide-react';
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
    <div className="space-y-2.5" dir="rtl">
      {/* Label & Help text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-600" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {helpText && (
          <span className="text-[11px] text-slate-500">{helpText}</span>
        )}
      </div>

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
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 sm:p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Thumbnail Box */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs relative group overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="معاينة الصورة"
                className="w-full h-full object-contain rounded-xl"
                onError={() => setError('تعذر تحميل الصورة من الرابط الحالي.')}
              />
              <a 
                href={value} 
                target="_blank" 
                rel="noreferrer"
                className="absolute inset-0 bg-slate-950/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                title="عرض الصورة كاملة"
              >
                <Eye className="w-5 h-5" />
              </a>
            </div>

            {/* Info & Badges */}
            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>جاهزة للحفظ</span>
                </span>
                
                {isBase64 ? (
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full">
                    مرفوعة من الجهاز {estimatedSizeKB !== null ? `(~${estimatedSizeKB} كيلوبايت)` : ''}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full">
                    رابط صورة ويب سحابي
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 truncate font-mono bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60" dir="ltr">
                {isBase64 ? 'مخزنة كنص Base64 في قاعدة البيانات' : value}
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.01] disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-700" />
                  <span>تغيير الصورة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setError(null);
                  }}
                  className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.01]"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>إزالة الصورة</span>
                </button>

                {originalValue && value !== originalValue && onResetToOriginal && (
                  <button
                    type="button"
                    onClick={onResetToOriginal}
                    className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>استعادة الأصلية</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area & URL Input when no image */
        <div className="space-y-3">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/30 bg-slate-50/50'
            }`}
          >
            {isProcessing ? (
              <div className="py-3 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
                <span className="text-xs font-extrabold text-slate-800">جاري ضغط وتجهيز الصورة...</span>
                <span className="text-[11px] text-slate-500">يتم تحسين الأبعاد لضمان سرعة تحميل فائقة في المتجر</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                    اضغط هنا لرفع صورة من جهازك
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    أو اسحب وأفلت ملف الصورة هنا (JPG, PNG, WebP)
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full font-bold">
                    <ImageIcon className="w-3 h-3" />
                    <span>ضغط تلقائي فوري وسلس</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Direct URL Input */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setError(null);
                }}
                placeholder={placeholder}
                className="w-full text-xs font-medium pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-left font-mono"
                dir="ltr"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">أو رابط ويب مباشر</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5 mt-1 bg-rose-50 border border-rose-200/60 p-2 rounded-xl">
          <X className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
