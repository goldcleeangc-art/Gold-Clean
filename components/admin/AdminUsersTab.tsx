'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface AdminUsersTabProps {
  allUsers: any[];
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  handleChangeUserRole: (userId: string, newRole: string) => Promise<void>;
}

export default function AdminUsersTab({
  allUsers,
  userSearchQuery,
  setUserSearchQuery,
  handleChangeUserRole
}: AdminUsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">صلاحيات المستخدمين</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">يمكنك تنشيط المشرفين أو إلغاء صلاحياتهم.</p>
        </div>
        <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-100">
          الإجمالي: {allUsers.length}
        </span>
      </div>

      <div className="mb-2">
        <input
          type="text"
          placeholder="ابحث بواسطة البريد الإلكتروني..."
          value={userSearchQuery}
          onChange={(e) => setUserSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allUsers.filter(u => u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())).map((u) => (
          <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="overflow-hidden">
                <h5 className="font-bold text-slate-800 text-xs truncate">{u.name || 'مستخدم'}</h5>
                <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
              <span className={`text-[10px] px-2 py-1 object-fit rounded-md font-bold ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {u.role === 'admin' ? 'مدير عام' : u.role === 'manager' ? 'مشرف متجر' : 'عميل'}
              </span>
              
              {u.role !== 'admin' && (
                <div className="flex gap-2">
                  {u.role !== 'manager' ? (
                    <button
                      onClick={() => handleChangeUserRole(u.id, 'manager')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold text-[10px] rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      ترقية كمشرف
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangeUserRole(u.id, 'user')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    >
                      تجريد للمستخدم
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
