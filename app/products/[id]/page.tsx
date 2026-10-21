import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import ProductDetailView from '@/components/store/ProductDetailView';
import { Product, Category } from '@/lib/types/store';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 1. Dynamic SEO & OpenGraph Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const productSnap = await getDoc(doc(db, 'products', id));

    if (!productSnap.exists()) {
      return {
        title: 'المنتج غير موجود | متجر Gold Clean',
        description: 'عذراً، المنتج المطلوب غير موجود أو تم نقله.'
      };
    }

    const data = productSnap.data();
    const productTitle = data.seoTitle || `${data.name} | مصنع Gold Clean للمنظفات`;
    const productDescription = data.seoDescription || data.description?.slice(0, 160) || 'أجود وأفخر المنظفات المنزلية والصناعية من مصنع Gold Clean.';
    const productImage = data.image || 'https://images.unsplash.com/photo-1563453392212-326f518500b1?auto=format&fit=crop&q=80&w=1000';
    const keywords = data.seoKeywords 
      ? data.seoKeywords.split(',').map((k: string) => k.trim()) 
      : ['منظفات', 'Gold Clean', data.name, 'منظفات منزلية', 'مصر'];

    return {
      title: productTitle,
      description: productDescription,
      keywords: keywords,
      alternates: {
        canonical: `/products/${id}`,
      },
      openGraph: {
        title: productTitle,
        description: productDescription,
        url: `/products/${id}`,
        siteName: 'متجر Gold Clean للمنظفات',
        locale: 'ar_EG',
        type: 'website',
        images: [
          {
            url: productImage,
            width: 800,
            height: 800,
            alt: data.name || 'منتج Gold Clean',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: productTitle,
        description: productDescription,
        images: [productImage],
      },
    };
  } catch (err) {
    console.error('Error generating product metadata:', err);
    return {
      title: 'متجر Gold Clean | للمنظفات الفاخرة',
      description: 'متجر إلكتروني متكامل لأفخم وأجود أنواع منظفات المنزل والملابس والأطباق.'
    };
  }
}

// 2. Server Component Page
export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  let product: Product | null = null;
  let categoryName = 'منظفات عامة';
  let relatedProducts: Product[] = [];

  try {
    // A. Fetch current product
    const productSnap = await getDoc(doc(db, 'products', id));

    if (productSnap.exists()) {
      const data = productSnap.data();
      product = {
        id: productSnap.id,
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        price: Number(data.price) || 0,
        category: data.category || 'general',
        image: data.image || '',
        volume: data.volume || '',
        isAvailable: data.isAvailable ?? true,
        rating: Number(data.rating) || 5,
        reviewsCount: Number(data.reviewsCount) || 0,
        ratingsMap: data.ratingsMap || {},
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords
      };

      // B. Fetch Category Name
      try {
        const catQuery = query(collection(db, 'categories'), where('key', '==', product.category), limit(1));
        const catSnap = await getDocs(catQuery);
        if (!catSnap.empty) {
          categoryName = catSnap.docs[0].data().name || categoryName;
        }
      } catch (catErr) {
        console.warn('Could not fetch category name:', catErr);
      }

      // C. Fetch Related Products
      try {
        const relatedQuery = query(
          collection(db, 'products'),
          where('category', '==', product.category),
          limit(6)
        );
        const relatedSnap = await getDocs(relatedQuery);
        relatedProducts = relatedSnap.docs
          .filter(d => d.id !== id)
          .slice(0, 4)
          .map(d => ({
            id: d.id,
            name: d.data().name || '',
            code: d.data().code || '',
            description: d.data().description || '',
            price: Number(d.data().price) || 0,
            category: d.data().category || 'general',
            image: d.data().image || '',
            volume: d.data().volume || '',
            isAvailable: d.data().isAvailable ?? true,
            rating: Number(d.data().rating) || 5,
            reviewsCount: Number(d.data().reviewsCount) || 0,
          }));
      } catch (relErr) {
        console.warn('Could not fetch related products:', relErr);
      }
    }
  } catch (e) {
    console.error('Error fetching product data:', e);
  }

  // Not Found State
  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">المنتج غير موجود أو تم حذفه</h1>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          عذراً، لم نتمكن من العثور على المنتج المطلوب. قد يكون الرابط خاطئاً أو تم تحديث المنتجات في المتجر.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تصفح جميع المنتجات في المتجر</span>
        </Link>
      </div>
    );
  }

  // Google JSON-LD Product Schema for Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image ? [product.image] : [],
    description: product.description,
    sku: product.code || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Gold Clean',
    },
    offers: {
      '@type': 'Offer',
      url: `/products/${product.id}`,
      priceCurrency: 'EGP',
      price: product.price,
      availability: product.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView
        product={product}
        categoryName={categoryName}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
