'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Info, Truck } from 'lucide-react';
import { Order, CartItem } from '../../lib/types/store';
import { SHIPPING_ZONES, normalizeArabicNumerals, sanitizeEgyptianPhone } from '../../lib/shipping';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  successOrder: Order | null;
  setSuccessOrder: (order: Order | null) => void;
  user: any;
  userRole: 'user' | 'manager' | 'admin';
  checkoutForm: {
    name: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    notes: string;
  };
  setCheckoutForm: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    notes: string;
  }>>;
  isShippingRatesOpen: boolean;
  setIsShippingRatesOpen: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  shippingCalculation: any;
  hasFreeShippingOffer: boolean;
  currentShippingCost: number;
  checkoutGrandTotal: number;
  orderInProgress: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  successOrder,
  setSuccessOrder,
  user,
  userRole,
  checkoutForm,
  setCheckoutForm,
  isShippingRatesOpen,
  setIsShippingRatesOpen,
  cart,
  subtotal,
  shippingCalculation,
  hasFreeShippingOffer,
  currentShippingCost,
  checkoutGrandTotal,
  orderInProgress,
  onSubmit
}: CheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950 cursor-pointer"
          id="checkout-overlay"
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
          id="checkout-modal"
          dir="rtl"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">إتمام الشحن والطلب</h3>
              <p className="text-[11px] text-slate-400">يرجى تعبئة بيانات التوصيل بدقة لضمان سرعة الوصول</p>
            </div>
            <button 
              onClick={() => { onClose(); setSuccessOrder(null); }} 
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {successOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">تم إرسال طلبك بنجاح!</h4>
                <p className="text-xs text-slate-400 mt-1">نشكرك لشرائك من متجرنا. تم إرسال المعلومات ومزامنتها بنجاح مع وكلاء التوصيل.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-2.5 text-xs">
                <p><strong>رقم المرجع للطلب:</strong> <span className="font-mono text-blue-600 text-sm">{successOrder.id}</span></p>

                <p><strong>اسم العميل:</strong> {successOrder.customerName}</p>
                <p><strong>المحافظة والمدينة:</strong> {successOrder.customerCity} {successOrder.shippingZone ? `(${successOrder.shippingZone})` : ''}</p>
                <p><strong>العنوان بالتفصيل:</strong> {successOrder.customerAddress}</p>
                <p><strong>طريقة الدفع:</strong> نقدي عند التوصيل للمنزل (COD)</p>

                <div className="pt-2.5 border-t border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>إجمالي المنتجات:</span>
                    <span className="font-mono font-bold text-slate-800">{(successOrder.subtotal ?? (successOrder.totalPrice - (successOrder.shippingCost || 0))).toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>تكلفة الشحن والتوصيل {successOrder.shippingZone ? `(${successOrder.shippingZone})` : ''}:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {successOrder.shippingCost === 0 ? 'مجاني 🎉' : `${(successOrder.shippingCost || 0).toFixed(2)} جنيه`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-extrabold pt-1.5 border-t border-slate-200">
                    <span>المبلغ المستحق للدفع عند الاستلام:</span>
                    <span className="font-mono text-blue-700 text-sm">{successOrder.totalPrice.toFixed(2)} جنيه</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 text-center pt-1 font-medium">
                    ✓ المبلغ شامل كافة مصاريف الشحن والتوصيل لباب منزلك
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { onClose(); setSuccessOrder(null); }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                العودة للتسوق بمزيد من المنظفات
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 text-xs">
              {user && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between" dir="rtl">
                  <span className="text-amber-800 text-[10px] font-bold">الحساب الحالي ({userRole === 'admin' ? 'المدير' : userRole === 'manager' ? 'المشرف' : 'مستخدم'}):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-bold text-[11px] font-mono">{user.email}</span>
                    {user.photoURL && (
                      <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover border border-amber-300" />
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستلم رباعي *</label>
                <input 
                  type="text" 
                  required 
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  placeholder="محمد أحمد علي..."
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الهاتف لتأكيد الشحن والتسليم *</label>
                  <input 
                    type="tel" 
                    required 
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: normalizeArabicNumerals(e.target.value) })}
                    onBlur={() => {
                      if (checkoutForm.phone) {
                        const cleaned = sanitizeEgyptianPhone(checkoutForm.phone, '');
                        if (cleaned && cleaned !== '01000000000' && cleaned.startsWith('01')) {
                          setCheckoutForm(prev => ({ ...prev, phone: cleaned }));
                        }
                      }
                    }}
                    placeholder="01012345678"
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-left flex-1 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الدولة</label>
                  <div className="w-full bg-slate-100 border border-slate-200 py-2.5 px-3 rounded-lg text-slate-700 font-bold flex items-center justify-between">
                    <span>جمهورية مصر العربية</span>
                    <span>🇪🇬</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">المحافظة / المدينة *</label>
                  <button
                    type="button"
                    onClick={() => setIsShippingRatesOpen(!isShippingRatesOpen)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>{isShippingRatesOpen ? 'إخفاء جدول المناطق' : 'جدول أسعار ومناطق الشحن'}</span>
                  </button>
                </div>
                <select
                  required
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">-- اضغط هنا لاختيار المحافظة لتحديد تكلفة الشحن --</option>
                  {SHIPPING_ZONES.map((zone) => (
                    <optgroup 
                      key={zone.id} 
                      label={`${zone.name} (شحن ${zone.baseRate.toFixed(2)} ج)`}
                    >
                      {zone.cities.map((city) => (
                        <option key={city} value={city}>
                          {city} (شحن {zone.baseRate.toFixed(2)} ج)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Collapsible Shipping Rate Guide */}
              {isShippingRatesOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2 text-[11px] overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>أسعار الشحن والتوصيل حسب المحافظات (شاملة ضريبة القيمة المضافة 14%):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SHIPPING_ZONES.map(z => (
                      <div key={z.id} className="bg-white p-2 rounded-lg border border-blue-100 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-blue-950">{z.name}</span>
                          <span className="font-mono font-black text-emerald-700">{z.baseRate.toFixed(2)} ج</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {z.cities.join('، ')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-700 pt-1">
                    • جميع أسعار الشحن معلنة وشاملة ضريبة القيمة المضافة 14% وثابتة وموحدة لكل منطقة بغض النظر عن وزن الطلب.
                  </p>
                </motion.div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تفاصيل العنوان والشارع *</label>
                <input 
                  type="text" 
                  required 
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  placeholder="اسم المنطقة/الحي، اسم الشارع، رقم العمارة، رقم الشقة"
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ملاحظات للمندوب أو شروط معينة</label>
                <textarea 
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                  placeholder="يرجى الاتصال قبل الوصول بنصف ساعة لتجهيز المبلغ كاش..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Order & Shipping Cost Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>إجمالي سعر المنتجات ({cart.reduce((s, it) => s + it.quantity, 0)} قطعة):</span>
                  <span className="font-mono font-bold text-slate-800">{subtotal.toFixed(2)} جنيه</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>تكلفة الشحن والتوصيل:</span>
                    {shippingCalculation && (
                      <span className="text-[10px] text-slate-400">
                        ({shippingCalculation.zone.name})
                      </span>
                    )}
                    {hasFreeShippingOffer ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        عرض شحن مجاني 🎁
                      </span>
                    ) : null}
                  </div>
                  {hasFreeShippingOffer ? (
                    <div className="flex items-center gap-1.5">
                      {shippingCalculation && (
                        <span className="font-mono text-slate-400 line-through text-[10px]">
                          +{shippingCalculation.shippingCost.toFixed(2)} ج
                        </span>
                      )}
                      <span className="font-bold text-emerald-600 text-xs">
                        مجاني 🎉
                      </span>
                    </div>
                  ) : shippingCalculation ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-700">
                        +{currentShippingCost.toFixed(2)} جنيه
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-bold text-[10px]">
                      اختر المحافظة لحساب الشحن
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">الإجمالي المطلوب دفعه:</span>
                    <span className="text-[10px] text-slate-400 font-medium">نقداً عند الاستلام للمنزل (COD)</span>
                  </div>
                  <span className="text-base font-black text-blue-700 font-mono">
                    {checkoutGrandTotal.toFixed(2)} جنيه
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={orderInProgress}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {orderInProgress ? 'يرجى الانتظار جاري إرسال الطلب...' : `تأكيد الطلب بمبلغ ${checkoutGrandTotal.toFixed(2)} جنيه`}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
