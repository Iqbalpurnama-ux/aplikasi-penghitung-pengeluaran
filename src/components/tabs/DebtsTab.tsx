import React from 'react';
import { UserPlus, HandCoins, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { Debt } from '../../types';

interface DebtsTabProps {
  debts: Debt[];
  setIsDebtModalOpen: (open: boolean) => void;
  toggleDebtPaid: (debt: Debt) => void;
  deleteDebt: (id: string) => void;
  privacyMode: boolean;
}

export const DebtsTab: React.FC<DebtsTabProps> = ({
  debts,
  setIsDebtModalOpen,
  toggleDebtPaid,
  deleteDebt,
  privacyMode
}) => {
  return (
    <div className="space-y-8 px-4 pb-10">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-black text-ink uppercase italic -rotate-1 tracking-tighter flex items-center gap-3">
          <span className="w-3 h-3 bg-sun rotate-45 border-2 border-outline"></span> UTANG & PIUTANG
        </h3>
        <button 
          onClick={() => setIsDebtModalOpen(true)}
          className="bg-white border-[3px] border-outline p-2 rounded-xl shadow-[4px_4px_0_var(--shadow-color)] hover:bg-orange-50 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          <UserPlus className="w-5 h-5 text-ink" />
        </button>
      </div>

      <div className="space-y-4">
        {debts.length === 0 ? (
          <div className="comic-card py-20 flex flex-col items-center text-ink/30 gap-4 bg-white">
            <HandCoins className="w-12 h-12 stroke-[3]" />
            <p className="font-black text-xs uppercase tracking-[0.2em] italic underline">BERSIH DARI UTANG!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {debts.map(debt => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={debt.id} 
                className={cn(
                  "p-5 comic-card flex items-center gap-4 relative overflow-hidden",
                  debt.isPaid ? "opacity-50 grayscale shadow-none" : (debt.type === 'debt' ? "bg-coral/5 shadow-[4px_4px_0_var(--shadow-color)]" : "bg-mint/5 shadow-[4px_4px_0_var(--shadow-color)]")
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl border-2 border-outline flex items-center justify-center text-xl shadow-[4px_4px_0_var(--shadow-color)]",
                  debt.type === 'debt' ? "bg-coral text-true-white" : "bg-mint text-true-ink"
                )}>
                  {debt.type === 'debt' ? '💸' : '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-ink truncate text-sm uppercase italic leading-none">{debt.person}</h4>
                  <div className="flex items-center gap-2 text-[9px] text-ink/60 font-black uppercase tracking-widest mt-2">
                    <span className={cn(
                      "px-2 py-0.5 border border-outline rounded",
                      debt.type === 'debt' ? "bg-coral text-true-white" : "bg-mint text-true-ink"
                    )}>{debt.type === 'debt' ? 'HUTANG' : 'PIUTANG'}</span>
                    <div className="w-1 h-1 bg-ink rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(debt.dueDate), 'dd MMM yy')}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-display font-black text-ink leading-none mb-1">
                    <CurrencyDisplay amount={debt.amount} privacyMode={privacyMode} />
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleDebtPaid(debt)}
                      className={cn(
                        "p-1.5 border-2 border-outline rounded-xl transition-all",
                        debt.isPaid ? "bg-mint text-white" : "bg-white text-ink hover:bg-mint"
                      )}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteDebt(debt.id)}
                      className="p-1.5 bg-white border-2 border-outline text-ink hover:bg-coral hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
