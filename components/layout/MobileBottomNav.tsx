'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Package, 
  Flame, 
  Notebook, 
  MessageSquareWarning, 
  ShoppingCart, 
  Settings 
} from 'lucide-react';

interface MobileBottomNavProps {
  isMerchantOpen?: boolean;
  currentTab: 'home' | 'products' | 'offers' | 'about' | 'complaints';
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  setIsMerchantOpen?: (open: boolean) => void;
  userOrdersCount: number;
  cartCount: number;
  userRole: 'user' | 'manager' | 'admin';
  onOpenTracker: () => void;
  onOpenCart: () => void;
}

export default function MobileBottomNav({
  isMerchantOpen,
  currentTab,
  setCurrentTab,
  setIsMerchantOpen,
  userOrdersCount,
  cartCount,
  userRole,
  onOpenTracker,
  onOpenCart
}: MobileBottomNavProps) {
  if (isMerchantOpen) return null;

  return (
    <nav className="md:hidden bg-white/95 backdrop-blur border-t border-slate-200 fixed bottom-0 inset-x-0 z-40 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold shadow-lg" dir="rtl" id="mobile-bottom-nav">
      <button
        onClick={() => { setCurrentTab('home'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
          currentTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>الرئيسية</span>
      </button>

      <button
        onClick={() => { setCurrentTab('products'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
          currentTab === 'products' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Package className="w-4 h-4" />
        <span>المنتجات</span>
      </button>

      <button
        onClick={() => { setCurrentTab('offers'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative cursor-pointer ${
          currentTab === 'offers' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[8px] px-1 rounded-full animate-pulse font-extrabold">
          🔥
        </span>
        <Flame className="w-4 h-4 text-rose-500" />
        <span className="text-rose-600">العروض</span>
      </button>

      <button
        onClick={onOpenTracker}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-colors relative cursor-pointer"
      >
        {userOrdersCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
            {userOrdersCount}
          </span>
        )}
        <Notebook className="w-4 h-4" />
        <span>طلباتي</span>
      </button>

      <button
        onClick={() => { setCurrentTab('complaints'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          currentTab === 'complaints' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MessageSquareWarning className="w-4 h-4" />
        <span>الشكاوى</span>
      </button>

      <button
        onClick={onOpenCart}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-colors relative cursor-pointer"
      >
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
            {cartCount}
          </span>
        )}
        <ShoppingCart className="w-4 h-4" />
        <span>السلة</span>
      </button>

      {(userRole === 'manager' || userRole === 'admin') && (
        <Link
          href="/admin"
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-amber-700 bg-amber-50 border border-amber-200 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-amber-600" />
          <span>الإدارة</span>
        </Link>
      )}
    </nav>
  );
}
