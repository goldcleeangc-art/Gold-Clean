'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquareWarning,
  Sparkles,
  Truck,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
  Banknote,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Phone,
  MessageCircle,
  Copy,
  Check,
  X,
  Search,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  ListFilter
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeEgyptianPhone } from '../lib/shipping';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintPriority, 
  COMPLAINT_CATEGORIES, 
  COMPLAINT_STATUSES 
} from '../lib/types/complaint';

interface ComplaintsSectionProps {
  user: any;
  userOrders?: any[];
  prefilledOrderId?: string | null;
  onClearPrefilledOrder?: () => void;
  onGoToProducts?: () => void;
}

export default function ComplaintsSection({
  user,
  userOrders = [],
  prefilledOrderId = null,
  onClearPrefilledOrder,
  onGoToProducts
}: ComplaintsSectionProps) {
  // Tabs: 'new' | 'track'
  const [activeTab, setActiveTab] = useState<'new' | 'track'>('new');

  // Form states
  const [customerName, setCustomerName] = useState<string>(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || '');
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>('quality');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>('normal');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(prefilledOrderId || '');
  const [subject, setSubject] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Tracking state
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Complaint | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sync user info if user changes
  useEffect(() => {
    if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
  }, [user]);

  // Sync prefilled order ID
  useEffect(() => {
    if (prefilledOrderId) {
      setSelectedOrderId(prefilledOrderId);
      setActiveTab('new');
    }
  }, [prefilledOrderId]);

  // Load user / guest complaints for the tracking tab
  useEffect(() => {
    setLoadingComplaints(true);

    if (user && user.uid) {
      // Query logged-in user's complaints
      const q = query(collection(db, 'complaints'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setUserComplaints(list);
        setLoadingComplaints(false);
      }, (err) => {
        console.error('Error listening to user complaints:', err);
        setLoadingComplaints(false);
      });

      return () => unsubscribe();
    } else {
      // Guest visitor: load from localStorage saved IDs
      const loadGuestComplaints = async () => {
        try {
          const savedIds: string[] = JSON.parse(localStorage.getItem('goldclean_guest_complaints') || '[]');
          if (savedIds.length === 0) {
            setUserComplaints([]);
            setLoadingComplaints(false);
            return;
          }

          const loaded: Complaint[] = [];
          for (const cId of savedIds) {
            try {
              const snap = await getDoc(doc(db, 'complaints', cId));
              if (snap.exists()) {
                loaded.push({ id: snap.id, ...(snap.data() as any) });
              }
            } catch (e) {
              console.warn('Failed to load guest complaint:', cId, e);
            }
          }

          loaded.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
          setUserComplaints(loaded);
        } catch (e) {
          console.error('Error loading guest complaints from localStorage:', e);
        } finally {
          setLoadingComplaints(false);
        }
      };

      loadGuestComplaints();
    }
  }, [user]);

  // Category Icon Resolver
  const getCategoryIcon = (catId: ComplaintCategory) => {
    switch (catId) {
      case 'quality': return <PackageCheck className="w-5 h-5" />;
      case 'delivery': return <Truck className="w-5 h-5" />;
      case 'wrong_items': return <AlertTriangle className="w-5 h-5" />;
      case 'exchange_return': return <RefreshCw className="w-5 h-5" />;
      case 'payment': return <Banknote className="w-5 h-5" />;
      case 'suggestion': return <Sparkles className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  // Handle Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    const cleanName = customerName.trim();
    if (cleanName.length < 2) {
      setSubmitError('يرجى إدخال اسم العميل بشكل صحيح (حرفين على الأقل).');
      return;
    }

    const cleanedPhone = sanitizeEgyptianPhone(customerPhone, '');
    if (!cleanedPhone || !cleanedPhone.startsWith('01') || cleanedPhone.length !== 11) {
      setSubmitError('يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقم يبدأ بـ 01).');
      return;
    }

    const cleanSubject = subject.trim();
    if (cleanSubject.length < 2) {
      setSubmitError('يرجى كتابة عنوان أو موضوع للشكوى أو المقترح.');
      return;
    }

    const cleanDetails = details.trim();
    if (cleanDetails.length < 5) {
      setSubmitError('يرجى كتابة تفاصيل الشكوى (5 أحرف على الأقل) لنتمكن من مساعدتك.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate readable complaint number: GC-CMP-XXXXXX
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const complaintNumber = `GC-CMP-${randomSuffix}`;

      const payload: Omit<Complaint, 'id'> = {
        complaintNumber,
        customerName: cleanName,
        customerPhone: cleanedPhone,
        customerEmail: customerEmail.trim() || undefined,
        orderId: selectedOrderId.trim() || undefined,
        category: selectedCategory,
        priority: selectedPriority,
        subject: cleanSubject,
        details: cleanDetails,
        status: 'pending',
        userId: user?.uid || 'guest',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'complaints'), payload);

      // Save locally for guests
      if (!user) {
        try {
          const current: string[] = JSON.parse(localStorage.getItem('goldclean_guest_complaints') || '[]');
          if (!current.includes(docRef.id)) {
            current.unshift(docRef.id);
            localStorage.setItem('goldclean_guest_complaints', JSON.stringify(current.slice(0, 30)));
          }
        } catch (e) {
          console.warn('LocalStorage error saving guest complaint:', e);
        }
      }

      const createdComplaint: Complaint = {
        id: docRef.id,
        ...payload,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      setSubmittedComplaint(createdComplaint);

      // Add to current complaints list
      setUserComplaints(prev => [createdComplaint, ...prev]);

      // Reset form fields
      setSubject('');
      setDetails('');
      if (onClearPrefilledOrder) onClearPrefilledOrder();
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setSubmitError(err.message || 'حدث خطأ غير متوقع أثناء إرسال الشكوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search by complaint number or phone in Firestore
  const handleSearchComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = searchQuery.trim();
    if (!queryTerm) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      // 1. Search by exact complaint number
      const qByNumber = query(collection(db, 'complaints'), where('complaintNumber', '==', queryTerm.toUpperCase()));
      const snapNumber = await getDoc(doc(db, 'complaints', queryTerm));
      
      let found: Complaint | null = null;

      if (snapNumber.exists()) {
        found = { id: snapNumber.id, ...(snapNumber.data() as any) };
      } else {
        const snapQuery = await onSnapshot(qByNumber, () => {});
        // Fallback search in userComplaints
        const localMatch = userComplaints.find(
          c => c.complaintNumber?.toLowerCase() === queryTerm.toLowerCase() ||
               c.customerPhone === queryTerm ||
               c.orderId === queryTerm
        );
        if (localMatch) found = localMatch;
      }

      if (found) {
        setSearchResult(found);
      } else {
        setSearchError('لم يتم العثور على أي شكوى بهذا الرقم أو الهاتف. تأكد من إدخال الكود بشكل صحيح (مثل GC-CMP-123456).');
      }
    } catch (e: any) {
      console.error('Search error:', e);
      setSearchError('تعذر البحث حالياً. يرجى مراجعة الاتصال بالإنترنت.');
    } finally {
      setIsSearching(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filtered complaints for the tracking tab
  const filteredComplaints = useMemo(() => {
    if (statusFilter === 'all') return userComplaints;
    return userComplaints.filter(c => c.status === statusFilter);
  }, [userComplaints, statusFilter]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8" dir="rtl" id="complaints-view">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HERO BANNER */}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>ضمان الجودة ورضا العملاء 100%</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                مركز الشكاوى والمقترحات
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                في <strong className="text-amber-400">جولد كلين</strong>، نعتبر كل ملاحظة أو شكوى فرصة للتطور. نضمن لك دراسة مشكلتك بكل جدية وسرعة من قبل إدارة الجودة وحلها بما يرضيك تماماً.
              </p>
            </div>

            {/* Quick Guarantees Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 flex flex-col gap-2.5 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الرد والمعالجة خلال <strong>24 ساعة</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>حق الاستبدال أو الاسترجاع الفوري</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>تواصل ومتابعة مباشرة عبر الواتساب</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>تقديم شكوى أو مقترح جديد</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer relative ${
                activeTab === 'track'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>متابعة الشكاوى السابقة</span>
              {userComplaints.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {userComplaints.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: SUBMIT NEW COMPLAINT / SUGGESTION */}
        {activeTab === 'new' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-8">
            
            {/* SUCCESS MODAL / BANNER */}
            <AnimatePresence>
              {submittedComplaint && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 text-emerald-950 shadow-sm relative overflow-hidden"
                >
                  <button 
                    onClick={() => setSubmittedComplaint(null)}
                    className="absolute top-4 left-4 p-2 text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم تسجيل الشكوى بنجاح</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-emerald-900">
                        شكراً لتواصلك معنا، صوتك يهمنا جداً!
                      </h2>
                      <p className="text-xs md:text-sm text-emerald-800 leading-relaxed max-w-xl">
                        تم استلام شكواك برقم مميز، وسيقوم فريق المتابعة بفحصها والتواصل معك عبر الهاتف أو الواتساب لحلها بأسرع وقت.
                      </p>
                    </div>

                    {/* Complaint Code Card */}
                    <div className="bg-white border border-emerald-300 rounded-2xl p-4 shadow-xs shrink-0 w-full md:w-auto text-center space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold block">كود الشكوى للمتابعة:</span>
                      <div className="flex items-center justify-center gap-2 font-mono font-black text-lg text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <span>{submittedComplaint.complaintNumber}</span>
                        <button
                          onClick={() => handleCopyCode(submittedComplaint.complaintNumber)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                          title="نسخ الكود"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setSubmittedComplaint(null);
                            setActiveTab('track');
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
                        >
                          متابعة حالة الشكوى الآن
                        </button>

                        <a
                          href={`https://wa.me/201000000000?text=${encodeURIComponent(
                            `مرحباً خدمة عملاء جولد كلين، قمت بتقديم شكوى برقم (${submittedComplaint.complaintNumber}) بخصوص: ${submittedComplaint.subject}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>مراسلة واتساب فوراً</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              
              {/* Category Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>ما هو موضوع الشكوى أو المقترح؟ *</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-semibold">اختر الفئة الأنسب</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {COMPLAINT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`text-right p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {getCategoryIcon(cat.id)}
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-bold text-xs ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                            {cat.label}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم بالكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>رقم الهاتف / الواتساب للتواصل *</span>
                    <span className="text-[10px] text-slate-400">11 رقم يبدأ بـ 01</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01012345678"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-right"
                  />
                </div>
              </div>

              {/* Optional Email & Linked Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>البريد الإلكتروني (اختياري)</span>
                    <span className="text-[10px] text-slate-400">لتلقي تحديثات الحل</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>رقم الطلب المرتبط بالشكوى (اختياري)</span>
                    {userOrders.length > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">لديك {userOrders.length} طلبات مسجلة</span>
                    )}
                  </label>

                  {userOrders.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                      >
                        <option value="">-- الشكوى عامة / لا ترتبط بطلب محدد --</option>
                        {userOrders.map((ord) => (
                          <option key={ord.id} value={ord.id}>
                            طلب #{ord.id?.slice(0, 8)}... - بقيمة {ord.totalPrice} ج.م ({new Date(ord.createdAt?.seconds ? ord.createdAt.seconds * 1000 : Date.now()).toLocaleDateString('ar-EG')})
                          </option>
                        ))}
                      </select>
                      {selectedOrderId && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-blue-50/60 border border-blue-200/60 px-2.5 py-1 rounded-lg">
                          <span>سيتم ربط الشكوى بالطلب: #{selectedOrderId.slice(0, 10)}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId('')}
                            className="text-rose-500 hover:underline font-bold"
                          >
                            إلغاء الربط
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      placeholder="مثال: GC-10294 أو اتركه فارغاً"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                    />
                  )}
                </div>
              </div>

              {/* Priority Picker */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">درجة أهمية الشكوى:</span>
                  <span className="text-[11px] text-slate-400">حدد إن كانت المشكلة تتطلب تدخلاً عاجلاً</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('normal')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedPriority === 'normal'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    عادية (المسار الطبيعي)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPriority('urgent')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedPriority === 'urgent'
                        ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                        : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span>🚨 عاجلة (أولوية قصوى)</span>
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان أو موضوع الشكوى *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: تأخر استلام شحنة المنظفات، أو نقص عبوة معطر"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                />
              </div>

              {/* Details Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>تفاصيل الشكوى أو المقترح بالكامل *</span>
                  <span className="text-[10px] text-slate-400">{details.length} حرف</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="يرجى كتابة كافة التفاصيل التي تساعدنا على فهم المشكلة وحلها فوراً (اسم المنتج، تاريخ الاستلام، ملاحظاتك على الجودة أو المندوب...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جاري إرسال الشكوى وتوليد كود المتابعة...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال الشكوى لفريق خدمة العملاء والجودة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: TRACK PREVIOUS COMPLAINTS */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            
            {/* SEARCH COMPLAINT BOX */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-500" />
                <span>البحث عن شكوى سابقة</span>
              </h2>
              <p className="text-[11px] text-slate-400 mb-4">
                أدخل كود الشكوى (مثل GC-CMP-123456) أو رقم الهاتف المسجل للاطلاع على الرد ومراحل المعالجة.
              </p>

              <form onSubmit={handleSearchComplaint} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="كود الشكوى أو رقم الهاتف..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-slate-900 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSearching ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>بحث</span>
                </button>
              </form>

              {searchError && (
                <div className="mt-3 text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {searchError}
                </div>
              )}
            </div>

            {/* SEARCH RESULT DISPLAY */}
            {searchResult && (
              <div className="bg-amber-50/60 border-2 border-amber-400 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                      {searchResult.complaintNumber}
                    </span>
                    <span className="text-xs font-bold text-amber-950">نتيجة البحث</span>
                  </div>
                  <button
                    onClick={() => setSearchResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    إغلاق النتيجة ✕
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{searchResult.subject}</h3>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${COMPLAINT_STATUSES[searchResult.status]?.badgeClass}`}>
                      {COMPLAINT_STATUSES[searchResult.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {searchResult.details}
                  </p>

                  {/* Admin Reply */}
                  {searchResult.adminReply ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>رد إدارة جولد كلين:</span>
                      </div>
                      <p className="leading-relaxed pr-5">{searchResult.adminReply}</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
                      ⏳ جاري فحص ومتابعة الشكوى من قبل الإدارة وسيتم إرسال الرد والتواصل معك قريباً.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MY COMPLAINTS LIST */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-amber-500" />
                    <span>سجل الشكاوى والمقترحات</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    كافة البلاغات المسجلة من جهازك أو حسابك وحالتها المحدثة لحظياً
                  </p>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'pending', label: 'قيد الانتظار' },
                    { id: 'in_progress', label: 'جاري المعالجة' },
                    { id: 'resolved', label: 'تم الحل' },
                    { id: 'rejected', label: 'مغلقة' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === filter.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complaints List Content */}
              {loadingComplaints ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">جاري تحميل سجل الشكاوى...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="py-12 text-center max-w-sm mx-auto space-y-4">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquareWarning className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">لا توجد شكاوى مسجلة حالياً</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      إذا واجهتك أي مشكلة في جودة المنظفات أو التوصيل، يمكنك تقديم شكوى جديدة وسنعمل على حلها فوراً.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>تقديم شكوى أو مقترح الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map((c) => {
                    const statusInfo = COMPLAINT_STATUSES[c.status] || COMPLAINT_STATUSES.pending;
                    const catInfo = COMPLAINT_CATEGORIES.find(cat => cat.id === c.category);
                    const formattedDate = c.createdAt?.seconds 
                      ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'الآن';

                    return (
                      <div
                        key={c.id || c.complaintNumber}
                        className="bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 transition-all shadow-xs space-y-4"
                      >
                        {/* Top row: Code, Category, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg">
                              {c.complaintNumber}
                            </span>
                            {catInfo && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.badgeColor}`}>
                                {catInfo.label}
                              </span>
                            )}
                            {c.priority === 'urgent' && (
                              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">
                                🚨 عاجل
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Subject & Details */}
                        <div className="space-y-1.5">
                          <h3 className="font-black text-sm text-slate-900 leading-snug">
                            {c.subject}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/50">
                            {c.details}
                          </p>
                        </div>

                        {/* Order info if linked */}
                        {c.orderId && (
                          <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>مرتبطة بالطلب رقم: <strong className="font-mono">{c.orderId}</strong></span>
                          </div>
                        )}

                        {/* Admin Reply Box */}
                        {c.adminReply && (
                          <div className="bg-emerald-50 border-r-4 border-emerald-500 rounded-xl p-4 text-emerald-950 space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>رد إدارة جولد كلين:</span>
                              </span>
                              <span className="text-[10px] font-normal text-emerald-600">
                                {c.adminReplyAt?.seconds ? new Date(c.adminReplyAt.seconds * 1000).toLocaleDateString('ar-EG') : 'حديثاً'}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-900 leading-relaxed pr-5">
                              {c.adminReply}
                            </p>
                          </div>
                        )}

                        {/* Bottom Row: Timestamp + Quick WhatsApp Button */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>تاريخ التقديم: {formattedDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCode(c.complaintNumber)}
                              className="text-slate-500 hover:text-slate-800 font-bold transition-colors flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:border-slate-300"
                            >
                              <Copy className="w-3 h-3" />
                              <span>نسخ الرقم</span>
                            </button>

                            <a
                              href={`https://wa.me/201000000000?text=${encodeURIComponent(
                                `مرحباً، أود متابعة الشكوى رقم (${c.complaintNumber}) الخاصة بي: ${c.subject}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold transition-colors flex items-center gap-1.5 px-3 py-1 rounded-lg"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>متابعة عبر واتساب</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIRECT SUPPORT & CONTACT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">واتساب خدمة العملاء</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">رد فوري على الاستفسارات العاجلة</p>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 mt-1"
              >
                <span>محادثة فورية</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">الاتصال المباشر</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">يومياً من 9:00 ص إلى 10:00 م</p>
              <span className="text-[11px] text-blue-600 font-bold font-mono mt-1 block">
                متاح لكافة محافظات مصر
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">سياسة الاستبدال</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">خلال 14 يوماً من استلام الطلب</p>
              <span className="text-[11px] text-amber-600 font-bold mt-1 block">
                استبدال مجاني في حال عيوب التصنيع
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
