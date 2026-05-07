import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={cn(
        "flex items-center gap-3 p-4 border-[3px] border-outline rounded-2xl shadow-[(--shadow-color)] min-w-[280px] z-[100]",
        type === 'success' ? "bg-mint text-ink" : 
        type === 'error' ? "bg-coral text-white" : 
        type === 'warning' ? "bg-sun text-ink border-coral" : "bg-sun text-ink"
      )}
    >
      {type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
      {type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
      
      <span className="flex-1 font-black text-xs uppercase tracking-tight leading-tight">{message}</span>
      
      <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<{ toasts: { id: string; message: string; type: ToastType }[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-6 right-6 flex flex-col gap-3 z-[100] max-w-[calc(100vw-48px)]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};
