import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { CurrencyDisplay } from './CurrencyDisplay';

interface StatsCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  variant?: 'mint' | 'coral' | 'sun' | 'white';
  privacyMode: boolean;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  amount, 
  icon, 
  variant = 'white', 
  privacyMode,
  className 
}) => {
  const variants = {
    mint: 'bg-mint !text-[#1A1A1A]',
    coral: 'bg-coral !text-[#1A1A1A]',
    sun: 'bg-sun !text-[#1A1A1A]',
    white: 'bg-white text-ink'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, rotate: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn("comic-card p-5 border-outline cursor-pointer", variants[variant], className)}
    >
      <div className="flex items-center gap-2 mb-2 opacity-60">
        <div className={cn("p-1.5 rounded-lg border-2 border-outline bg-white")}>
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-xl font-display font-black leading-tight break-words">
        <CurrencyDisplay amount={amount} privacyMode={privacyMode} />
      </div>
    </motion.div>
  );
};
