export type ComplaintCategory = 
  | 'quality'           // مشكلة في جودة المنتج أو التغليف
  | 'delivery'          // تأخير أو مشكلة في التوصيل والشحن
  | 'wrong_items'       // خطأ أو نقص في الأصناف المستلمة
  | 'exchange_return'   // طلب استبدال أو استرجاع
  | 'payment'           // مشكلة في الدفع أو الفواتير
  | 'suggestion'        // مقترح أو فكرة لتطوير المنتجات
  | 'other';            // استفسار أو شكوى أخرى

export type ComplaintPriority = 'normal' | 'urgent';

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export interface Complaint {
  id?: string;
  complaintNumber: string; // e.g. GC-CMP-82914
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderId?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  details: string;
  status: ComplaintStatus;
  adminReply?: string;
  adminReplyAt?: any;
  resolvedAt?: any;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const COMPLAINT_CATEGORIES: {
  id: ComplaintCategory;
  label: string;
  icon: string;
  description: string;
  badgeColor: string;
}[] = [
  {
    id: 'quality',
    label: 'جودة المنتج والتغليف',
    icon: 'PackageCheck',
    description: 'رائحة، قوام، فاعلية، تلف في العبوة أو تسريب',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'delivery',
    label: 'الشحن والتوصيل',
    icon: 'Truck',
    description: 'تأخير الاستلام، تعامل مندوب الشحن، العنوان',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'wrong_items',
    label: 'خطأ أو نقص في الطلب',
    icon: 'AlertTriangle',
    description: 'منتج مفقود، استلام منتج مختلف عن المطلوب',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  {
    id: 'exchange_return',
    label: 'طلب استبدال أو استرجاع',
    icon: 'RefreshCw',
    description: 'استبدال منتج بآخر، أو استرجاع واسترداد المبلغ',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'payment',
    label: 'الدفع والفواتير',
    icon: 'Banknote',
    description: 'حساب غير دقيق، تأكيد تحويل، مشكلة في الفاتورة',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'suggestion',
    label: 'مقترح أو فكرة تطوير',
    icon: 'Sparkles',
    description: 'فكرة لمنتج جديد، تحسين تجربة التسوق أو الخدمة',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    id: 'other',
    label: 'شكوى أو استفسار عام',
    icon: 'HelpCircle',
    description: 'أي موضوع أو استفسار آخر ترغب في طرحه',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  }
];

export const COMPLAINT_STATUSES: Record<ComplaintStatus, {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}> = {
  pending: {
    label: 'قيد الانتظار',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'تم استلام الشكوى وبانتظار المراجعة من فريق خدمة العملاء'
  },
  in_progress: {
    label: 'جاري المعالجة والمتابعة',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'الفريق المختص يعمل حالياً على فحص المشكلة وحلها'
  },
  resolved: {
    label: 'تم الحل والمعالجة',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'تمت معالجة الشكوى والتواصل بالحل النهائي'
  },
  rejected: {
    label: 'مغلقة',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    description: 'تم إغلاق ملف الشكوى'
  }
};
