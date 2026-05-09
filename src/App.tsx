import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  LayoutDashboard,
  History,
  Wallet,
  Target,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  HandCoins,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, onSnapshot, deleteDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  subMonths,
  subDays,
  subYears,
} from 'date-fns';
import { id } from 'date-fns/locale';

import { TransactionType, Debt, Goal, Transaction } from './types.ts';
import { cn, formatCurrency, formatNumber } from './lib/utils.ts';
import { ToastContainer, ToastType } from './components/Toast';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { DebtsTab } from './components/tabs/DebtsTab';
import { GoalsTab } from './components/tabs/GoalsTab';
import { SettingsTab } from './components/tabs/SettingsTab';

// ── localStorage helpers ──────────────────────────────────────────────────
const LS_KEYS = {
  transactions: 'kash_transactions',
  debts: 'kash_debts',
  goals: 'kash_goals',
  settings: 'kash_settings',
};
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Data ──────────────────────────────────────────────────────────────────
const CATEGORIES: { name: string; color: string; icon: string; type: TransactionType }[] = [

  // Pengeluaran
  { name: 'Makanan', color: '#FF6B6B', icon: '🍔', type: 'expense' },
  { name: 'Transportasi', color: '#4ECDC4', icon: '🚗', type: 'expense' },
  { name: 'Belanja', color: '#FFD93D', icon: '🛍️', type: 'expense' },
  { name: 'Hiburan', color: '#6C5CE7', icon: '🎮', type: 'expense' },
  { name: 'Tagihan', color: '#1A1A1A', icon: '📄', type: 'expense' },
  { name: 'Lainnya', color: '#94a3b8', icon: '✨', type: 'expense' },
  // Pemasukan
  { name: 'Gaji', color: '#2ecc71', icon: '💰', type: 'income' },
  { name: 'Bonus', color: '#f1c40f', icon: '🎁', type: 'income' },
  { name: 'Investasi', color: '#3498db', icon: '📈', type: 'income' },
  { name: 'Lainnya (Masuk)', color: '#1abc9c', icon: '💸', type: 'income' },
];

type TimeFilter = 'harian' | 'bulanan' | 'tahunan';

export default function App() {
  const [transactions, setTransactionsState] = useState<Transaction[]>(() => lsGet(LS_KEYS.transactions, []));
  const [budget, setBudgetState] = useState<number>(() => lsGet<any>(LS_KEYS.settings, {}).monthlyBudget ?? 2000000);
  const [darkMode, setDarkModeState] = useState<boolean>(() => lsGet<any>(LS_KEYS.settings, {}).darkMode ?? false);
  const [categoryBudgets, setCategoryBudgetsState] = useState<{ category: string; limit: number }[]>(
    () => lsGet<any>(LS_KEYS.settings, {}).categoryBudgets ?? []
  );

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'utang' | 'target' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('bulanan');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => lsGet<any>(LS_KEYS.settings, {}).privacyMode ?? false);
  const [currency, setCurrency] = useState<'IDR' | 'USD' | 'SGD'>(() => lsGet<any>(LS_KEYS.settings, {}).currency ?? 'IDR');
  const [userName, setUserName] = useState<string>(''); // No longer from LS, will be from Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);


  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setUserName(u.displayName || 'PENGGUNA');
        // Trigger cloud sync
        syncWithCloud(u.uid);
      } else {
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  const syncWithCloud = async (uid: string) => {
    try {
      // 1. Sync Settings
      const settingsRef = doc(db, 'users', uid);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const cloudSettings = settingsSnap.data();
        if (cloudSettings.monthlyBudget) setBudgetState(cloudSettings.monthlyBudget);
        if (cloudSettings.darkMode !== undefined) setDarkModeState(cloudSettings.darkMode);
        if (cloudSettings.currency) setCurrency(cloudSettings.currency);
        if (cloudSettings.privacyMode !== undefined) setPrivacyMode(cloudSettings.privacyMode);
      } else {
        // Upload local settings to cloud for the first time
        await setDoc(settingsRef, lsGet(LS_KEYS.settings, {}), { merge: true });
      }

      // 2. Sync Transactions (Basic implementation: download from cloud)
      const txsRef = collection(db, 'users', uid, 'transactions');
      const txsSnap = await getDocs(txsRef);
      if (!txsSnap.empty) {
        const cloudTxs = txsSnap.docs.map(d => d.data() as Transaction);
        // Merge strategy: Cloud wins for simplicity in this version
        setTransactions(cloudTxs);
      } else {
        // Upload local transactions to cloud
        const localTxs = lsGet<Transaction[]>(LS_KEYS.transactions, []);
        if (localTxs.length > 0) {
          const batch = writeBatch(db);
          localTxs.forEach(t => {
            const d = doc(db, 'users', uid, 'transactions', t.id);
            batch.set(d, t);
          });
          await batch.commit();
        }
      }
      
      // Note: Debts and Goals could be synced similarly
    } catch (err) {
      console.error("Cloud Sync Error:", err);
    }
  };

  // Real-time Sync Effect
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;

    // Listen to Transactions
    const unsubTxs = onSnapshot(collection(db, 'users', uid, 'transactions'), (snap) => {
      if (!snap.metadata.hasPendingWrites) {
        const cloudTxs = snap.docs.map(d => d.data() as Transaction);
        setTransactionsState(prev => {
          // Merge strategy: Gabungkan berdasarkan ID, cloud menang jika ID sama
          const localMap = new Map(prev.map(t => [t.id, t]));
          cloudTxs.forEach(t => localMap.set(t.id, t));
          const merged = (Array.from(localMap.values()) as Transaction[]).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          lsSet(LS_KEYS.transactions, merged);
          return merged;
        });
      }
    });

    // Listen to Debts
    const unsubDebts = onSnapshot(collection(db, 'users', uid, 'debts'), (snap) => {
      if (!snap.metadata.hasPendingWrites) {
        const cloudDebts = snap.docs.map(d => d.data() as Debt);
        setDebtsState(prev => {
          const localMap = new Map(prev.map(d => [d.id, d]));
          cloudDebts.forEach(d => localMap.set(d.id, d));
          const merged = Array.from(localMap.values());
          lsSet(LS_KEYS.debts, merged);
          return merged;
        });
      }
    });

    // Listen to Goals
    const unsubGoals = onSnapshot(collection(db, 'users', uid, 'goals'), (snap) => {
      if (!snap.metadata.hasPendingWrites) {
        const cloudGoals = snap.docs.map(d => d.data() as Goal);
        setGoalsState(prev => {
          const localMap = new Map(prev.map(g => [g.id, g]));
          cloudGoals.forEach(g => localMap.set(g.id, g));
          const merged = Array.from(localMap.values());
          lsSet(LS_KEYS.goals, merged);
          return merged;
        });
      }
    });

    // Listen to Settings
    const unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'prefs'), (snap) => {
      if (snap.exists() && !snap.metadata.hasPendingWrites) {
        const cloudSettings = snap.data();
        if (cloudSettings.monthlyBudget !== undefined) setBudgetState(cloudSettings.monthlyBudget);
        if (cloudSettings.currency !== undefined) setCurrency(cloudSettings.currency);
        if (cloudSettings.categoryBudgets !== undefined) setCategoryBudgetsState(cloudSettings.categoryBudgets);
        const current = lsGet<any>(LS_KEYS.settings, {});
        lsSet(LS_KEYS.settings, { ...current, ...cloudSettings });
      }
    });

    // Initial Sync: Push local data to cloud if missing
    const performInitialPush = async () => {
      const localTxs = lsGet<Transaction[]>(LS_KEYS.transactions, []);
      for (const tx of localTxs) {
        await setDoc(doc(db, 'users', uid, 'transactions', tx.id), tx, { merge: true });
      }
      const localDebts = lsGet<Debt[]>(LS_KEYS.debts, []);
      for (const d of localDebts) {
        await setDoc(doc(db, 'users', uid, 'debts', d.id), d, { merge: true });
      }
    };
    performInitialPush();

    return () => {
      unsubTxs(); unsubDebts(); unsubGoals(); unsubSettings();
    };
  }, [user]);

  // Cloud Write Helpers
  const cloudPush = async (collectionName: string, id: string, data: any) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, collectionName, id), data);
    } catch (e) {
      console.error(`Error pushing to cloud (${collectionName}):`, e);
    }
  };

  const cloudDelete = async (collectionName: string, id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
    } catch (e) {
      console.error(`Error deleting from cloud (${collectionName}):`, e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      // CRITICAL: Link Capacitor Auth with Firebase JS SDK
      if (result.credential) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        await signInWithCredential(auth, credential);
      }
      
      addToast('Berhasil masuk dengan Google!', 'success');
    } catch (err: any) {
      console.error("Google Login Error:", err);
      addToast('Gagal masuk: ' + (err.message || 'Error tidak diketahui'), 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await FirebaseAuthentication.signOut();
      await firebaseSignOut(auth);
      setUser(null);
      addToast('Berhasil keluar.', 'info');
    } catch (err: any) {
      addToast('Gagal keluar: ' + err.message, 'error');
    }
  };

  // ── Recurring transaction auto-generation ───────────
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const recurring = transactions.filter(t => t.isRecurring && t.recurringFrequency);
    if (recurring.length === 0) return;

    const toCreate: Transaction[] = [];
    recurring.forEach(t => {
      const last = t.recurringLastCreated || t.date;
      const lastDate = parseISO(last);
      const todayDate = parseISO(today);
      let shouldCreate = false;

      if (t.recurringFrequency === 'daily') {
        shouldCreate = format(lastDate, 'yyyy-MM-dd') < today;
      } else if (t.recurringFrequency === 'weekly') {
        shouldCreate = todayDate.getTime() - lastDate.getTime() >= 7 * 86400000;
      } else if (t.recurringFrequency === 'monthly') {
        shouldCreate =
          todayDate.getFullYear() > lastDate.getFullYear() ||
          (todayDate.getFullYear() === lastDate.getFullYear() && todayDate.getMonth() > lastDate.getMonth());
      }

      if (shouldCreate) {
        toCreate.push({
          ...t,
          id: genId(),
          date: today,
          createdAt: new Date().toISOString(),
          recurringLastCreated: today,
          isRecurring: false, // created copy is not itself recurring
        });
      }
    });

    if (toCreate.length > 0) {
      // Update recurringLastCreated on source
      setTransactionsState(prev => {
        const updated = prev.map(t => {
          const created = toCreate.find(c => c.description === t.description && t.isRecurring);
          return created ? { ...t, recurringLastCreated: today } : t;
        });
        const withNew = [...toCreate, ...updated];
        lsSet(LS_KEYS.transactions, withNew);
        return withNew;
      });
      addToast(`${toCreate.length} transaksi berulang dibuat otomatis.`, 'info');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrap setters to also persist to localStorage
  const setTransactions = (txs: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactionsState(prev => {
      const next = typeof txs === 'function' ? txs(prev) : txs;
      lsSet(LS_KEYS.transactions, next);
      return next;
    });
  };

  const syncTxToCloud = (tx: Transaction) => {
    if (user) cloudPush('transactions', tx.id, tx);
  };

  const saveSettings = (patch: Record<string, unknown>) => {
    const current = lsGet<Record<string, unknown>>(LS_KEYS.settings, {});
    const updated = { ...current, ...patch };
    lsSet(LS_KEYS.settings, updated);
    return updated;
  };

  const togglePrivacyMode = () => {
    const newMode = !privacyMode;
    setPrivacyMode(newMode);
    saveSettings({ privacyMode: newMode });
    if (user) cloudPush('settings', 'prefs', { privacyMode: newMode });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkModeState(newMode);
    saveSettings({ darkMode: newMode });
    if (user) cloudPush('settings', 'prefs', { darkMode: newMode });
  };

  const handleCurrencyChange = (c: 'IDR' | 'USD' | 'SGD') => {
    setCurrency(c);
    saveSettings({ currency: c });
    if (user) cloudPush('settings', 'prefs', { currency: c });
  };

  const saveCategoryBudgets = (budgets: { category: string; limit: number }[]) => {
    setCategoryBudgetsState(budgets);
    saveSettings({ categoryBudgets: budgets });
    if (user) cloudPush('settings', 'prefs', { categoryBudgets: budgets });
  };

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Form state
  const [newTransaction, setNewTransaction] = useState<{
    category: string;
    amount: string;
    description: string;
    date: string;
    type: TransactionType;
    isRecurring: boolean;
    recurringFrequency: 'daily' | 'weekly' | 'monthly';
  }>({
    category: 'Makanan',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    isRecurring: false,
    recurringFrequency: 'monthly'
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    person: '',
    amount: 0,
    type: 'debt',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    isPaid: false
  });

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    targetAmount: 0,
    currentAmount: 0,
    icon: '🎯'
  });

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [debts, setDebtsState] = useState<Debt[]>(() => lsGet(LS_KEYS.debts, []));
  const [goals, setGoalsState] = useState<Goal[]>(() => lsGet(LS_KEYS.goals, []));

  const setDebts = (d: Debt[] | ((prev: Debt[]) => Debt[])) => {
    setDebtsState(prev => {
      const next = typeof d === 'function' ? d(prev) : d;
      lsSet(LS_KEYS.debts, next);
      return next;
    });
  };
  const setGoals = (g: Goal[] | ((prev: Goal[]) => Goal[])) => {
    setGoalsState(prev => {
      const next = typeof g === 'function' ? g(prev) : g;
      lsSet(LS_KEYS.goals, next);
      return next;
    });
  };

  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      scanReceipt(file);
    }
  };

  // Helper to resize image before sending to AI (save memory and bandwidth)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024px
          const maxDim = 1024;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        };
        img.onerror = () => reject(new Error("Gagal memproses gambar."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  };


  const scanReceipt = async (file: File) => {
    try {
      setIsScanning(true);
      setScanStatus('scanning');
      setScanMessage('Mengecilkan gambar...');

      if (!file.type.startsWith('image/')) {
        throw new Error("File harus berupa gambar.");
      }

      const base64Data = await resizeImage(file);
      let envKey = import.meta.env.VITE_GEMINI_API_KEY;
      let apiKey = (!envKey || envKey === "undefined" || envKey === "null") 
        ? "AIzaSyA4tFah_JJ-L9TYVP-BWuNk7MmmtkjK-Nk" 
        : envKey.trim().replace(/^["']|["']$/g, '');
      
      if (!apiKey || !apiKey.startsWith("AIza")) {
        throw new Error("Konfigurasi Error: API Key tidak valid.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      
      setScanMessage('Scan sedang dilakukan...');
      let modelToUse = "gemini-1.5-flash"; // Default

      try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();
        if (listData.models && listData.models.length > 0) {
          // Cari model yang mendukung generateContent dan punya 'flash' atau 'pro' di namanya
          const found = listData.models.find((m: any) => 
            m.supportedGenerationMethods.includes('generateContent') && 
            (m.name.includes('flash') || m.name.includes('pro'))
          );
          if (found) {
            modelToUse = found.name.split('/').pop() || modelToUse;
            console.log("Menggunakan model otomatis:", modelToUse);
          }
        }
      } catch (e) {
        console.warn("Gagal list models, menggunakan default.");
      }

      setScanMessage('Scan sedang dilakukan...');
      const model = genAI.getGenerativeModel({ model: modelToUse });

      const result = await model.generateContent([
        { text: `Analyze this receipt image from Indonesia. 
                 Find the GRAND TOTAL (TOTAL AKHIR) amount. Pay attention to Indonesian currency formatting (dots/commas).
                 Return ONLY a raw JSON object with these fields:
                 { 
                   "amount": number (integer only, e.g. 150000), 
                   "description": "Store Name - Items", 
                   "category": "Pick one: ${CATEGORIES.filter(c => c.type === 'expense').map(c => c.name).join(', ')}" 
                 }
                 
                 Return ONLY the JSON, no other text.` 
        },
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
      ]);

      const text = result.response.text();
      console.log("AI Response Raw:", text);
      
      let resultData;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : text;
        resultData = JSON.parse(jsonStr);
      } catch (e) {
        console.error("JSON Parse Error:", text);
        throw new Error("AI memberikan format data yang salah.");
      }
      
      if (resultData && resultData.amount !== undefined) {
        // Bersihkan angka dari karakter non-digit (titik, koma, Rp, dsb)
        const rawAmount = resultData.amount.toString().replace(/\D/g, '');
        const finalAmount = parseInt(rawAmount) || 0;

        setNewTransaction(prev => ({
          ...prev,
          type: 'expense',
          amount: Math.abs(finalAmount).toString(),
          description: resultData.description || 'Pembelian Baru',
          category: resultData.category || 'Lainnya'
        }));
        
        setScanStatus('success');
        setScanMessage('Berhasil!');
        addToast('Nota berhasil diproses!', 'success');
        setTimeout(() => setScanStatus('idle'), 2000);
      } else {
        throw new Error("Data AI tidak valid.");
      }

    } catch (error: any) {
      console.error("Scan error detail:", error);
      setScanStatus('error');
      setScanMessage(error.message);
      addToast(error.message, 'error');
      setTimeout(() => setScanStatus('idle'), 5000);
    } finally {
      setIsScanning(false);
    }
  };





  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      if (timeFilter === 'harian') return isSameDay(tDate, currentDate);
      if (timeFilter === 'bulanan') return isSameMonth(tDate, currentDate);
      return isSameYear(tDate, currentDate);
    });
  }, [transactions, timeFilter, currentDate]);

  const totalSpent = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const expensesOnly = filteredTransactions.filter(t => t.type === 'expense');
    if (timeFilter === 'harian') {
      return CATEGORIES.filter(c => c.type === 'expense').map(cat => ({
        name: cat.name,
        amount: expensesOnly.filter(e => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
        color: cat.color
      })).filter(d => d.amount > 0);
    } else if (timeFilter === 'bulanan') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const days = eachDayOfInterval({ start, end });
      return days.map(day => ({
        name: format(day, 'd'),
        amount: expensesOnly
          .filter(e => isSameDay(parseISO(e.date), day))
          .reduce((s, e) => s + e.amount, 0)
      }));
    } else {
      const start = startOfYear(currentDate);
      const end = endOfYear(currentDate);
      const months = eachMonthOfInterval({ start, end });
      return months.map(m => ({
        name: format(m, 'MMM', { locale: id }),
        amount: expensesOnly
          .filter(e => isSameMonth(parseISO(e.date), m))
          .reduce((s, e) => s + e.amount, 0)
      }));
    }
  }, [filteredTransactions, timeFilter, currentDate]);

  const categoryData = useMemo(() => {
    const expensesOnly = filteredTransactions.filter(t => t.type === 'expense');
    return CATEGORIES.filter(c => c.type === 'expense').map(cat => ({
      name: cat.name,
      value: expensesOnly.filter(e => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
      color: cat.color
    })).filter(d => d.value > 0);
  }, [filteredTransactions]);

  // Insights
  const previousFilteredTransactions = useMemo(() => {
    let prevDate = new Date(currentDate);
    if (timeFilter === 'harian') prevDate = subDays(currentDate, 1);
    else if (timeFilter === 'bulanan') prevDate = subMonths(currentDate, 1);
    else prevDate = subYears(currentDate, 1);

    return transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = parseISO(t.date);
      if (timeFilter === 'harian') return isSameDay(tDate, prevDate);
      if (timeFilter === 'bulanan') return isSameMonth(tDate, prevDate);
      return isSameYear(tDate, prevDate);
    });
  }, [transactions, timeFilter, currentDate]);

  const insights = useMemo(() => {
    const expenseCategories = CATEGORIES.filter(c => c.type === 'expense');
    const currentCategoryTotals = expenseCategories.reduce((acc, cat) => {
      acc[cat.name] = filteredTransactions
        .filter(t => t.type === 'expense' && t.category === cat.name)
        .reduce((s, t) => s + t.amount, 0);
      return acc;
    }, {} as Record<string, number>);

    const previousCategoryTotals = expenseCategories.reduce((acc, cat) => {
      acc[cat.name] = previousFilteredTransactions
        .filter(t => t.category === cat.name)
        .reduce((s, t) => s + t.amount, 0);
      return acc;
    }, {} as Record<string, number>);

    const differences = expenseCategories.map(cat => {
      const current = currentCategoryTotals[cat.name] || 0;
      const previous = previousCategoryTotals[cat.name] || 0;
      let percent = 0;
      if (previous > 0) percent = ((current - previous) / previous) * 100;
      else if (current > 0) percent = 100;

      return { name: cat.name, percent, current, previous };
    }).filter(d => Math.abs(d.percent) > 5 && (d.current > 0 || d.previous > 0));

    return differences.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent)).slice(0, 3);
  }, [filteredTransactions, previousFilteredTransactions]);

  const savingsHabits = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const progress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    if (progress > 50) return "HEBAT! Kamu sudah menyelesaikan lebih dari setengah target tabunganmu.";
    if (totalGoals > 0) return "TERUS SEMANGAT! Sikit-sedikit lama-lama jadi bukit.";
    return "TARGET KOSONG? Yuk buat target baru biar tabungan terencana!";
  }, [goals]);

  const deleteTransaction = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteTransaction = () => {
    if (!deleteConfirmId) return;
    setTransactions(prev => prev.filter(t => t.id !== deleteConfirmId));
    if (user) cloudDelete('transactions', deleteConfirmId);
    setDeleteConfirmId(null);
    addToast('Transaksi dihapus.', 'success');
  };

  const startEditTransaction = (tx: Transaction) => {
    setEditingId(tx.id);
    setNewTransaction({
      category: tx.category,
      amount: tx.amount.toString(),
      description: tx.description,
      date: tx.date,
      type: tx.type,
      isRecurring: tx.isRecurring || false,
      recurringFrequency: tx.recurringFrequency || 'monthly'
    });
    setIsFormOpen(true);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.description) return;

    if (editingId) {
      setTransactions(prev => prev.map(t => {
        if (t.id === editingId) {
          const updated = { ...t, type: newTransaction.type, category: newTransaction.category,
              amount: parseInt(newTransaction.amount), description: newTransaction.description,
              date: newTransaction.date, isRecurring: newTransaction.isRecurring,
              recurringFrequency: newTransaction.recurringFrequency };
          if (user) cloudPush('transactions', t.id, updated);
          return updated;
        }
        return t;
      }));
      setEditingId(null);
      addToast('Transaksi diperbarui!', 'success');
    } else {
      const newTx: Transaction = {
        id: genId(), userId: 'local',
        type: newTransaction.type, category: newTransaction.category,
        amount: parseInt(newTransaction.amount), description: newTransaction.description,
        date: newTransaction.date, createdAt: new Date().toISOString(),
        isRecurring: newTransaction.isRecurring, recurringFrequency: newTransaction.recurringFrequency
      };
      setTransactions(prev => [newTx, ...prev]);
      syncTxToCloud(newTx);
      addToast('Transaksi berhasil dicatat!', 'success');
    }
    setNewTransaction({ ...newTransaction, amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: false });
    setIsFormOpen(false);
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = parseInt(tempBudget) || 0;
    setBudgetState(newBudget);
    saveSettings({ monthlyBudget: newBudget });
    if (user) cloudPush('settings', 'prefs', { monthlyBudget: newBudget });
    setIsBudgetModalOpen(false);
    addToast('Anggaran diperbarui!', 'success');
  };


  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.amount || !newDebt.person) return;

    const debt: Debt = {
      id: genId(),
      userId: 'local',
      person: newDebt.person!,
      amount: newDebt.amount!,
      type: newDebt.type as 'debt' | 'receivable',
      dueDate: newDebt.dueDate!,
      description: newDebt.description || '',
      isPaid: false,
      createdAt: new Date().toISOString(),
    };
    setDebts(prev => [debt, ...prev]);
    if (user) cloudPush('debts', debt.id, debt);
    setIsDebtModalOpen(false);
    setNewDebt({ person: '', amount: 0, type: 'debt', dueDate: format(new Date(), 'yyyy-MM-dd'), isPaid: false });
    addToast('Data utang disimpan!', 'success');
  };

  const toggleDebtPaid = (debt: Debt) => {
    setDebts(prev => prev.map(d => {
      if (d.id === debt.id) {
        const updated = { ...d, isPaid: !d.isPaid };
        if (user) cloudPush('debts', d.id, updated);
        return updated;
      }
      return d;
    }));
    addToast(debt.isPaid ? 'Lunas dibatalkan' : 'Ditandai lunas!', 'info');
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    if (user) cloudDelete('debts', id);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetAmount) return;

    const goal: Goal = {
      id: genId(),
      userId: 'local',
      title: newGoal.title!,
      targetAmount: newGoal.targetAmount!,
      currentAmount: newGoal.currentAmount || 0,
      icon: newGoal.icon || '🎯',
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [goal, ...prev]);
    if (user) cloudPush('goals', goal.id, goal);
    setIsGoalModalOpen(false);
    setNewGoal({ title: '', targetAmount: 0, currentAmount: 0, icon: '🎯' });
    addToast('Target misi dimulai!', 'success');
  };

  const updateGoalProgress = (goal: Goal, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goal.id) {
        const updated = { ...g, currentAmount: Math.max(0, g.currentAmount + amount) };
        if (user) cloudPush('goals', g.id, updated);
        return updated;
      }
      return g;
    }));
    addToast(`Berhasil menabung ${formatNumber(amount)}!`, 'success');
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (user) cloudDelete('goals', id);
  };

  const navigateTime = (direction: 'next' | 'prev') => {
    const newDate = new Date(currentDate);
    if (timeFilter === 'harian') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (timeFilter === 'bulanan') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const exportToPDF = async () => {
    if (transactions.length === 0) return;
    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = format(now, 'dd MMMM yyyy');
      
      // 1. Latar Belakang & Header
      doc.setFillColor(250, 250, 250); // Off-white background
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setFillColor(79, 17, 158); // Deep Purple dari Logo
      doc.rect(10, 10, 190, 35, 'F');
      doc.setDrawColor(26, 26, 26);
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 35, 'S');

      // DRAW LOGO KASH (Official Wallet Icon)
      try {
        doc.setFillColor(79, 17, 158); // Masking Ungu agar menyatu
        doc.circle(30, 27.5, 13, 'F'); 
        doc.addImage('/logo.png', 'PNG', 18, 15, 25, 25);
      } catch (e) {
        doc.setFillColor(255, 217, 61);
        doc.circle(30, 27.5, 12, 'F');
        doc.setTextColor(26, 26, 26);
        doc.text('K', 27, 30);
      }

      // JUDUL PUTIH (Kontras tinggi dengan Ungu)
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('KASH: LAPORAN KEUANGAN', 48, 26);
      
      doc.setTextColor(255, 255, 255); // Keterangan periode putih agar terbaca di atas ungu
      doc.setFontSize(9);
      doc.text(`PERIODE: ${format(now, 'MMMM yyyy').toUpperCase()}`, 48, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tgl Cetak: ${dateStr}`, 48, 38);

      // 2. Data Tabel
      const tableData = transactions.map((t, i) => [
        i + 1,
        format(parseISO(t.date), 'dd/MM/yy'),
        t.category,
        t.description,
        t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
        `Rp ${t.amount.toLocaleString('id-ID')}`
      ]);

      autoTable(doc, {
        startY: 55,
        margin: { left: 10, right: 10 },
        head: [['NO', 'TANGGAL', 'KATEGORI', 'KETERANGAN', 'TIPE', 'NOMINAL']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          fillColor: [26, 26, 26], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        styles: { 
          font: 'helvetica', 
          fontSize: 8,
          cellPadding: 4,
          lineWidth: 0.2,
          lineColor: [200, 200, 200]
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 25 },
          5: { fontStyle: 'bold', halign: 'right', cellWidth: 35 }
        }
      });

      // 3. Ringkasan di Bawah (Didesain lebih premium)
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      const totalIn = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalOut = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      // Kotak Pemasukan (MINT)
      doc.setDrawColor(26, 26, 26);
      doc.setFillColor(78, 205, 196); // Mint
      doc.rect(10, finalY, 92, 25, 'F');
      doc.rect(10, finalY, 92, 25, 'S');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('TOTAL PEMASUKAN', 15, finalY + 8);
      doc.setFontSize(16);
      doc.text(`Rp ${totalIn.toLocaleString('id-ID')}`, 15, finalY + 18);

      // Kotak Pengeluaran (CORAL)
      doc.setFillColor(255, 107, 107); // Coral
      doc.rect(108, finalY, 92, 25, 'F');
      doc.rect(108, finalY, 92, 25, 'S');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('TOTAL PENGELUARAN', 113, finalY + 8);
      doc.setFontSize(16);
      doc.text(`Rp ${totalOut.toLocaleString('id-ID')}`, 113, finalY + 18);

      // Kotak Saldo Akhir (Highlight)
      doc.setFillColor(26, 26, 26);
      doc.rect(10, finalY + 30, 190, 15, 'F');
      doc.setTextColor(255, 217, 61);
      doc.setFontSize(10);
      doc.text('SALDO AKHIR PERIODE INI:', 15, finalY + 40);
      doc.setFontSize(12);
      const saldo = totalIn - totalOut;
      doc.text(`Rp ${saldo.toLocaleString('id-ID')}`, 145, finalY + 40);

      // 4. Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Laporan ini dibuat secara otomatis oleh sistem Aplikasi Kash.', 10, 285);
      doc.text(`Halaman 1 / 1`, 185, 285);

      // 5. Proses File
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `Laporan_Kash_${format(now, 'yyyyMMdd')}.pdf`;

      if ((window as any).Capacitor?.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents
        });
        await Share.share({
          title: 'Laporan Keuangan Kash',
          url: result.uri,
          dialogTitle: 'Buka atau Simpan PDF'
        });
      } else {
        doc.save(fileName);
      }
      
      addToast('Laporan PDF berhasil dibuat!', 'success');
    } catch (error: any) {
      console.error("PDF error:", error);
      addToast('Gagal membuat PDF: ' + error.message, 'error');
    }
  };

  const resetData = () => {
    ['kash_transactions', 'kash_debts', 'kash_goals', 'kash_settings'].forEach(k => localStorage.removeItem(k));
    setTransactionsState([]);
    setDebtsState([]);
    setGoalsState([]);
    setBudgetState(2000000);
    setCurrency('IDR');
    setPrivacyMode(false);
    setDarkModeState(false);
    setCategoryBudgetsState([]);
    setUserName('');
    addToast('Semua data telah dihapus.', 'info');
  };

  const backupData = async () => {
    try {
      const data = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        transactions: lsGet(LS_KEYS.transactions, []),
        debts: lsGet(LS_KEYS.debts, []),
        goals: lsGet(LS_KEYS.goals, []),
        settings: lsGet(LS_KEYS.settings, {}),
      };
      
      const fileName = `kash_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      const jsonContent = JSON.stringify(data, null, 2);

      if (navigator.share || (window as any).Capacitor?.isNativePlatform()) {
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: jsonContent,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });

          await Share.share({
            title: 'Backup Data Kash',
            text: 'File cadangan data aplikasi Kash.',
            url: result.uri,
            dialogTitle: 'Simpan atau Bagikan Backup',
          });
          addToast('Backup siap dibagikan!', 'success');
          return;
        } catch (e) {
          console.warn("Native share failed, falling back to browser download", e);
        }
      }

      // Fallback: Web Download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Cadangan berhasil diunduh!', 'success');
    } catch (error: any) {
      console.error("Backup error:", error);
      addToast('Gagal membuat backup: ' + error.message, 'error');
    }
  };

  const restoreData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.transactions) throw new Error('Format tidak valid');
        lsSet(LS_KEYS.transactions, data.transactions);
        lsSet(LS_KEYS.debts, data.debts || []);
        lsSet(LS_KEYS.goals, data.goals || []);
        lsSet(LS_KEYS.settings, data.settings || {});
        setTransactionsState(data.transactions);
        setDebtsState(data.debts || []);
        setGoalsState(data.goals || []);
        const s = data.settings || {};
        if (s.monthlyBudget) setBudgetState(s.monthlyBudget);
        if (s.currency) setCurrency(s.currency);
        if (s.privacyMode !== undefined) setPrivacyMode(s.privacyMode);
        if (s.darkMode !== undefined) setDarkModeState(s.darkMode);
        if (s.categoryBudgets) setCategoryBudgetsState(s.categoryBudgets);
        if (s.userName !== undefined) setUserName(s.userName);
        addToast('Data berhasil dipulihkan!', 'success');
      } catch {
        addToast('File backup tidak valid!', 'error');
      }
    };
    reader.readAsText(file);
  };

  const printReport = () => {
    addToast('Menyiapkan laporan PDF berwarna...', 'info');
    exportToPDF();
  };



  const budgetUsagePercent = Math.min((totalSpent / budget) * 100, 100);

  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      addToast(`Error: ${event.reason?.message || 'Terjadi kesalahan sistem.'}`, 'error');
    };
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  // ── Native Back Button Handling ────────────────────
  useEffect(() => {
    let lastBackPress = 0;

    const backListener = CapApp.addListener('backButton', () => {
      // 1. Prioritas: Tutup modal yang sedang terbuka
      if (isFormOpen) {
        setIsFormOpen(false);
        setEditingId(null);
        return;
      }
      if (isBudgetModalOpen) {
        setIsBudgetModalOpen(false);
        return;
      }
      if (isDebtModalOpen) {
        setIsDebtModalOpen(false);
        return;
      }
      if (isGoalModalOpen) {
        setIsGoalModalOpen(false);
        return;
      }
      if (deleteConfirmId) {
        setDeleteConfirmId(null);
        return;
      }

      // 2. Jika tidak di dashboard, balik ke dashboard
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }

      // 3. Jika sudah di dashboard, double tap untuk keluar
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress = now;
        addToast('Tekan sekali lagi untuk keluar aplikasi', 'info');
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [activeTab, isFormOpen, isBudgetModalOpen, isDebtModalOpen, isGoalModalOpen, deleteConfirmId]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            totalIncome={totalIncome}
            totalSpent={totalSpent}
            budget={budget}
            budgetUsagePercent={budgetUsagePercent}
            privacyMode={privacyMode}
            setIsBudgetModalOpen={setIsBudgetModalOpen}
            chartData={chartData}
            categoryData={categoryData}
            categoryBudgets={categoryBudgets}
            filteredTransactions={filteredTransactions}
            savingsHabits={savingsHabits}
            insights={insights}
            formatCurrency={formatCurrency}
            timeFilter={timeFilter}
          />
        );
      case 'transactions':
        return (
          <TransactionsTab
            filteredTransactions={filteredTransactions}
            deleteTransaction={deleteTransaction}
            editTransaction={startEditTransaction}
            privacyMode={privacyMode}
            CATEGORIES={CATEGORIES}
          />
        );
      case 'utang':
        return (
          <DebtsTab
            debts={debts}
            setIsDebtModalOpen={setIsDebtModalOpen}
            toggleDebtPaid={toggleDebtPaid}
            deleteDebt={deleteDebt}
            privacyMode={privacyMode}
          />
        );
      case 'target':
        return (
          <GoalsTab
            goals={goals}
            setIsGoalModalOpen={setIsGoalModalOpen}
            deleteGoal={deleteGoal}
            updateGoalProgress={updateGoalProgress}
            privacyMode={privacyMode}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            privacyMode={privacyMode}
            togglePrivacyMode={togglePrivacyMode}
            currency={currency}
            handleCurrencyChange={handleCurrencyChange}
            exportToCSV={exportToPDF}
            budget={budget}
            totalTransactions={transactions.length}
            onResetData={resetData}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            categoryBudgets={categoryBudgets}
            onSaveCategoryBudgets={saveCategoryBudgets}
            onBackupData={backupData}
            onRestoreData={restoreData}
            onPrintReport={printReport}
            userName={userName}
            user={user}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col max-w-md mx-auto relative pb-32">
      {/* Header */}
      <header className="p-6 bg-white sticky top-0 z-30 border-b-4 border-outline transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-vibrant border-4 border-outline rounded-2xl flex items-center justify-center shadow-[4px_4px_0_var(--shadow-color)]">
              <Wallet className="w-6 h-6 text-true-white" />
            </div>
            <div>
              <h1 
                className="text-4xl font-display font-black tracking-tighter uppercase italic -rotate-2 select-none flex items-center"
                style={{
                  fontFamily: "'Bangers', 'Impact', cursive"
                }}
              >
                <span className="text-ink" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>K</span>
                <span className="text-ink" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>a</span>
                <span className="text-ink" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>s</span>
                <span className="text-ink" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>h</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-mint rounded-full animate-ping border border-outline" />
                <p className="text-[10px] text-ink font-black tracking-widest">MY WALLET</p>
                <div className="w-1 h-1 bg-ink/20 rounded-full" />
                <motion.span 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[8px] font-black uppercase text-ink/30 flex items-center gap-1"
                >
                  {user ? (
                    <>
                      <CheckCircle2 className="w-2 h-2 text-mint" /> SYNCED
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-2 h-2 text-coral" /> LOCAL ONLY
                    </>
                  )}
                </motion.span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setNewTransaction(prev => ({ ...prev, type: 'expense', category: 'Makanan' }));
                setIsFormOpen(true);
              }}
              className="w-10 h-10 bg-coral text-white comic-button flex items-center justify-center p-0"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center justify-between bg-true-ink p-1.5 rounded-2xl border-4 border-outline gap-1 transition-colors">
          {(['harian', 'bulanan', 'tahunan'] as TimeFilter[]).map((f) => (
            <button 
              key={f}
              onClick={() => { setTimeFilter(f); setCurrentDate(new Date()); }}
              className={cn(
                "flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all",
                timeFilter === f ? "bg-sun text-true-ink shadow-[2px_2px_0_var(--shadow-color)]" : "text-true-white/60 hover:text-true-white"
              )}
            >
              {f === 'harian' ? 'Daily' : f === 'bulanan' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {/* Navigation Control */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigateTime('prev')} className="p-2 comic-button bg-white">
            <ChevronLeft className="w-5 h-5 text-ink stroke-[3]" />
          </button>
          <div className="flex items-center gap-2 bg-true-ink text-true-white px-4 py-2 rounded-xl shadow-[4px_4px_0_var(--shadow-color)]">
            <CalendarIcon className="w-4 h-4 text-sun" />
            <span className="font-display font-black uppercase tracking-tight text-xs">
              {format(currentDate, 
                timeFilter === 'harian' ? 'd MMMM yyyy' : 
                timeFilter === 'bulanan' ? 'MMMM yyyy' : 'yyyy', 
                { locale: id }
              )}
            </span>
          </div>
          <button onClick={() => navigateTime('next')} className="p-2 comic-button bg-white">
            <ChevronRight className="w-5 h-5 text-ink stroke-[3]" />
          </button>
        </div>
        {/* Loading State — Shown during initial auth check */}
        {authLoading && (
          <div className="fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-vibrant border-4 border-outline rounded-3xl flex items-center justify-center animate-bounce shadow-[6px_6px_0_var(--shadow-color)]">
                <Wallet className="w-10 h-10 text-true-white" />
              </div>
              <div className="mt-8 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-vibrant" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/30">Mengecek Sesi...</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content — Only shown if authenticated and not loading */}
        {!authLoading && user && renderContent()}
      </main>

      {/* Login Screen — Shown when not authenticated */}
      <AnimatePresence>
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-cream flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--theme-border) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-vibrant rounded-full blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-coral rounded-full blur-[100px]" />
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-xs space-y-10 flex flex-col items-center text-center"
            >
              {/* Logo */}
              <div className="w-24 h-24 bg-indigo-vibrant border-4 border-outline rounded-[2rem] flex items-center justify-center shadow-[6px_6px_0_var(--shadow-color)] -rotate-3">
                <Wallet className="w-12 h-12 text-true-white" />
              </div>

              {/* Text */}
              <div className="space-y-3">
                <h2 className="text-6xl font-display font-black tracking-tighter uppercase italic -rotate-1" style={{ fontFamily: "'Bangers', 'Impact', cursive", textShadow: '4px 4px 0px var(--color-sun)' }}>
                  KASH!
                </h2>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">Smart Money Manager</p>
              </div>

              {/* Login Card */}
              <div className="comic-card bg-white p-8 w-full space-y-6 shadow-[8px_8px_0_var(--color-sun)]">
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">SELAMAT DATANG!</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-ink/40 leading-relaxed">
                    Masuk untuk mencadangkan data transaksi Anda ke Cloud.
                  </p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-ink comic-button py-5 font-black uppercase tracking-widest shadow-[4px_4px_0_var(--shadow-color)] flex items-center justify-center gap-3 hover:bg-orange-50 transition-colors"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  MASUK DENGAN GOOGLE
                </button>

                <div className="pt-4 flex items-center gap-2 justify-center">
                  <Shield className="w-3 h-3 text-mint" />
                  <span className="text-[8px] font-black uppercase text-ink/30 tracking-widest">Aman & Terenkripsi</span>
                </div>
              </div>

              <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">v2.0.2 - Made with 🔥 by Team Kash</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white border-[4px] border-outline max-w-md mx-auto z-40 px-3 py-3 rounded-[2rem] shadow-[var(--shadow-color)] transition-colors">
        <div className="flex justify-between items-center gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex-1 py-3 px-1 rounded-2xl transition-all flex items-center justify-center gap-1.5 border-[3px] border-transparent",
              activeTab === 'dashboard' 
                ? "bg-sun text-true-ink border-outline shadow-[var(--shadow-color)] font-black" 
                : "text-ink/30 grayscale"
            )}
          >
            <LayoutDashboard className="w-5 h-5 stroke-[3]" />
            {activeTab === 'dashboard' && <span className="text-[9px] font-black uppercase tracking-tighter">DASHBOARD</span>}
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "flex-1 py-3 px-1 rounded-2xl transition-all flex items-center justify-center gap-1.5 border-[3px] border-transparent",
              activeTab === 'transactions' 
                ? "bg-mint text-true-ink border-outline shadow-[var(--shadow-color)] font-black" 
                : "text-ink/30 grayscale"
            )}
          >
            <History className="w-5 h-5 stroke-[3]" />
            {activeTab === 'transactions' && <span className="text-[9px] font-black uppercase tracking-tighter">HISTORY</span>}
          </button>
          <button 
            onClick={() => setActiveTab('utang')}
            className={cn(
              "flex-1 py-3 px-1 rounded-2xl transition-all flex items-center justify-center gap-1.5 border-[3px] border-transparent",
              activeTab === 'utang' 
                ? "bg-indigo-vibrant text-true-white border-outline shadow-[var(--shadow-color)] font-black" 
                : "text-ink/30 grayscale"
            )}
          >
            <Wallet className="w-5 h-5 stroke-[3]" />
            {activeTab === 'utang' && <span className="text-[9px] font-black uppercase tracking-tighter">UTANG</span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 py-3 px-1 rounded-2xl transition-all flex items-center justify-center gap-1.5 border-[3px] border-transparent",
              activeTab === 'settings' 
                ? "bg-white text-ink border-outline shadow-[var(--shadow-color)] font-black" 
                : "text-ink/30 grayscale"
            )}
          >
            <Settings className="w-5 h-5 stroke-[3]" />
            {activeTab === 'settings' && <span className="text-[9px] font-black uppercase tracking-tighter">SETTING</span>}
          </button>
        </div>
      </nav>

      {/* Expense Modal Form — Full Screen Scrollable */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[50] max-w-md mx-auto flex flex-col bg-cream"
            style={{ overflowY: 'auto' }}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white border-b-4 border-outline px-6 py-4 flex items-center justify-between shadow-[(--shadow-color)]">
              <button
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="flex items-center gap-2 comic-button bg-sun text-true-ink px-4 py-2 text-xs font-black uppercase tracking-widest border-outline"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" />
                KEMBALI
              </button>
              <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-ink -rotate-1">
                {editingId ? 'EDIT!' : 'CATAT BARU!'}
              </h2>
              <label className={cn(
                "w-10 h-10 comic-button flex items-center justify-center cursor-pointer border-outline",
                isScanning ? "bg-ink/10" : "bg-indigo-vibrant text-white"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isScanning}
                />
                {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 stroke-[3] text-white" />}
              </label>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 p-6 space-y-6 pb-32">
              {/* Scan status */}
              <AnimatePresence>
                {scanStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "p-4 rounded-2xl border-4 flex flex-col gap-1 text-[11px] font-black uppercase tracking-widest relative",
                      scanStatus === 'scanning' ? "bg-sun/30 border-sun text-ink" :
                      scanStatus === 'success' ? "bg-mint/20 border-mint text-ink" : "bg-coral/20 border-coral text-coral"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {scanStatus === 'scanning' && <Loader2 className="w-5 h-5 animate-spin text-ink shrink-0" />}
                      {scanStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-mint shrink-0" />}
                      {scanStatus === 'error' && <AlertCircle className="w-5 h-5 text-coral shrink-0" />}
                      <span>{scanMessage}</span>
                    </div>
                    <span className="text-[7px] opacity-30 self-end">Scan Engine v3.0 (Stable v1)</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                {/* Type Selector */}
                <div className="flex p-1.5 bg-true-ink rounded-2xl border-4 border-outline gap-2">
                  {(['expense', 'income'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewTransaction(prev => ({
                        ...prev,
                        type,
                        category: type === 'expense' ? 'Makanan' : 'Gaji'
                      }))}
                      className={cn(
                        "flex-1 py-4 px-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        newTransaction.type === type
                          ? (type === 'expense' ? "bg-coral text-true-white shadow-[3px_3px_0_rgba(255,255,255,0.2)]" : "bg-mint text-true-ink shadow-[3px_3px_0_rgba(0,0,0,0.15)]")
                          : "text-true-white/50 hover:text-true-white"
                      )}
                    >
                      {type === 'expense' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      {type === 'expense' ? 'PENGELUARAN' : 'PEMASUKAN'}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="relative">
                  <label className="text-[11px] font-black text-ink uppercase tracking-widest ml-1 mb-2 block">💸 NOMINAL</label>
                  <div className="flex items-center gap-4 bg-white border-[4px] border-outline rounded-[1.5rem] px-6 py-6 focus-within:bg-orange-50 transition-colors">
                    <span className="font-display text-4xl font-black text-ink italic opacity-20 select-none pointer-events-none">Rp</span>
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      className="flex-1 bg-transparent border-none outline-none text-4xl font-display font-black tracking-tighter leading-none"
                    />
                  </div>
                  {newTransaction.amount && !isNaN(parseInt(newTransaction.amount)) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "absolute -top-2 right-3 text-[10px] font-black text-white px-3 py-1 rounded-full rotate-3 shadow-[(--shadow-color)] border-2 border-outline",
                        newTransaction.type === 'expense' ? "bg-coral" : "bg-mint !text-true-ink"
                      )}
                    >
                      {formatCurrency(parseInt(newTransaction.amount))}
                    </motion.div>
                  )}
                </div>

                {/* Quick amount shortcuts */}
                <div className="flex gap-2 flex-wrap">
                  {[10000, 25000, 50000, 100000, 200000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewTransaction(prev => ({
                        ...prev,
                        amount: (parseInt(prev.amount || '0') + amt).toString()
                      }))}
                      className={cn(
                        "flex-1 min-w-[4rem] py-2.5 border-[3px] border-outline rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all active:scale-95 active:translate-y-0.5 text-ink",
                        newTransaction.type === 'expense' ? "bg-coral/10 hover:bg-coral/20" : "bg-mint/10 hover:bg-mint/20"
                      )}
                    >
                      +{amt >= 1000 ? `${amt/1000}k` : amt}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-black text-ink uppercase tracking-widest ml-1 mb-2 block">📝 KETERANGAN</label>
                  <input
                    required
                    type="text"
                    placeholder={newTransaction.type === 'expense' ? "Apa yang kamu beli? 🔥" : "Duit dari mana nih? 🚀"}
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full comic-input font-black"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[11px] font-black text-ink uppercase tracking-widest ml-1 mb-2 block">📅 TANGGAL</label>
                  <div className="flex items-center gap-4 comic-input bg-orange-50 border-outline">
                    <CalendarIcon className="w-5 h-5 text-indigo-vibrant stroke-[3]" />
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="bg-transparent border-none flex-1 font-black uppercase text-xs tracking-widest text-ink focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-ink uppercase tracking-widest ml-1">📦 PILIH KATEGORI</label>
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.filter(c => c.type === newTransaction.type).map(cat => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setNewTransaction({ ...newTransaction, category: cat.name })}
                        className={cn(
                          "p-4 rounded-2xl border-4 flex flex-col items-center gap-1.5 transition-all comic-button",
                          newTransaction.category === cat.name
                            ? (newTransaction.type === 'expense' ? "bg-coral border-outline text-true-white" : "bg-mint border-outline text-true-ink")
                            : "bg-white border-outline/40"
                        )}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-[8px] font-black uppercase truncate w-full text-center leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurring Options */}
                <div className="space-y-3 p-4 border-4 border-outline rounded-2xl bg-white transition-all">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-2">
                      🔁 TRANSAKSI BERULANG
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newTransaction.isRecurring}
                        onChange={(e) => setNewTransaction({ ...newTransaction, isRecurring: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint border-2 border-outline"></div>
                    </label>
                  </div>
                  {newTransaction.isRecurring && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2 flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setNewTransaction({ ...newTransaction, recurringFrequency: freq })}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2",
                            newTransaction.recurringFrequency === freq
                              ? "bg-ink text-white border-outline"
                              : "bg-white text-ink/60 border-outline/20"
                          )}
                        >
                          {freq === 'daily' ? 'Harian' : freq === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={cn(
                    "w-full comic-button py-6 text-xl font-display font-black uppercase tracking-widest shadow-[(--shadow-color)] flex items-center justify-center gap-3 border-outline text-true-white",
                    newTransaction.type === 'expense' ? "bg-coral" : "bg-mint !text-true-ink"
                  )}
                >
                  <Plus className="w-6 h-6 stroke-[4]" />
                  SIMPAN SEKARANG!
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Modal */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsBudgetModalOpen(false)}
              className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[92%] max-w-sm"
            >
              <div className="comic-card bg-white text-ink shadow-[(--shadow-color)] overflow-hidden">
                {/* Header strip */}
                <div className="bg-sun border-b-4 border-outline px-6 py-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white border-4 border-outline rounded-2xl flex items-center justify-center text-2xl shadow-[(--shadow-color)]">
                    🎯
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase italic tracking-tighter leading-tight">ATUR ANGGARAN</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink/50">Anggaran bulanan kamu</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Current budget display */}
                  <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-2 border-outline/20 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">Saat ini</span>
                    <span className="text-sm font-black text-ink">
                      Rp {budget.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <form onSubmit={handleUpdateBudget} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-ink/50 mb-2 block ml-1">
                        💰 ANGGARAN BARU
                      </label>
                      {/* Input row with visible Rp badge */}
                      <div className="flex items-stretch border-[4px] border-outline rounded-2xl overflow-hidden focus-within:shadow-[0_0_0_3px_#FFD93D] transition-all">
                        <span className="bg-ink text-sun px-4 flex items-center font-black text-lg italic tracking-tight select-none shrink-0 border-r-4 border-outline">
                          Rp
                        </span>
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          className="flex-1 bg-white border-none outline-none text-2xl font-display font-black px-4 py-4 text-ink min-w-0"
                          placeholder="0"
                        />
                      </div>

                      {tempBudget && parseInt(tempBudget) > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] font-black text-mint mt-2 ml-1 uppercase tracking-wide"
                        >
                          ✓ Rp {parseInt(tempBudget).toLocaleString('id-ID')} / bulan
                        </motion.p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsBudgetModalOpen(false)}
                        className="flex-1 py-4 border-4 border-outline rounded-2xl font-black text-xs uppercase bg-white hover:bg-orange-50 transition-colors active:translate-y-0.5"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-ink text-sun comic-button py-4 font-black uppercase tracking-widest shadow-[4px_4px_0_#FFD93D] text-sm"
                      >
                        SIMPAN!
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Debt Modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDebtModalOpen(false)} className="fixed inset-0 bg-ink/80 z-[60]" />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-[61] max-w-md mx-auto p-4">
              <div className="comic-card bg-white p-8 space-y-6 !rounded-t-[3rem] !rounded-b-none shadow-[(--shadow-color)]">
                <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter">CATAT UTANG!</h2>
                <form onSubmit={handleAddDebt} className="space-y-4">
                  <div className="flex bg-ink p-1 rounded-2xl gap-1">
                    {(['debt', 'receivable'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewDebt({...newDebt, type: t})}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          newDebt.type === t ? (t === 'debt' ? "bg-coral text-white" : "bg-mint text-ink") : "text-white/40"
                        )}
                      >
                        {t === 'debt' ? 'UTANG SAYA' : 'PIUTANG SAYA'}
                      </button>
                    ))}
                  </div>
                  <input required type="text" placeholder="Siapa?" value={newDebt.person} onChange={(e) => setNewDebt({...newDebt, person: e.target.value})} className="w-full comic-input font-black" />
                  <div className="flex items-center gap-3 bg-white border-[4px] border-outline rounded-xl px-5 py-4 focus-within:bg-orange-50 transition-colors">
                    <span className="font-display text-xl font-black text-ink italic opacity-30 select-none">Rp</span>
                    <input required type="number" placeholder="Berapa?" value={newDebt.amount || ''} onChange={(e) => setNewDebt({...newDebt, amount: parseInt(e.target.value) || 0})} className="flex-1 bg-transparent border-none outline-none font-black text-xl" />
                  </div>
                  <input required type="date" value={newDebt.dueDate} onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})} className="w-full comic-input font-black uppercase text-xs" />
                  <button type="submit" className="w-full bg-sun text-ink comic-button py-5 text-lg font-black uppercase tracking-widest">SIMPAN RECORD!</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGoalModalOpen(false)} className="fixed inset-0 bg-ink/80 z-[60]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90%] max-w-sm">
              <div className="comic-card bg-white p-8 space-y-6 shadow-[(--shadow-color)]">
                <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter">BUAT TARGET!</h2>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div className="flex justify-between gap-2 overflow-x-auto p-1 py-2">
                    {['🎯','💻','✈️','🏠','🎮','🚗'].map(icon => (
                      <button 
                        key={icon}
                        type="button"
                        onClick={() => setNewGoal({...newGoal, icon})}
                        className={cn("text-3xl p-3 border-4 rounded-2xl transition-all", newGoal.icon === icon ? "bg-sun border-outline scale-110" : "bg-white border-outline grayscale opacity-40")}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input required type="text" placeholder="Mau beli apa?" value={newGoal.title} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})} className="w-full comic-input font-black uppercase" />
                  <div className="flex items-center gap-3 bg-white border-[4px] border-outline rounded-xl px-5 py-4 focus-within:bg-orange-50 transition-colors">
                    <span className="font-display text-xl font-black text-ink italic opacity-30 select-none">Rp</span>
                    <input required type="number" placeholder="Target Dana?" value={newGoal.targetAmount || ''} onChange={(e) => setNewGoal({...newGoal, targetAmount: parseInt(e.target.value) || 0})} className="flex-1 bg-transparent border-none outline-none font-black text-xl" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-vibrant text-white comic-button py-5 text-lg font-black uppercase tracking-widest shadow-[(--shadow-color)]">START MISSION!</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[85%] max-w-xs"
            >
              <div className="comic-card bg-white p-6 space-y-5 shadow-[8px_8px_0_#FF6B6B]">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🗑️</div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-ink">Hapus Transaksi?</h3>
                  <p className="text-[10px] font-black text-ink/40 uppercase tracking-widest">Aksi ini tidak bisa dibatalkan!</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-4 border-4 border-outline rounded-2xl font-black text-xs uppercase bg-white hover:bg-orange-50 transition-colors"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={confirmDeleteTransaction}
                    className="flex-1 py-4 bg-coral text-white border-4 border-outline rounded-2xl font-black text-xs uppercase shadow-[(--shadow-color)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                  >
                    HAPUS!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
}
