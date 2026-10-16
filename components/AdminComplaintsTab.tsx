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
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  Edit3,
  Calendar,
  User,
  ShoppingBag
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES
} from '../lib/types/complaint';

interface AdminComplaintsTabProps {
  userRole?: 'admin' | 'manager' | 'user';
  allOrders?: any[];
}

export default function AdminComplaintsTab({
  userRole = 'manager',
  allOrders = []
}: AdminComplaintsTabProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Active expanded or replying complaint ID
  const [replyingComplaintId, setReplyingComplaintId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [autoResolveOnReply, setAutoResolveOnReply] = useState<boolean>(true);
  const [isSavingReply, setIsSavingReply] = useState<boolean>(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);

  // Deletion Confirmation Modal
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Real-time listener for complaints
  useEffect(() => {
    setLoading(true);
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setComplaints(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching complaints in admin:', error);
        // Fallback without orderBy if index is building
        const fallbackSub = onSnapshot(complaintsRef, (snapshot) => {
          const list: Complaint[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as any) });
          });
          list.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
          setComplaints(list);
          setLoading(false);
        });
        return () => fallbackSub();
      }
    );

    return () => unsubscribe();
  }, []);

  // Update complaint status
  const handleUpdateStatus = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const docRef = doc(db, 'complaints', complaintId);
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      if (newStatus === 'resolved') {
        updates.resolvedAt = serverTimestamp();
      }
      await updateDoc(docRef, updates);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('حدث خطأ أثناء تحديث حالة الشكوى: ' + (err.message || err));
    }
  };

  // Submit admin reply
  const handleSaveReply = async (complaint: Complaint) => {
    if (!complaint.id) return;
    const cleanReply = replyText.trim();
    if (!cleanReply) {
      alert('يرجى كتابة نص الرد قبل الحفظ.');
      return;
    }

    setIsSavingReply(true);
    try {
      const docRef = doc(db, 'complaints', complaint.id);
      const updates: any = {
        adminReply: cleanReply,
        adminReplyAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (autoResolveOnReply) {
        updates.status = 'resolved';
        updates.resolvedAt = serverTimestamp();
      } else if (complaint.status === 'pending') {
        updates.status = 'in_progress';
      }

      await updateDoc(docRef, updates);

      setReplySuccessMsg('تم حفظ الرد وتحديث حالة الشكوى بنجاح!');
      setTimeout(() => setReplySuccessMsg(null), 3000);
      setReplyingComplaintId(null);
      setReplyText('');
    } catch (err: any) {
      console.error('Error saving admin reply:', err);
      alert('فشل حفظ الرد: ' + (err.message || err));
    } finally {
      setIsSavingReply(false);
    }
  };

  // Delete complaint
  const handleConfirmDelete = async () => {
    if (!complaintToDelete || !complaintToDelete.id) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'complaints', complaintToDelete.id));
      setComplaintToDelete(null);
    } catch (err: any) {
      console.error('Error deleting complaint:', err);
      alert('فشل حذف الشكوى: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'pending').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const urgent = complaints.filter((c) => c.priority === 'urgent' && c.status !== 'resolved').length;

    return { total, pending, inProgress, resolved, urgent };
  }, [complaints]);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (c.complaintNumber || '').toLowerCase();
        const name = (c.customerName || '').toLowerCase();
        const phone = (c.customerPhone || '').toLowerCase();
        const orderId = (c.orderId || '').toLowerCase();
        const subj = (c.subject || '').toLowerCase();
        const details = (c.details || '').toLowerCase();

        return (
          num.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          orderId.includes(q) ||
          subj.includes(q) ||
          details.includes(q)
        );
      }

      return true;
    });
  }, [complaints, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl" id="admin-complaints-tab">
      
      {/* HEADER & METRIC SUMMARY CARDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-amber-500" />
            <span>إدارة الشكاوى والمقترحات</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة بلاغات واستفسارات العملاء، الرد عليها، والارتقاء بجودة الخدمة
          </p>
        </div>

        {replySuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{replySuccessMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي الشكاوى</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 block">قيد الانتظار (جديدة)</span>
          <div className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-2">
            <span>{stats.pending}</span>
            {stats.pending > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 block">جاري المعالجة</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.inProgress}</div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 block">تم الحل والمعالجة</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-700 block">شكاوى عاجلة غير محلولة</span>
          <div className="text-2xl font-black text-rose-600 mt-1 flex items-center gap-1.5">
            <span>{stats.urgent}</span>
            {stats.urgent > 0 && <span className="text-sm">🚨</span>}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        
        {/* Search input + Category & Priority Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الشكوى، اسم العميل، الهاتف، رقم الطلب، أو الموضوع..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-sans"
            >
              <option value="all">كل فئات الشكاوى</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-sans"
            >
              <option value="all">كل درجات الأهمية</option>
              <option value="urgent">🚨 عاجلة فقط</option>
              <option value="normal">عادية</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { id: 'all', label: 'الكل', count: stats.total },
            { id: 'pending', label: 'قيد الانتظار', count: stats.pending, alert: stats.pending > 0 },
            { id: 'in_progress', label: 'جاري المعالجة', count: stats.inProgress },
            { id: 'resolved', label: 'تم الحل', count: stats.resolved },
            { id: 'rejected', label: 'مغلقة' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    statusFilter === tab.id
                      ? 'bg-slate-950 text-white'
                      : tab.alert
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* COMPLAINTS LIST */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">جاري تحميل الشكاوى من قاعدة البيانات...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="py-16 bg-white border border-slate-200 rounded-3xl text-center max-w-md mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">لا توجد شكاوى مطابقة للبحث أو التصفية</h3>
          <p className="text-xs text-slate-400">
            كافة الشكاوى تحت السيطرة أو لا توجد نتائج للبحث الحالي.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((c) => {
            const statusInfo = COMPLAINT_STATUSES[c.status] || COMPLAINT_STATUSES.pending;
            const catInfo = COMPLAINT_CATEGORIES.find((cat) => cat.id === c.category);
            const isReplying = replyingComplaintId === c.id;

            // Formatted date
            const formattedDate = c.createdAt?.seconds
              ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'الآن';

            // Find associated order details if available
            const linkedOrder = c.orderId ? allOrders.find((o) => o.id === c.orderId) : null;

            // WhatsApp message link
            const whatsappText = encodeURIComponent(
              `مرحباً أستاذ/ة ${c.customerName}،\nنتواصل معك من إدارة وخدمة عملاء جولد كلين بخصوص الشكوى المسجلة برقم (${c.complaintNumber}):\n"${c.subject}".\nنود متابعة المشكلة معك...`
            );
            const cleanPhone = (c.customerPhone || '').replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/20${cleanPhone.replace(/^0+/, '')}?text=${whatsappText}`;

            return (
              <div
                key={c.id || c.complaintNumber}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-4 ${
                  c.priority === 'urgent' && c.status !== 'resolved'
                    ? 'border-rose-300 ring-2 ring-rose-200/50'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Row: Code, Badges, Status changer, Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg">
                      {c.complaintNumber}
                    </span>

                    {catInfo && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.badgeColor}`}>
                        {catInfo.label}
                      </span>
                    )}

                    {c.priority === 'urgent' && (
                      <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                        🚨 عاجلة
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-2">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  {/* Status Dropdown & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                      <select
                        value={c.status}
                        onChange={(e) => c.id && handleUpdateStatus(c.id, e.target.value as ComplaintStatus)}
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                      >
                        <option value="pending">⏳ قيد الانتظار</option>
                        <option value="in_progress">🛠️ جاري المعالجة</option>
                        <option value="resolved">✅ تم الحل</option>
                        <option value="rejected">❌ مغلقة</option>
                      </select>
                    </div>

                    {userRole === 'admin' && (
                      <button
                        onClick={() => setComplaintToDelete(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف الشكوى نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Contact Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">اسم العميل:</span>
                      <strong className="text-slate-800">{c.customerName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">رقم الهاتف:</span>
                      <strong className="text-slate-800 font-mono" dir="ltr">{c.customerPhone}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        title="فتح محادثة واتساب جاهزة"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                      <a
                        href={`tel:${c.customerPhone}`}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-1.5 rounded-lg transition-colors"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {c.customerEmail && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">البريد الإلكتروني:</span>
                      <span className="text-slate-700 font-mono text-[11px] truncate block" dir="ltr">
                        {c.customerEmail}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subject & Complaint Details */}
                <div className="space-y-1.5">
                  <h3 className="font-black text-sm text-slate-900 leading-snug">
                    {c.subject}
                  </h3>
                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 whitespace-pre-line">
                    {c.details}
                  </div>
                </div>

                {/* Linked Order Badge / Details */}
                {c.orderId && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        مرتبطة بالطلب رقم: <strong className="font-mono">{c.orderId}</strong>
                        {linkedOrder && (
                          <span className="mr-2 text-blue-700 font-normal">
                            ({linkedOrder.customerCity} • {linkedOrder.totalPrice} ج.م • {linkedOrder.items?.length || 0} أصناف)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Existing Admin Reply View */}
                {c.adminReply && !isReplying && (
                  <div className="bg-emerald-50 border-r-4 border-emerald-500 rounded-xl p-4 text-emerald-950 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>رد الإدارة الحالي:</span>
                      </span>
                      <button
                        onClick={() => {
                          setReplyingComplaintId(c.id || null);
                          setReplyText(c.adminReply || '');
                        }}
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>تعديل الرد</span>
                      </button>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed pr-5">
                      {c.adminReply}
                    </p>
                  </div>
                )}

                {/* Reply Composer Form */}
                {isReplying ? (
                  <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-amber-600" />
                        <span>كتابة رد الإدارة الموجه للعميل:</span>
                      </label>
                      <button
                        onClick={() => {
                          setReplyingComplaintId(null);
                          setReplyText('');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        إلغاء ✕
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك الواضح للعميل (مثال: نعتذر جداً عن التأخير، تم التواصل مع مندوب الشحن وسيصلك الطلب اليوم مع هدية ترضية...)"
                      className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed font-sans"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoResolveOnReply}
                          onChange={(e) => setAutoResolveOnReply(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span>تغيير حالة الشكوى تلقائياً إلى &quot;تم الحل والمعالجة&quot;</span>
                      </label>

                      <button
                        onClick={() => handleSaveReply(c)}
                        disabled={isSavingReply || !replyText.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-5 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSavingReply ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>حفظ وإرسال الرد</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  !c.adminReply && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setReplyingComplaintId(c.id || null);
                          setReplyText('');
                        }}
                        className="bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>الرد على هذه الشكوى</span>
                      </button>
                    </div>
                  )
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {complaintToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setComplaintToDelete(null)}
              className="absolute inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-right space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900">
                  تأكيد حذف الشكوى نهائياً
                </h3>
                <p className="text-xs text-slate-500">
                  هل أنت متأكد من حذف الشكوى رقم{' '}
                  <strong className="font-mono text-slate-900">{complaintToDelete.complaintNumber}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setComplaintToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>نعم، حذف نهائي</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
