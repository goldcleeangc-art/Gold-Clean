import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'متجر Gold Clean | للمنظفات الفاخرة',
  description: 'متجر إلكتروني متكامل لأفخم وأجود أنواع منظفات المنزل والملابس والأطباق مع سلة تسوق زكية ودعم كامل لقاعدة بيانات Firebase.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className="font-sans">
      <body className="bg-slate-50/50 text-slate-800 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
