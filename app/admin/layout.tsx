import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة تحكم المتجر | Gold Clean',
  description: 'لوحة إدارة متجر ومصنع Gold Clean للمنظفات وإدارة الطلبات والشحن',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
