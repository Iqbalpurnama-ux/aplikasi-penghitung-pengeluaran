import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Download, 
  User, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Database,
  Upload,
  Printer,
  Plus,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { CategoryBudget } from '../../types';

interface SettingsTabProps {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  currency: 'IDR' | 'USD' | 'SGD';
  handleCurrencyChange: (c: 'IDR' | 'USD' | 'SGD') => void;
  exportToCSV: () => void;
  budget: number;
  totalTransactions: number;
  onResetData: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  categoryBudgets: CategoryBudget[];
  onSaveCategoryBudgets: (budgets: CategoryBudget[]) => void;
  onBackupData: () => void;
  onRestoreData: (file: File) => void;
  onPrintReport: () => void;
  userName: string;
  user: any | null;
  onGoogleLogin: () => void;
  onLogout: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  privacyMode,
  togglePrivacyMode,
  currency,
  handleCurrencyChange,
  exportToCSV,
  budget,
  totalTransactions,
  onResetData,
  darkMode,
  toggleDarkMode,
  categoryBudgets,
  onSaveCategoryBudgets,
  onBackupData,
  onRestoreData,
  onPrintReport,
  userName,
  user,
  onGoogleLogin,
  onLogout
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('Makanan');
  const [editingLimit, setEditingLimit] = useState<string>('');

  const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Lainnya', 'Gaji', 'Bonus', 'Investasi'];

  const storageUsage = Math.round((JSON.stringify(localStorage).length / 1024) * 100) / 100;

  const handleAddCategoryBudget = () => {
    if (!editingLimit || isNaN(parseInt(editingLimit))) return;
    const limit = parseInt(editingLimit);
    const existing = categoryBudgets.filter(b => b.category !== editingCategory);
    onSaveCategoryBudgets([...existing, { category: editingCategory, limit }]);
    setEditingLimit('');
  };

  const removeCategoryBudget = (cat: string) => {
    onSaveCategoryBudgets(categoryBudgets.filter(b => b.category !== cat));
  };

  return (
    <div className="space-y-6 px-4 pb-32">
      {/* Profile Section */}
      <div className="comic-card bg-indigo-vibrant text-true-white p-6 relative overflow-hidden group">
        <div className="absolute inset-0 half-tone opacity-20 transition-opacity group-hover:opacity-30" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-outline shadow-[4px_4px_0_var(--shadow-color)]">
            <User className="w-8 h-8 text-indigo-vibrant stroke-[3]" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter drop-shadow-[2px_2px_0_var(--shadow-color)]">
              {userName || 'PENGGUNA'}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
              {totalTransactions} TRANSAKSI TERCATAT
            </p>
          </div>
          {user && (
            <button 
              onClick={onLogout}
              className="ml-auto p-2 bg-coral text-white rounded-xl border-2 border-outline shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cloud Sync Section */}
      {!user && (
        <div className="comic-card bg-sun p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl border-4 border-outline flex items-center justify-center text-2xl shadow-[4px_4px_0_var(--shadow-color)]">
              ☁️
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tighter italic">SINKRONISASI CLOUD</h3>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Cadangkan data Anda secara otomatis</p>
            </div>
          </div>
          <button 
            onClick={onGoogleLogin}
            className="w-full bg-white text-ink comic-button py-4 font-black uppercase tracking-widest shadow-[4px_4px_0_var(--shadow-color)] flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            MASUK DENGAN GOOGLE
          </button>
        </div>
      )}

      {/* Main Settings */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-black text-ink uppercase italic -rotate-1 tracking-tighter flex items-center gap-3 ml-2">
          <SettingsIcon className="w-5 h-5 text-ink" /> PREFERENSI
        </h3>


        {/* Currency Selection */}
        <div className="comic-card bg-white p-5 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">MATA UANG UTAMA</label>
          <div className="flex gap-2">
            {(['IDR', 'USD', 'SGD'] as const).map(c => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={cn(
                  "flex-1 py-3 border-4 border-outline rounded-xl font-black transition-all",
                  currency === c 
                    ? "bg-sun text-true-ink shadow-[4px_4px_0_var(--shadow-color)]" 
                    : "bg-transparent text-ink/40 border-outline/20 hover:border-outline/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Category Budgets */}
        <div className="comic-card bg-white p-5 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-ink/40">ANGGARAN KATEGORI</label>
          <div className="space-y-3">
            {categoryBudgets.map(b => (
              <div key={b.category} className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border-2 border-outline">
                <div>
                  <p className="text-[10px] font-black uppercase">{b.category}</p>
                  <p className="text-sm font-black text-coral">{currency} {b.limit.toLocaleString()}</p>
                </div>
                <button onClick={() => removeCategoryBudget(b.category)} className="p-2 text-ink/40 hover:text-coral transition-colors">
                  <X className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <select
                value={editingCategory}
                onChange={e => setEditingCategory(e.target.value)}
                className="bg-white border-4 border-outline rounded-xl p-2 font-black text-xs uppercase"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                value={editingLimit}
                onChange={e => setEditingLimit(e.target.value)}
                placeholder="Limit?"
                className="flex-1 bg-white border-4 border-outline rounded-xl px-3 py-2 font-black text-sm"
              />
              <button
                onClick={handleAddCategoryBudget}
                className="bg-mint text-true-ink border-4 border-outline rounded-xl px-4 font-black shadow-[2px_2px_0_var(--shadow-color)] hover:bg-mint/80"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4">
          {/* Privacy Toggle */}
          <button 
            onClick={togglePrivacyMode}
            className={cn(
              "comic-card p-5 flex flex-col items-center gap-3 transition-colors",
              privacyMode ? "bg-indigo-vibrant text-true-white" : "bg-white text-ink"
            )}
          >
            <Shield className={cn("w-8 h-8 stroke-[2]", privacyMode ? "text-mint" : "text-ink")} />
            <div className="text-center">
              <h4 className="font-black text-sm uppercase tracking-wider">MODE SAMARAN</h4>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {privacyMode ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={cn(
              "comic-card p-5 flex flex-col items-center gap-3 transition-colors",
              darkMode ? "bg-indigo-vibrant text-true-white" : "bg-white text-ink"
            )}
          >
            {darkMode ? <Moon className="w-8 h-8 stroke-[2] text-mint" /> : <Sun className="w-8 h-8 stroke-[2] text-sun" />}
            <div className="text-center">
              <h4 className="font-black text-sm uppercase tracking-wider">TEMA TAMPILAN</h4>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                {darkMode ? 'GELAP' : 'TERANG'}
              </span>
            </div>
          </button>
        </div>

        {/* Data Management */}
        <h3 className="text-xl font-display font-black text-ink uppercase italic -rotate-1 tracking-tighter flex items-center gap-3 ml-2 mt-8">
          <Database className="w-5 h-5 text-ink" /> MANAJEMEN DATA
        </h3>
        
        <div className="comic-card bg-white p-5 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b-2 border-outline/10">
            <div>
              <p className="font-black text-sm uppercase">PENYIMPANAN DATA</p>
              <p className="text-[10px] font-black text-ink/40 tracking-widest">{storageUsage} KB DIGUNAKAN</p>
            </div>
            <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center border-2 border-mint/20">
              <Database className="w-5 h-5 text-mint" />
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Export Section */}
            <button 
              onClick={exportToCSV}
              className="w-full flex items-center justify-between p-4 border-4 border-outline rounded-xl font-black text-xs uppercase tracking-wider hover:bg-sun transition-all bg-white shadow-[4px_4px_0_var(--shadow-color)]"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-indigo-vibrant" />
                <span>Download Laporan (CSV)</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onBackupData}
                className="flex flex-col items-center justify-center gap-2 p-4 border-4 border-outline rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-mint transition-all bg-white"
              >
                <Database className="w-5 h-5 text-mint" />
                CADANGKAN
              </button>
              <label className="flex flex-col items-center justify-center gap-2 p-4 border-4 border-outline rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-vibrant hover:text-white transition-all bg-white cursor-pointer">
                <Upload className="w-5 h-5 text-indigo-vibrant group-hover:text-white" />
                PULIHKAN
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files && onRestoreData(e.target.files[0])} />
              </label>
            </div>

            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-coral/5 text-coral border-4 border-coral/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-coral hover:text-white transition-all"
            >
              <Trash2 className="w-4 h-4" /> HAPUS PERMANEN SEMUA DATA
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/80 z-[60]"
              onClick={() => setShowResetConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90%] max-w-sm"
            >
              <div className="comic-card bg-white p-6 space-y-4 shadow-[8px_8px_0_#FF6B6B]">
                <div className="text-center space-y-2">
                  <div className="text-4xl">⚠️</div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-coral">Yakin Mau Reset?</h3>
                  <p className="text-[10px] font-black text-ink/60 uppercase tracking-widest">Semua data transaksi dan utang akan hilang permanen. Tidak bisa dibatalkan!</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 border-4 border-outline rounded-xl font-black text-xs uppercase bg-white text-ink">
                    Batal
                  </button>
                  <button onClick={() => { onResetData(); setShowResetConfirm(false); }} className="flex-1 py-3 bg-coral text-true-white border-4 border-outline rounded-xl font-black text-xs uppercase shadow-[4px_4px_0_var(--shadow-color)]">
                    Ya, Hapus!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
