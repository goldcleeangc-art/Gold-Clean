'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  Menu,
  X,
  Flame,
  Truck,
  Package,
  MessageSquareWarning,
  Info,
  Clock,
  User,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'products' | 'offers' | 'about' | 'complaints';
  setCurrentTab: (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => void;
  isMerchantOpen?: boolean;
  setIsMerchantOpen?: (open: boolean) => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'home' | 'products' | 'offers' | 'about' | 'complaints') => {
    setCurrentTab(tab);
    setIsMerchantOpen?.(false);
    if (tab === 'products') {
      onResetCategory();
    }
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && currentTab !== 'products') {
      setCurrentTab('products');
    }
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR (Elegantly styled with Brand Navy & Gold accents) */}
      {isMerchantOpen ? (
        <div 
          className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white py-2 px-4 sm:px-6 text-center text-xs font-semibold flex items-center justify-between gap-4 shrink-0 shadow-sm z-50 border-b border-amber-800" 
          id="admin-ribbon"
          dir="rtl"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <ShieldCheck className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate font-medium text-[11px] sm:text-xs">
              لوحة التحكم الإدارية لمتجر GoldClean — متابعة المنتجات، المبيعات والطلبيات المباشرة
            </span>
          </div>
          <button 
            onClick={() => setIsMerchantOpen?.(false)}
            className="bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg text-white font-bold transition-all text-[11px] cursor-pointer shrink-0 outline-none focus:outline-none flex items-center gap-1"
          >
            <span>العودة للمتجر</span>
            <span className="text-amber-200">&larr;</span>
          </button>
        </div>
      ) : (
        <div 
          className="bg-[#111827] text-slate-100 py-1.5 px-4 text-center text-[11px] sm:text-xs font-medium flex items-center justify-center gap-2 shrink-0 border-b border-slate-800/80 z-50 select-none" 
          id="promo-ribbon"
          dir="rtl"
        >
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>خدمة عملاء على مدار الساعة</span>
            </div>

            <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>عروض حصرية</span>
              </span>
              <span className="text-slate-200 font-semibold truncate">
                توصيل سريع ومضمون لكافة المحافظات | الدفع عند الاستلام بعد المعاينة
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
              <Truck className="w-3 h-3 text-emerald-400" />
              <span>شحن مجاني على باقات التوفير المختارة</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER NAVBAR */}
      <header 
        className="h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all shadow-xs" 
        id="header-nav" 
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Right Section: Mobile Hamburger + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer outline-none focus:outline-none"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none group" 
              onClick={() => handleNavClick('home')}
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300 border border-amber-300/40">
                <span className="font-sans font-black tracking-tighter">G</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-200 rounded-full blur-[1px] opacity-75 animate-ping" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-black text-lg sm:text-xl tracking-tight font-sans text-amber-500">
                    GOLD<span className="text-[#111827]">CLEAN</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider -mt-1 font-sans">
                  للمنظفات الفاخرة
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-semibold shrink-0">
            <button 
              id="nav-home-btn"
              onClick={() => handleNavClick('home')} 
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer outline-none focus:outline-none relative ${
                currentTab === 'home' && !isMerchantOpen 
                  ? 'text-amber-600 font-bold bg-amber-50/80 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              الرئيسية
              {currentTab === 'home' && !isMerchantOpen && (
                <motion.div 
                  layoutId="activeNavTab" 
                  className="absolute bottom-0 inset-x-3 h-0.5 bg-amber-500 rounded-full" 
                />
              )}
            </button>

            <button 
              id="nav-products-btn"
              onClick={() => handleNavClick('products')} 
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer outline-none focus:outline-none relative ${
                currentTab === 'products' && !isMerchantOpen 
                  ? 'text-amber-600 font-bold bg-amber-50/80 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              منتجاتنا
              {currentTab === 'products' && !isMerchantOpen && (
                <motion.div 
                  layoutId="activeNavTab" 
                  className="absolute bottom-0 inset-x-3 h-0.5 bg-amber-500 rounded-full" 
                />
              )}
            </button>

            <button 
              id="nav-offers-btn"
              onClick={() => handleNavClick('offers')} 
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer outline-none focus:outline-none relative flex items-center gap-1.5 ${
                currentTab === 'offers' && !isMerchantOpen 
                  ? 'text-rose-600 font-bold bg-rose-50 shadow-2xs' 
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
              }`}
            >
              <span>عروض التوفير</span>
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                خصومات 🔥
              </span>
              {currentTab === 'offers' && !isMerchantOpen && (
                <motion.div 
                  layoutId="activeNavTab" 
                  className="absolute bottom-0 inset-x-3 h-0.5 bg-rose-600 rounded-full" 
                />
              )}
            </button>

            <button 
              id="nav-about-btn"
              onClick={() => { 
                setCurrentTab('about'); 
                setIsMerchantOpen?.(false); 
                window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer'); 
              }} 
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer outline-none focus:outline-none relative ${
                currentTab === 'about' && !isMerchantOpen 
                  ? 'text-amber-600 font-bold bg-amber-50/80' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              عن الشركة
            </button>

            <button 
              id="nav-complaints-btn"
              onClick={() => handleNavClick('complaints')} 
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer outline-none focus:outline-none relative ${
                currentTab === 'complaints' && !isMerchantOpen 
                  ? 'text-amber-600 font-bold bg-amber-50/80 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              الشكاوى والمقترحات
              {currentTab === 'complaints' && !isMerchantOpen && (
                <motion.div 
                  layoutId="activeNavTab" 
                  className="absolute bottom-0 inset-x-3 h-0.5 bg-amber-500 rounded-full" 
                />
              )}
            </button>

            <button 
              id="nav-tracker-btn" 
              onClick={onOpenTracker} 
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-[#111827] hover:bg-slate-50 transition-all cursor-pointer outline-none focus:outline-none flex items-center gap-1.5"
            >
              <span>طلباتي</span>
              {userOrdersCount > 0 && (
                <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {userOrdersCount}
                </span>
              )}
            </button>

            {(userRole === 'manager' || userRole === 'admin') && (
              <Link 
                id="nav-admin-btn" 
                href="/admin" 
                className={`px-3 py-1.5 rounded-xl transition-all relative cursor-pointer outline-none focus:outline-none flex items-center gap-1.5 text-xs font-bold ${
                  isMerchantOpen 
                    ? 'text-amber-700 bg-amber-100/80 border border-amber-300' 
                    : 'text-amber-600 bg-amber-50 hover:bg-amber-100/80 border border-amber-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span>إدارة المتجر ⚙️</span>
                {pendingComplaintsCount > 0 && (
                  <span 
                    className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs" 
                    title={`${pendingComplaintsCount} شكاوى جديدة بانتظار المراجعة`}
                  >
                    {pendingComplaintsCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Left Actions: Search Bar + Account Profile + Shopping Cart */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            
            {/* Prominent Search Bar (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                id="header-search"
                type="text" 
                placeholder="ابحث عن المنظفات، المعقمات..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full py-2 pr-9 pl-4 text-xs w-44 lg:w-56 xl:w-64 focus:w-64 lg:focus:w-72 xl:focus:w-80 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs font-medium"
                dir="rtl"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </form>

            <div className="h-6 w-px bg-slate-200 hidden md:block shrink-0" />

            {/* Admin / User Sign In / Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {checkingAuth ? (
                <span className="text-[10px] text-slate-400 hidden sm:inline">جاري التحقق...</span>
              ) : user ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl py-1 px-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || ''} 
                      referrerPolicy="no-referrer" 
                      className="w-7 h-7 rounded-full object-cover border border-amber-300" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold font-mono">
                      {user.displayName ? user.displayName.charAt(0) : 'A'}
                    </div>
                  )}
                  <div className="hidden xl:flex flex-col text-right">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 leading-tight">
                      <span>{user.displayName?.split(' ')[0]}</span>
                      {userRole === 'admin' ? (
                        <span className="bg-rose-100 text-rose-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">المدير العام</span>
                      ) : userRole === 'manager' ? (
                        <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.2 rounded-md font-bold">مشرف</span>
                      ) : null}
                    </div>
                    <button 
                      onClick={onSignOut} 
                      className="text-[9px] text-rose-500 hover:underline text-right leading-none mt-0.5 cursor-pointer outline-none focus:outline-none"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                  <button 
                    onClick={onSignOut} 
                    className="xl:hidden p-1 text-slate-400 hover:text-rose-500 cursor-pointer outline-none focus:outline-none"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  id="admin-portal-login-btn"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 bg-[#111827] hover:bg-amber-600 text-white font-bold py-2 px-3 sm:px-3.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs outline-none focus:outline-none"
                  title="بوابة دخول الإدارة والمشرفين"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">دخول الإدارة</span>
                </button>
              )}
            </div>

            {/* Shopping Cart Button with Dynamic Counter & Bounce */}
            <motion.button 
              id="cart-trigger-btn"
              onClick={onOpenCart}
              animate={isCartBouncing ? { scale: [1, 1.35, 0.9, 1.15, 1], rotate: [0, -8, 8, -4, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.4 }}
              className={`w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-200/80 flex items-center justify-center relative cursor-pointer transition-all outline-none focus:outline-none shrink-0 shadow-2xs group ${
                isCartBouncing ? 'ring-4 ring-amber-300 ring-offset-2' : ''
              }`}
              aria-label="سلة المشتريات"
            >
              <motion.span 
                animate={isCartBouncing ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-white font-mono shadow-xs"
              >
                {cartItemsCount}
              </motion.span>
              <ShoppingCart className="w-4.5 h-4.5 text-amber-700 group-hover:scale-105 transition-transform" />
            </motion.button>
          </div>

        </div>

        {/* 3. MOBILE SEARCH BAR (Visible only on mobile below header bar) */}
        <div className="md:hidden px-4 pb-2.5 pt-0.5">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="ابحث عن أي منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 focus:bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-slate-800 placeholder:text-slate-400"
              dir="rtl"
            />
          </form>
        </div>

        {/* 4. MOBILE DRAWER MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 px-5 py-4 shadow-xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleNavClick('home')}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                    currentTab === 'home' ? 'bg-amber-50 text-amber-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>الرئيسية</span>
                  </span>
                  <span>&larr;</span>
                </button>

                <button 
                  onClick={() => handleNavClick('products')}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                    currentTab === 'products' ? 'bg-amber-50 text-amber-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span>جميع المنتجات</span>
                  </span>
                  <span>&larr;</span>
                </button>

                <button 
                  onClick={() => handleNavClick('offers')}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                    currentTab === 'offers' ? 'bg-rose-50 text-rose-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>عروض وباقات التوفير</span>
                  </span>
                  <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">خصومات</span>
                </button>

                <button 
                  onClick={() => {
                    handleNavClick('about');
                    window.open('https://portfolio.g-c.store', '_blank', 'noopener,noreferrer');
                  }}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                    currentTab === 'about' ? 'bg-amber-50 text-amber-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>عن الشركة ومصنعنا</span>
                  </span>
                  <span>&larr;</span>
                </button>

                <button 
                  onClick={() => handleNavClick('complaints')}
                  className={`w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between ${
                    currentTab === 'complaints' ? 'bg-amber-50 text-amber-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                    <span>الشكاوى والمقترحات</span>
                  </span>
                  <span>&larr;</span>
                </button>

                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTracker();
                  }}
                  className="w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span>متابعة طلباتي</span>
                  </span>
                  {userOrdersCount > 0 && (
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                      {userOrdersCount}
                    </span>
                  )}
                </button>

                {(userRole === 'manager' || userRole === 'admin') && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-right py-2.5 px-3 rounded-xl font-bold text-xs text-amber-800 bg-amber-50 border border-amber-200 flex items-center justify-between mt-2"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-600" />
                      <span>لوحة إدارة المتجر</span>
                    </span>
                    {pendingComplaintsCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {pendingComplaintsCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
