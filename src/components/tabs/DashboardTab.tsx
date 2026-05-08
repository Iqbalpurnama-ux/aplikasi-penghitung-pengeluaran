import React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Target, 
  TrendingUp, 
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { StatsCard } from '../StatsCard';
import { Transaction, Category, CategoryBudget } from '../../types';
import { endOfMonth } from 'date-fns';

interface DashboardTabProps {
  totalIncome: number;
  totalSpent: number;
  budget: number;
  budgetUsagePercent: number;
  privacyMode: boolean;
  setIsBudgetModalOpen: (open: boolean) => void;
  chartData: any[];
  categoryData: any[];
  categoryBudgets: CategoryBudget[];
  filteredTransactions: Transaction[];
  savingsHabits: string;
  insights: any[];
  formatCurrency: (amount: number) => string;
  timeFilter: 'harian' | 'bulanan' | 'tahunan';
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  totalIncome,
  totalSpent,
  budget,
  budgetUsagePercent,
  privacyMode,
  setIsBudgetModalOpen,
  chartData,
  categoryData,
  categoryBudgets,
  filteredTransactions,
  savingsHabits,
  insights,
  timeFilter
}) => {
  const estimatedEndOfMonth = totalSpent + (totalSpent / Math.max(1, new Date().getDate()) * (endOfMonth(new Date()).getDate() - new Date().getDate()));

  return (
    <div className="space-y-8 px-4">
      {/* Balance Overview */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard 
          title="PEMASUKAN" 
          amount={totalIncome} 
          icon={<ArrowUpCircle className="w-4 h-4 text-[#FFFFFF] fill-mint" />} 
          variant="mint"
          privacyMode={privacyMode}
        />
        <StatsCard 
          title="PENGELUARAN" 
          amount={totalSpent} 
          icon={<ArrowDownCircle className="w-4 h-4 text-[#FFFFFF] fill-coral" />} 
          variant="coral"
          privacyMode={privacyMode}
        />
      </div>

      {/* Total Balance Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01, y: -5 }}
        className="comic-card p-8 bg-white border-outline relative overflow-hidden shadow-[4px_4px_0_var(--shadow-color)] group cursor-pointer"
      >
        <div className="absolute inset-0 half-tone opacity-10 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-ink/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">SALDO SAAT INI</span>
          </div>
          
          <div className="text-4xl font-display font-black tracking-tighter text-ink mb-6 drop-shadow-[2px_2px_0px_#FFD93D] break-words leading-tight">
            <CurrencyDisplay amount={totalIncome - totalSpent} privacyMode={privacyMode} />
          </div>
          
          {/* Budget Progress */}
          {budget > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-ink/50">
                <span>ANGGARAN: <CurrencyDisplay amount={budget} privacyMode={privacyMode} /></span>
                <button onClick={() => setIsBudgetModalOpen(true)} className="text-indigo-vibrant hover:underline font-black">UBAH</button>
              </div>
              <div className="h-6 w-full bg-ink/5 border-[3px] border-outline rounded-xl relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsagePercent}%` }}
                  className={cn(
                    "absolute top-0 left-0 h-full border-r-[3px] border-outline transition-colors",
                    budgetUsagePercent > 90 ? "bg-coral" : "bg-sun"
                  )}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tighter">
                <span className={budgetUsagePercent > 90 ? "text-coral" : "text-mint"}>
                  {budgetUsagePercent.toFixed(1)}% TERPAKAI
                </span>
                <span className="text-ink/40 uppercase tracking-tighter">SISA: <CurrencyDisplay amount={Math.max(0, budget - totalSpent)} privacyMode={privacyMode} /></span>
              </div>
              {budgetUsagePercent > 90 && (
                <motion.div 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="p-3 bg-coral/10 border-2 border-coral rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-coral animate-pulse" />
                  <span className="text-[10px] font-black text-coral uppercase tracking-tight">SIAGA! BUDGET HAMPIR HABIS!</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Category Budgets */}
      {categoryBudgets.length > 0 && (
        <div className="comic-card p-6 bg-white space-y-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
            <Target className="w-4 h-4" /> LIMIT KATEGORI
          </h4>
          <div className="space-y-4">
            {categoryBudgets.map(cb => {
              const spent = filteredTransactions
                .filter(t => t.type === 'expense' && t.category === cb.category)
                .reduce((s, t) => s + t.amount, 0);
              const percent = Math.min((spent / cb.limit) * 100, 100);
              const isOver = spent > cb.limit;
              
              return (
                <div key={cb.category} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black uppercase">{cb.category}</span>
                    <div className="text-right">
                      <span className={cn("text-xs font-black", isOver ? "text-coral" : "text-ink")}>
                        <CurrencyDisplay amount={spent} privacyMode={privacyMode} />
                      </span>
                      <span className="text-[9px] font-black uppercase text-ink/40">
                        {' / '}<CurrencyDisplay amount={cb.limit} privacyMode={privacyMode} />
                      </span>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-ink/5 border-2 border-outline rounded-lg relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className={cn(
                        "absolute top-0 left-0 h-full border-r-2 border-outline transition-colors",
                        isOver ? "bg-coral" : percent > 80 ? "bg-sun" : "bg-mint"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Analysis Group */}
      <div className="grid grid-cols-1 gap-6">
        <div className="comic-card p-6 bg-white space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> STATISTIK PENGELUARAN
            </h4>
          </div>
          
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--theme-border)" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'var(--theme-text)', fontWeight: 900 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border-2 border-outline p-2 shadow-[4px_4px_0_var(--shadow-color)]">
                            <p className="text-[10px] font-black text-ink uppercase">
                              <CurrencyDisplay amount={payload[0].value as number} privacyMode={privacyMode} />
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[4, 4, 0, 0]} 
                    fill="#6C5CE7"
                    className="drop-shadow-[4px_4px_0_var(--shadow-color)]"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-4 border-outline border-dashed rounded-2xl bg-orange-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-ink/20">DATA TIDAK CUKUP</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart Section */}
        {categoryData.length > 0 && (
          <div className="comic-card p-6 bg-white space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
              <PieIcon className="w-4 h-4" /> PEMBAGIAN KATEGORI
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="var(--theme-card)"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border-2 border-outline p-2 shadow-[4px_4px_0_var(--shadow-color)]">
                            <p className="text-[10px] font-black text-ink uppercase">
                              {payload[0].name}: <CurrencyDisplay amount={payload[0].value as number} privacyMode={privacyMode} />
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-outline" style={{ backgroundColor: cat.color }} />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-ink/60 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Savings Habit Insight */}
      <div className="comic-card p-5 bg-indigo-vibrant border-outline text-white relative overflow-hidden group">
        <div className="absolute inset-0 half-tone opacity-10" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-[4px_4px_0_var(--shadow-color)]">🎯</div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">SAVINGS RADAR</h4>
            <p className="text-xs font-black leading-tight">{savingsHabits}</p>
          </div>
        </div>
      </div>

      {/* Forecast Card */}
      <div className="comic-card p-5 bg-sun border-outline text-ink relative overflow-hidden shadow-[4px_4px_0_var(--shadow-color)]">
        <div className="absolute top-0 right-0 p-3 opacity-20"><TrendingUp className="w-8 h-8" /></div>
        <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" /> PREDIKSI AKHIR BULAN
        </h4>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-display font-black italic -rotate-1 break-words leading-tight">
            <CurrencyDisplay amount={estimatedEndOfMonth} privacyMode={privacyMode} />
          </span>
          <span className="text-[9px] font-black uppercase text-ink/40 mb-1">ESTIMASI TOTAL</span>
        </div>
        <p className="text-[8px] font-black uppercase tracking-tight mt-2 opacity-60">BERDASARKAN TREN PENGELUARAN HARIAN KAMU SAAT INI.</p>
      </div>

      {/* Smart Insights list */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-ink/40">
            <Zap className="w-4 h-4" /> SMART INSIGHTS
          </h4>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={insight.name} 
                className="comic-card p-4 bg-white border-outline flex items-center gap-4"
              >
                <div className={cn(
                  "p-2 border-2 border-outline rounded-lg",
                  insight.percent > 0 ? "bg-coral/20" : "bg-mint/20"
                )}>
                  {insight.percent > 0 ? <ArrowUpCircle className="w-4 h-4 text-coral" /> : <ArrowDownCircle className="w-4 h-4 text-mint" />}
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black uppercase text-ink/40 leading-none mb-1">{insight.name}</p>
                  <p className="text-[10px] font-black uppercase flex items-center gap-1">
                    {insight.percent > 0 ? 'NAIK' : 'TURUN'} 
                    <span className={insight.percent > 0 ? 'text-coral' : 'text-mint'}>{Math.abs(Math.round(insight.percent))}%</span>
                    DARI {timeFilter === 'harian' ? 'KEMARIN' : 'BULAN LALU'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


