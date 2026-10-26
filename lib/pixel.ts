import { Order, Product, Offer } from './types/store';

export const trackAddToCartPixel = (id: string, name: string, price: number) => {
  if (typeof window === 'undefined') return;

  if ((window as any).fbq) {
    (window as any).fbq('track', 'AddToCart', {
      content_name: name,
      content_ids: [id],
      content_type: 'product',
      value: price,
      currency: 'EGP'
    });
  }

  if ((window as any).ttq) {
    (window as any).ttq.track('AddToCart', {
      content_id: id,
      content_name: name,
      content_type: 'product',
      quantity: 1,
      price: price,
      value: price,
      currency: 'EGP'
    });
  }
};

export const trackPurchasePixel = (verifiedOrder: Order) => {
  if (typeof window === 'undefined') return;

  if ((window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      content_type: 'product',
      contents: (verifiedOrder.items || []).map(it => ({
        id: it.productId,
        quantity: it.quantity,
        item_price: it.price
      })),
      value: verifiedOrder.totalPrice,
      currency: 'EGP',
      num_items: (verifiedOrder.items || []).reduce((sum, it) => sum + it.quantity, 0)
    });
  }

  if ((window as any).ttq) {
    (window as any).ttq.track('CompletePayment', {
      content_type: 'product',
      contents: (verifiedOrder.items || []).map(it => ({
        content_id: it.productId,
        content_name: it.productName,
        quantity: it.quantity,
        price: it.price
      })),
      value: verifiedOrder.totalPrice,
      currency: 'EGP'
    });
  }
};