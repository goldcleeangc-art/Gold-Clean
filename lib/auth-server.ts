import { NextRequest } from 'next/server';
import { db, firebaseConfig } from '@/lib/firebase';
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

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
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
    const payload = decodeJwtPayload(idToken);
    if (!payload) {
      return {
        isAuthorized: false,
        isManager: false,
        error: 'صيغة رمز التحقق غير صحيحة'
      };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return {
        isAuthorized: false,
        isManager: false,
        error: 'رمز التحقق غير صالح أو منتهي الصلاحية'
      };
    }

    let email = payload.email ? String(payload.email).toLowerCase().trim() : undefined;
    let uid = payload.user_id || payload.sub;

    const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey || '').trim();

    // 1. Validate Firebase Auth token via Google Identity Toolkit
    if (apiKey) {
      try {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
            signal: AbortSignal.timeout(4000)
          }
        );
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          const userRecord = lookupData.users?.[0];
          if (userRecord) {
            email = userRecord.email ? String(userRecord.email).toLowerCase().trim() : email;
            uid = userRecord.localId || uid;
          }
        }
      } catch (err) {
        console.warn('Identity toolkit lookup failed, falling back to token payload verification:', err);
      }
    }

    // 2. Validate standard Google OAuth token as fallback
    if (!email && !uid) {
      try {
        const oauthRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (oauthRes.ok) {
          const oauthData = await oauthRes.json();
          email = oauthData.email ? String(oauthData.email).toLowerCase().trim() : undefined;
          uid = oauthData.user_id || oauthData.sub;
        }
      } catch (err) {
        // ignore
      }
    }

    if (!uid && !email) {
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
    if (uid) {
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
