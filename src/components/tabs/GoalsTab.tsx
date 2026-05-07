import React from 'react';
import { Award, Target, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatNumber } from '../../lib/utils';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { Goal } from '../../types';

interface GoalsTabProps {
  goals: Goal[];
  setIsGoalModalOpen: (open: boolean) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (goal: Goal, amount: number) => void;
  privacyMode: boolean;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  setIsGoalModalOpen,
  deleteGoal,
  updateGoalProgress,
  privacyMode
}) => {
  return (
    <div className="space-y-8 px-4 pb-10">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-display font-black text-ink uppercase italic -rotate-1 tracking-tighter flex items-center gap-3">
          <span className="w-3 h-3 bg-indigo-vibrant rotate-45 border-2 border-outline"></span> TARGET KEUANGAN
        </h3>
        <button 
          onClick={() => setIsGoalModalOpen(true)}
          className="bg-white border-[3px] border-outline p-2 rounded-xl shadow-[4px_4px_0_var(--shadow-color)] hover:bg-orange-50 transition-all font-black"
        >
          <Award className="w-5 h-5 text-ink" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {goals.length === 0 ? (
          <div className="comic-card py-20 flex flex-col items-center text-ink/30 gap-4 bg-white">
            <Target className="w-12 h-12 stroke-[3]" />
            <p className="font-black text-xs uppercase tracking-[0.2em] italic underline">BELUM ADA TARGET!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map(goal => {
              const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isDone = percent >= 100;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={goal.id} 
                  className={cn("comic-card p-6 border-outline bg-white space-y-4 relative overflow-hidden shadow-[4px_4px_0_var(--shadow-color)]", isDone && "bg-sun/10 border-sun")}
                >
                  {isDone && <Award className="absolute top-2 right-2 w-12 h-12 text-sun rotate-12 opacity-30 animate-bounce" />}
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex gap-3 items-center">
                      <span className="text-3xl filter drop-shadow-[2px_2px_0px_#000]">{goal.icon}</span>
                      <div>
                        <h4 className="font-display font-black uppercase text-xl italic tracking-tighter text-ink">{goal.title}</h4>
                        <p className="text-[10px] font-black uppercase text-ink/40 tracking-widest">MISI MENABUNG</p>
                      </div>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-ink/30 hover:text-coral transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-ink/60">POWER LEVEL: {Math.round(percent)}%</span>
                      <span className="text-indigo-vibrant font-black italic">
                        <CurrencyDisplay amount={goal.targetAmount} privacyMode={privacyMode} />
                      </span>
                    </div>
                    <div className="h-6 w-full bg-ink/5 border-[3px] border-outline rounded-xl relative overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className={cn(
                          "absolute top-0 left-0 h-full border-r-[3px] border-outline transition-all",
                          isDone ? "bg-mint" : "bg-sun"
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-ink/80 uppercase tracking-tighter">
                        TERKUMPUL: <CurrencyDisplay amount={goal.currentAmount} privacyMode={privacyMode} />
                      </span>
                    </div>
                  </div>

                  {!isDone && (
                    <div className="flex gap-2 relative z-10">
                      {[10000, 50000, 100000].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => updateGoalProgress(goal, amt)}
                          className="flex-1 py-2 bg-orange-50 border-2 border-outline rounded-lg font-black text-[9px] hover:bg-sun transition-all active:translate-y-1 active:shadow-none"
                        >
                          +{formatNumber(amt)}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
