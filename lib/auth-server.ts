import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'jalalmahmoud8000@gmail.com',
  'jalalmahmoud8000%40gmail.com'
].filter(Boolean) as string[];

export interface AuthVerificationResult {
  isAuthorized: boolean;
  isManager: boolean;
  email?: string;
  uid?: string;
  error?: string;
}

/**
 * Verifies if the request carries a valid Google/Firebase ID Token 
 * and belongs to an authorized Manager or Admin.
 */
export async function verifyManagerAuth(req: NextRequest): Promise<AuthVerificationResult> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isAuthorized: false,
      isManager: false,
      error: 'لم يتم توفير رمز التحقق الأمني (Missing Authorization Header)'
    };
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return {
      isAuthorized: false,
      isManager: false,
      error: 'رمز التحقق الأمني فارغ (Empty ID Token)'
    };
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      return {
        isAuthorized: false,
        isManager: false,
        error: 'رمز التحقق غير صالح أو منتهي الصلاحية'
      };
    }

    const payload = await res.json();
    const email = payload.email ? String(payload.email).toLowerCase() : undefined;
    const uid = payload.user_id || payload.sub;

    if (!uid) {
      return {
        isAuthorized: false,
        isManager: false,
        error: 'تعذر التحقق من هوية المستخدم'
      };
    }

    // 1. Direct master admin email match
    if (email && ADMIN_EMAILS.some(adm => adm.toLowerCase() === email)) {
      return {
        isAuthorized: true,
        isManager: true,
        email,
        uid
      };
    }

    // 2. Check Firestore users collection role
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.role === 'manager' || userData?.role === 'admin') {
          return {
            isAuthorized: true,
            isManager: true,
            email: email || userData.email,
            uid
          };
        }
      }
    } catch (dbErr) {
      console.warn('Error reading user role from Firestore:', dbErr);
    }

    return {
      isAuthorized: false,
      isManager: false,
      email,
      uid,
      error: 'المستخدم لا يملك صلاحية مدير أو مشرف'
    };
  } catch (error: any) {
    console.error('Error during token verification:', error);
    return {
      isAuthorized: false,
      isManager: false,
      error: error.message || 'حدث خطأ أثناء التحقق الأمني'
    };
  }
}
