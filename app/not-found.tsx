import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800 text-center">
      <h2 className="text-4xl font-bold mb-4">404 - الصفحة غير موجودة</h2>
      <p className="text-slate-600 mb-6">عذراً، لم نتمكن من العثور على الصفحة المطلوبة.</p>
      <Link
        href="/"
        className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
