import React from 'react';
import { cn, formatCurrency } from '../lib/utils';

interface CurrencyDisplayProps {
  amount: number | string;
  privacyMode: boolean;
  className?: string;
  prefix?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  amount, 
  privacyMode, 
  className,
  prefix = ''
}) => {
  const formatted = typeof amount === 'number' ? formatCurrency(amount) : amount;
  
  return (
    <span className={cn(
      className,
      privacyMode && "blur-md select-none bg-ink/5 rounded px-1 transition-all duration-300"
    )}>
      {prefix}{formatted}
    </span>
  );
};
