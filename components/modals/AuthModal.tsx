'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  authError: string | null;
}

export default function AuthModal({
  isOpen,
  onClose,
  onGoogleSignIn,
  authError
}: AuthModalProps) {
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
          id="auth-modal-overlay"
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 border border-slate-100"
          id="auth-modal-window"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-right" dir="rtl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>خاص بالإدارة والمشرفين</span>
            </div>
            <h3 className="font-black text-slate-900 text-lg">بوابة تسجيل دخول الإدارة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هذه البوابة مخصصة حصرياً لمدراء ومشرفي متجر Gold Clean لمتابعة الطلبات، تعديل المنتجات، الأسعار، العروض، وإدارة المتجر.
            </p>
          </div>

          <div className="pt-2">
            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-right text-xs text-rose-800 leading-relaxed mb-3" dir="rtl" id="auth-error-banner">
                {authError}
              </div>
            )}
            <button 
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-all duration-200 cursor-pointer hover:shadow-sm"
              dir="rtl"
            >
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.12-4.53-1.19-7.06z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>تسجيل الدخول كمسؤول / مدير (Google)</span>
            </button>
          </div>

          <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-right text-[11px] text-blue-950" dir="rtl">
            <strong>🛍️ للعملاء والزبائن:</strong> يمكنك إضافة أي منتجات إلى سلتك وتأكيد طلبك مباشرة بالدفع عند الاستلام دون الحاجة لتسجيل الدخول.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
