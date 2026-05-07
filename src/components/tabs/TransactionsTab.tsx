import React, { useState, useMemo } from 'react';
import { Search, Trash2, Pencil, X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { Transaction } from '../../types';

interface TransactionsTabProps {
  filteredTransactions: Transaction[];
  deleteTransaction: (id: string) => void;
  editTransaction: (tx: Transaction) => void;
  privacyMode: boolean;
  CATEGORIES: any[];
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  filteredTransactions,
  deleteTransaction,
  editTransaction,
  privacyMode,
  CATEGORIES,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const displayed = useMemo(() => {
    let list = filteredTransactions;
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filteredTransactions, filterType, search]);

  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    displayed.forEach(t => {
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [displayed]);

  return (
    <div className="space-y-5 px-4 pb-32">
      {/* Header */}
      <h3 className="text-2xl font-display font-black text-ink uppercase italic -rotate-1 tracking-tighter flex items-center gap-3">
        <span className="w-3 h-3 bg-mint rotate-45 border-2 border-outline" /> LOG TRANSAKSI
      </h3>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="comic-card p-4 bg-mint/10 border-mint flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-mint shrink-0 stroke-[3]" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-ink/40">MASUK</p>
            <p className="font-black text-sm text-mint">
              <CurrencyDisplay amount={totalIncome} privacyMode={privacyMode} />
            </p>
          </div>
        </div>
        <div className="comic-card p-4 bg-coral/10 border-coral flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-coral shrink-0 stroke-[3]" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-ink/40">KELUAR</p>
            <p className="font-black text-sm text-coral">
              <CurrencyDisplay amount={totalExpense} privacyMode={privacyMode} />
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 comic-input bg-white border-outline py-3 px-4">
        <Search className="w-4 h-4 text-ink/30 stroke-[3] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari transaksi..."
          className="flex-1 bg-transparent border-none outline-none text-sm font-black placeholder:text-ink/20 text-ink"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-ink/40 hover:text-coral transition-colors">
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-true-ink p-1.5 rounded-2xl gap-1 border-4 border-outline">
        {(['all', 'expense', 'income'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={cn(
              "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-4 border-outline transition-all",
              filterType === f
                ? f === 'expense' ? "bg-coral text-true-white shadow-[2px_2px_0_var(--shadow-color)]"
                  : f === 'income' ? "bg-mint text-true-ink shadow-[2px_2px_0_var(--shadow-color)]"
                  : "bg-sun text-true-ink shadow-[2px_2px_0_var(--shadow-color)]"
                : "text-true-white/50 hover:text-true-white/80"
            )}
          >
            {f === 'all' ? 'Semua' : f === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      {/* Count */}
      {search || filterType !== 'all' ? (
        <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">
          {displayed.length} hasil ditemukan
        </p>
      ) : null}

      {/* List */}
      {displayed.length === 0 ? (
        <div className="comic-card py-20 flex flex-col items-center text-ink/30 gap-4 bg-white">
          <Search className="w-12 h-12 stroke-[3]" />
          <p className="font-black text-xs uppercase tracking-[0.2em] italic">
            {search ? 'Tidak ditemukan' : 'Tidak ada data'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {grouped.map(([date, txs]) => (
              <motion.div
                key={date}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-ink/40">
                    {format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: id })}
                  </span>
                  <div className="flex-1 h-px bg-ink/10" />
                </div>

                {/* Transactions for that date */}
                <div className="space-y-3">
                  {txs.map(transaction => {
                    const cat = CATEGORIES.find(c => c.name === transaction.category);
                    return (
                      <motion.div
                        layout
                        key={transaction.id}
                        className={cn(
                          "p-4 comic-card flex items-center gap-4 group",
                          transaction.type === 'expense' ? "bg-orange-50" : "bg-mint/5"
                        )}
                      >
                        <div className={cn(
                          "text-2xl w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-outline shadow-[4px_4px_0_var(--shadow-color)] shrink-0",
                          transaction.type === 'income' ? "border-mint" : "border-coral/30",
                          "bg-white"
                        )}>
                          {cat?.icon || (transaction.type === 'expense' ? '✨' : '💸')}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-ink truncate text-sm uppercase italic">
                            {transaction.description}
                          </h4>
                          <span className={cn(
                            "inline-block px-2 py-0.5 border border-outline text-[9px] font-black uppercase mt-0.5",
                            transaction.type === 'expense' ? "bg-sun text-ink" : "bg-mint text-ink"
                          )}>
                            {transaction.category}
                          </span>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <span className={cn(
                            "font-display font-black drop-shadow-[4px_4px_0_var(--shadow-color)] text-sm",
                            transaction.type === 'expense' ? "text-coral" : "text-mint"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}{' '}
                            <CurrencyDisplay amount={transaction.amount} privacyMode={privacyMode} />
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => editTransaction(transaction)}
                              className="p-1.5 text-ink/30 hover:text-indigo-vibrant hover:bg-indigo-vibrant/10 border-2 border-transparent hover:border-indigo-vibrant rounded-xl transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="p-1.5 text-ink/30 hover:text-coral hover:bg-coral/10 border-2 border-transparent hover:border-coral rounded-xl transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
