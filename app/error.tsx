'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800 text-center">
      <h2 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h2>
      <p className="text-slate-600 mb-6">{error.message || 'يرجى المحاولة مرة أخرى لاحقاً.'}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
