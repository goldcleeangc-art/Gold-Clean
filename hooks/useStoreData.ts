import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { Category, Product, Offer } from '../lib/types/store';

export function useStoreData(user: any, userRole: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState<number>(0);

  // جلب الأقسام
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = [];
      const seenKeys = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Category, 'id'>;
        if (!seenKeys.has(data.key)) {
          seenKeys.add(data.key);
          list.push({ id: docSnap.id, ...data });
        }
      });
      setCategories(list);
    }, (error) => console.error("Error listening to categories:", error));

    return () => unsubscribe();
  }, []);

  // جلب المنتجات
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      setProducts(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // جلب العروض
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'offers'), (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Offer, 'id'>) });
      });
      setOffers(list);
    }, (error) => console.error("Error listening to offers:", error));

    return () => unsubscribe();
  }, []);

  // جلب عدد الشكاوى للإدارة
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
      const q = query(collection(db, 'complaints'), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snapshot) => {
        setPendingComplaintsCount(snapshot.size);
      }, (err) => console.warn('Error fetching pending complaints count:', err));
      return () => unsub();
    } else {
      setPendingComplaintsCount(0);
    }
  }, [userRole]);

  // تقييم منتج
  const handleRateProduct = async (
    product: Product, 
    ratingValue: number, 
    onSuccessUpdate?: (updatedProduct: Product) => void
  ) => {
    try {
      const raterId = user ? user.uid : (typeof window !== 'undefined' ? (localStorage.getItem('goldclean_device_id') || (() => {
        const newId = 'dev_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('goldclean_device_id', newId);
        return newId;
      })()) : 'guest_rater');

      const productRef = doc(db, 'products', product.id);
      const newMap = { ...(product.ratingsMap || {}) };
      newMap[raterId] = ratingValue;

      const values = Object.values(newMap);
      const newCount = values.length;
      const finalRating = Number((values.reduce((a, b) => a + b, 0) / newCount).toFixed(1));

      await updateDoc(productRef, {
        ratingsMap: newMap,
        rating: finalRating,
        reviewsCount: newCount
      });

      if (onSuccessUpdate) {
        onSuccessUpdate({ ...product, ratingsMap: newMap, rating: finalRating, reviewsCount: newCount });
      }
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء حفظ التقييم');
    }
  };

  return {
    products,
    categories,
    offers,
    loading,
    pendingComplaintsCount,
    handleRateProduct
  };
}