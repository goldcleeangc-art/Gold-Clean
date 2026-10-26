import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, query, where, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { CartItem, Order } from '../lib/types/store';
import { calculateShipping, calculateCartTotalWeight } from '../lib/shipping';
import { trackPurchasePixel } from '../lib/pixel';

export function useOrdersAndCheckout(
  user: any,
  cart: CartItem[],
  saveCart: (cart: CartItem[]) => void,
  subtotal: number,
  hasFreeShippingOffer: boolean
) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [isShippingRatesOpen, setIsShippingRatesOpen] = useState<boolean>(false);
  const [orderInProgress, setOrderInProgress] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const [checkoutForm, setCheckoutForm] = useState({
    name: '', phone: '', country: 'مصر', city: '', address: '', notes: ''
  });

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userOrdersTab, setUserOrdersTab] = useState<'active' | 'cancelled' | 'past'>('active');
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);

  // تعبئة اسم المستخدم تلقائياً عند تسجيل الدخول
  useEffect(() => {
    if (user?.displayName) {
      setCheckoutForm(prev => ({ ...prev, name: user.displayName || prev.name }));
    }
  }, [user]);

  // حسابات الشحن
  const cartTotalWeight = calculateCartTotalWeight(cart);
  const shippingCalculation = checkoutForm.city ? calculateShipping(checkoutForm.city, cartTotalWeight) : null;
  const rawShippingCost = shippingCalculation ? shippingCalculation.shippingCost : 0;
  const currentShippingCost = hasFreeShippingOffer ? 0 : rawShippingCost;
  const checkoutGrandTotal = subtotal + currentShippingCost;

  // متابعة طلبات المستخدم أو الزائر
  useEffect(() => {
    setIsTrackingLoading(true);
    if (user) {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
        });
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUserOrders(list);
        setIsTrackingLoading(false);
      }, (error) => {
        console.error("Error listening to user orders:", error);
        setIsTrackingLoading(false);
      });
      return () => unsubscribe();
    } else {
      const loadGuestOrders = async () => {
        try {
          const guestOrderIds: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
          if (guestOrderIds.length === 0) {
            setUserOrders([]);
            return;
          }
          const loaded: Order[] = [];
          for (const orderId of guestOrderIds) {
            try {
              const snap = await getDoc(doc(db, 'orders', orderId));
              if (snap.exists()) loaded.push({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) });
            } catch (err) {
              console.warn("Could not fetch guest order:", orderId);
            }
          }
          loaded.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setUserOrders(loaded);
        } catch (e) {
          console.error("Error loading guest orders:", e);
        } finally {
          setIsTrackingLoading(false);
        }
      };
      loadGuestOrders();
    }
  }, [user, successOrder, isTrackerOpen]);

  // إرسال الطلب
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutForm.city) {
      alert('يرجى اختيار المحافظة / المدينة لتحديد قيمة الشحن بدقة قبل تأكيد الطلب.');
      return;
    }
    setOrderInProgress(true);

    try {
      const token = await auth.currentUser?.getIdToken().catch(() => undefined);
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone,
          customerCity: checkoutForm.city,
          customerAddress: checkoutForm.address,
          customerCountry: checkoutForm.country || 'مصر',
          notes: checkoutForm.notes,
          userId: user?.uid || 'guest',
          customerEmail: user?.email,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            isOffer: Boolean(item.isOffer)
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'حدث خطأ أثناء معالجة وتأكيد الطلب');
      }

      const generatedOrderId = data.orderId;
      const verifiedOrder: Order = data.order;

      if (!user) {
        try {
          const savedGuestOrders: string[] = JSON.parse(localStorage.getItem('goldclean_guest_orders') || '[]');
          if (!savedGuestOrders.includes(generatedOrderId)) {
            savedGuestOrders.unshift(generatedOrderId);
            localStorage.setItem('goldclean_guest_orders', JSON.stringify(savedGuestOrders.slice(0, 20)));
          }
        } catch (e) { console.error("Error updating local guest orders:", e); }
      }

      trackPurchasePixel(verifiedOrder);
      setSuccessOrder(verifiedOrder);
      saveCart([]);
      setCheckoutForm({
        name: user?.displayName || '', phone: '', country: 'مصر', city: '', address: '', notes: ''
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'حدث خطأ أثناء رفع الطلب لقاعدة البيانات.');
    } finally {
      setOrderInProgress(false);
    }
  };

  const handleUserCancelOrder = async (order: Order) => {
    if (!order.id) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled' });
      alert('تم إلغاء طلبك بنجاح.');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إلغاء الطلب. الرجاء المحاولة مرة أخرى.');
    }
  };

  return {
    isCheckoutOpen,
    setIsCheckoutOpen,
    isTrackerOpen,
    setIsTrackerOpen,
    checkoutForm,
    setCheckoutForm,
    isShippingRatesOpen,
    setIsShippingRatesOpen,
    orderInProgress,
    successOrder,
    setSuccessOrder,
    userOrders,
    userOrdersTab,
    setUserOrdersTab,
    isTrackingLoading,
    shippingCalculation,
    currentShippingCost,
    checkoutGrandTotal,
    handleCheckoutSubmit,
    handleUserCancelOrder
  };
}