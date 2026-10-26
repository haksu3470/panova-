'use client';

import { UserPlus, Trash2, Key } from 'lucide-react';
import DemoBadge from './DemoBadge';

interface StaffTabProps {
  staffMembers: any[];
  isUpperManagement: boolean;
  t: any;
  newStaffName: string;
  setNewStaffName: (val: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (val: string) => void;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffRoleLevel: string;
  setNewStaffRoleLevel: (val: string) => void;
  handleAddStaff: (e: React.FormEvent) => void;
  updateStaffRoleLevel: (staffId: string, newLevel: string) => void;
  setEditingStaff: (staff: any) => void;
  handleDeleteStaff: (staffId: string) => void;
}

export default function StaffTab({
  staffMembers,
  isUpperManagement,
  t,
  newStaffName,
  setNewStaffName,
  newStaffEmail,
  setNewStaffEmail,
  newStaffPassword,
  setNewStaffPassword,
  newStaffRoleLevel,
  setNewStaffRoleLevel,
  handleAddStaff,
  updateStaffRoleLevel,
  setEditingStaff,
  handleDeleteStaff
}: StaffTabProps) {
  if (!isUpperManagement) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center text-slate-500 text-sm">
        Bu alanı görüntülemek için Üst Yönetim (Upper Management) yetkisi gereklidir.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-700" /> {t.addStaffTitle}
        </h3>
        <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffNameLabel}</label>
            <input type="text" required value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Ahmet Yilmaz" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffEmailLabel}</label>
            <input type="email" required value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} placeholder="ahmet@panova.com" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 leading-snug">Şifre burada belirlenmez. Personel bu e-posta ile Supabase Auth hesabı oluşturup giriş yapar.</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffPermLabel}</label>
            <select 
              value={newStaffRoleLevel} 
              onChange={(e) => setNewStaffRoleLevel(e.target.value)} 
              className="w-full px-3.5 py-3 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              <option value="upper_management" className="text-slate-900 bg-white">👑 {t.roleUpperManagement}</option>
              <option value="source_country" className="text-slate-900 bg-white">🌍 {t.roleSourceCountry}</option>
              <option value="target_country" className="text-slate-900 bg-white">🏢 {t.roleTargetCountry}</option>
              <option value="field_officer" className="text-slate-900 bg-white">✈️ {t.roleFieldOfficer}</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition cursor-pointer shadow-md text-xs sm:text-sm">
            {t.saveStaffBtn}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>{t.staffMatrixTitle}</span>
          <span className="text-[11px] font-normal text-slate-500">{t.staffMatrixSub}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">{staff.name}<DemoBadge show={staff.is_demo} /></h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingStaff(staff)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer">Edit / Pwd</button>
                    <button onClick={() => handleDeleteStaff(staff.id)} className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{staff.email}</p>
                <p className="text-[11px] text-slate-400 font-mono">Password: ••••••••</p>
              </div>

              <div className="pt-2 border-t space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {t.permLevelText}
                </span>
                <select
                  value={staff.role_level || 'source_country'}
                  onChange={(e) => updateStaffRoleLevel(staff.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white text-slate-900 cursor-pointer outline-none shadow-sm"
                >
                  <option value="upper_management" className="text-slate-900 bg-white">👑 {t.roleUpperManagement}</option>
                  <option value="source_country" className="text-slate-900 bg-white">🌍 {t.roleSourceCountry}</option>
                  <option value="target_country" className="text-slate-900 bg-white">🏢 {t.roleTargetCountry}</option>
                  <option value="field_officer" className="text-slate-900 bg-white">✈️ {t.roleFieldOfficer}</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}