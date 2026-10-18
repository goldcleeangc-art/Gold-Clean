'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  Settings, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'products' | 'offers' | 'about' | 'complaints';
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  isMerchantOpen: boolean;
  setIsMerchantOpen: (open: boolean) => void;
  pendingComplaintsCount: number;
  userOrdersCount: number;
  userRole: 'user' | 'manager' | 'admin';
  checkingAuth: boolean;
  user: any;
  onSignOut: () => void;
  onOpenAuthModal: () => void;
  onOpenCart: () => void;
  onOpenTracker: () => void;
  cartItemsCount: number;
  isCartBouncing: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onResetCategory: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  isMerchantOpen,
  setIsMerchantOpen,
  pendingComplaintsCount,
  userOrdersCount,
  userRole,
  checkingAuth,
  user,
  onSignOut,
  onOpenAuthModal,
  onOpenCart,
  onOpenTracker,
  cartItemsCount,
  isCartBouncing,
  searchTerm,
  setSearchTerm,
  onResetCategory
}: NavbarProps) {
  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0 sticky top-0 z-30" id="header-nav">
        <div className="flex items-center gap-8 md:gap-12">
          {/* Logo brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentTab('home'); setIsMerchantOpen(false); }}>
            <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">G</span>
            <h1 className="text-lg font-bold tracking-tight text-amber-500 font-sans">
              GOLD<span className="text-slate-900">CLEAN</span>
              <span className="text-xs text-slate-400 font-normal mr-2 font-sans">جولد كلين</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <button 
              id="nav-home-btn"
              onClick={() => { setCurrentTab('home'); setIsMerchantOpen(false); }} 
              className={`${currentTab === 'home' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors cursor-pointer`}
            >
              الرئيسية
            </button>
            <button 
              id="nav-products-btn"
              onClick={() => { setCurrentTab('products'); setIsMerchantOpen(false); onResetCategory(); setSearchTerm(''); }} 
              className={`${currentTab === 'products' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors cursor-pointer`}
            >
              منتجاتنا
            </button>
            <button 
              id="nav-offers-btn"
              onClick={() => { setCurrentTab('offers'); setIsMerchantOpen(false); }} 
              className={`relative flex items-center gap-1.5 ${currentTab === 'offers' && !isMerchantOpen ? 'text-rose-600 border-b-2 border-rose-600' : 'hover:text-rose-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors cursor-pointer`}
            >
              <span>عروض التوفير</span>
              <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                خصومات 🔥
              </span>
            </button>
            <button 
              id="nav-about-btn"
              onClick={() => { 
                setCurrentTab('about'); 
                setIsMerchantOpen(false); 
                window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer'); 
              }} 
              className={`${currentTab === 'about' && !isMerchantOpen ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors cursor-pointer`}
            >
              عن الشركة
            </button>
            <button 
              id="nav-complaints-btn"
              onClick={() => { setCurrentTab('complaints'); setIsMerchantOpen(false); }} 
              className={`${currentTab === 'complaints' && !isMerchantOpen ? 'text-amber-600 border-b-2 border-amber-600' : 'hover:text-amber-600 border-b-2 border-transparent'} pb-2.5 pt-1.5 transition-colors flex items-center gap-1 cursor-pointer`}
            >
              <span>الشكاوى والمقترحات</span>
            </button>
            <button 
              id="nav-tracker-btn" 
              onClick={onOpenTracker} 
              className="hover:text-slate-950 pt-1.5 pb-2.5 transition-colors cursor-pointer"
            >
              طلباتي ({userOrdersCount})
            </button>
            {(userRole === 'manager' || userRole === 'admin') && (
              <button 
                id="nav-admin-btn" 
                onClick={() => { setIsMerchantOpen(true); }} 
                className={`flex items-center gap-1.5 pt-1.5 pb-2.5 transition-colors relative cursor-pointer ${isMerchantOpen ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-amber-600 border-b-2 border-transparent'}`}
              >
                <Settings className="w-4 h-4" />
                <span>إدارة المتجر ⚙️</span>
                {pendingComplaintsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs" title={`${pendingComplaintsCount} شكاوى جديدة بانتظار المراجعة`}>
                    {pendingComplaintsCount}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search inside Header */}
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              id="header-search"
              type="text" 
              placeholder="البحث السريع..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-full py-1.5 pr-9 pl-3 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
              dir="rtl"
            />
          </div>

          {/* Admin Sign In / Profile status on Header */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1" dir="rtl">
            {checkingAuth ? (
              <span className="text-[10px] text-slate-400">جاري التحقق...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-slate-200/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold font-mono">
                    {user.displayName ? user.displayName.charAt(0) : 'A'}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-right">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 leading-tight">
                    <span>{user.displayName?.split(' ')[0]}</span>
                    {userRole === 'admin' ? (
                      <span className="bg-rose-100 text-rose-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">المدير العام</span>
                    ) : userRole === 'manager' ? (
                      <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">مشرف المتجر</span>
                    ) : null}
                  </div>
                  <button onClick={onSignOut} className="text-[9px] text-rose-500 hover:underline text-right leading-none mt-0.5 cursor-pointer">تسجيل الخروج</button>
                </div>
                <button onClick={onSignOut} className="lg:hidden text-[10px] text-rose-400 font-bold hover:underline cursor-pointer">خروج</button>
              </div>
            ) : (
              <button 
                id="admin-portal-login-btn"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                title="بوابة دخول الإدارة والمشرفين"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>دخول الإدارة</span>
              </button>
            )}
          </div>

          {/* Cart Icon */}
          <motion.button 
            id="cart-trigger-btn"
            onClick={onOpenCart}
            animate={isCartBouncing ? { scale: [1, 1.35, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center relative cursor-pointer border border-slate-200/50 transition-all ${
              isCartBouncing ? 'ring-4 ring-amber-300 ring-offset-2' : ''
            }`}
          >
            <motion.span 
              animate={isCartBouncing ? { scale: [1, 1.45, 1] } : { scale: 1 }}
              className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-xs"
            >
              {cartItemsCount}
            </motion.span>
            <ShoppingCart className={`w-4.5 h-4.5 transition-colors ${isCartBouncing ? 'text-amber-600' : 'text-slate-700'}`} />
          </motion.button>
        </div>
      </header>

      {/* Hero promo ribbon bar */}
      {isMerchantOpen ? (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-2.5 px-6 text-center text-xs font-semibold flex items-center justify-between gap-4" id="admin-ribbon">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-100" />
            <span>لوحة التحكم الإدارية لمتجر Gold Clean - إدارة المنتجات والمبيعات والطلبيات المباشرة</span>
          </div>
          <button 
            onClick={() => setIsMerchantOpen(false)}
            className="bg-white/10 hover:bg-white/20 px-3.5 py-1 rounded-lg text-white font-bold transition-all text-[11px] cursor-pointer"
            dir="rtl"
          >
            العودة لواجهة المتجر واستعراض المنتجات ←
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2" id="promo-ribbon">
          <Sparkles className="w-3.5 h-3.5" />
          <span>توصيل سريع ومتميز لكافة الدول العربية ومصر!</span>
        </div>
      )}
    </>
  );
}
