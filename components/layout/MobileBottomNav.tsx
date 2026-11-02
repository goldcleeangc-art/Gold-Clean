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
  currentTab: 'home' | 'products' | 'white_friday' | 'offers' | 'about' | 'complaints';
  setCurrentTab: (tab: 'home' | 'products' | 'white_friday' | 'offers' | 'about' | 'complaints') => void;
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
    <nav 
      className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 fixed bottom-0 inset-x-0 z-40 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold shadow-lg" 
      dir="rtl" 
      id="mobile-bottom-nav"
    >
      <button
        onClick={() => { setCurrentTab('home'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'home' ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Sparkles className={`w-4 h-4 ${currentTab === 'home' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
        <span>الرئيسية</span>
      </button>

      <button
        onClick={() => { setCurrentTab('products'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
          currentTab === 'products' ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Package className={`w-4 h-4 ${currentTab === 'products' ? 'text-amber-500' : ''}`} />
        <span>المنتجات</span>
      </button>

      <button
        onClick={() => { setCurrentTab('white_friday'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
          currentTab === 'white_friday' ? 'text-amber-500 font-black' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <span className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[7px] px-1 rounded-full font-black animate-bounce">
          خصم
        </span>
        <Flame className={`w-4 h-4 ${currentTab === 'white_friday' ? 'text-amber-500 fill-amber-500/20' : 'text-amber-600'}`} />
        <span>الجمعة البيضاء</span>
      </button>

      <button
        onClick={() => { setCurrentTab('offers'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
          currentTab === 'offers' ? 'text-rose-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <span className="absolute -top-1 -left-1 bg-rose-600 text-white text-[8px] px-1 rounded-full animate-pulse font-extrabold">
          🔥
        </span>
        <Flame className="w-4 h-4 text-rose-500" />
        <span className="text-rose-600">العروض</span>
      </button>

      <button
        onClick={onOpenTracker}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-all relative cursor-pointer"
      >
        {userOrdersCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#111827] text-white text-[8px] min-w-3.5 h-3.5 px-0.5 flex items-center justify-center rounded-full font-mono">
            {userOrdersCount}
          </span>
        )}
        <Notebook className="w-4 h-4" />
        <span>طلباتي</span>
      </button>

      <button
        onClick={() => { setCurrentTab('complaints'); setIsMerchantOpen?.(false); }}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'complaints' ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MessageSquareWarning className={`w-4 h-4 ${currentTab === 'complaints' ? 'text-amber-600' : ''}`} />
        <span>الشكاوى</span>
      </button>

      <button
        onClick={onOpenCart}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 transition-all relative cursor-pointer"
      >
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] min-w-3.5 h-3.5 px-0.5 flex items-center justify-center rounded-full font-bold font-mono">
            {cartCount}
          </span>
        )}
        <ShoppingCart className="w-4 h-4" />
        <span>السلة</span>
      </button>

      {(userRole === 'manager' || userRole === 'admin') && (
        <Link
          href="/admin"
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-amber-800 bg-amber-50 border border-amber-200 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-amber-600" />
          <span>الإدارة</span>
        </Link>
      )}
    </nav>
  );
}
