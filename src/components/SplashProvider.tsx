import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';

// ── Splash Screen Component ──────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    // Sembunyikan splash screen bawaan Capacitor
    CapSplashScreen.hide().catch(() => {});
    
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-cream dark:bg-[#0F0F0F] transition-colors duration-500"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Dynamic Comic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.15] dark:opacity-20"
          style={{
            backgroundImage: 'radial-gradient(var(--theme-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-vibrant blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-coral blur-[120px]" 
        />
      </div>

      {/* Decorative Floating Shapes */}
      <motion.div
        className="absolute top-20 left-[10%] w-12 h-12 border-4 border-sun rounded-xl shadow-[4px_4px_0_var(--shadow-color)]"
        animate={{ y: [0, -20, 0], rotate: [0, 45, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-40 right-[15%] w-16 h-16 border-4 border-mint rounded-full shadow-[4px_4px_0_var(--shadow-color)]"
        animate={{ y: [0, 25, 0], rotate: [0, -30, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Main Logo Content */}
      <div className="relative flex flex-col items-center z-10">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            y: [0, -15, 0]
          }}
          transition={{ 
            scale: { type: 'spring', stiffness: 100, damping: 12 },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="mb-8"
        >
          <div
            className="w-28 h-28 flex items-center justify-center rounded-[2rem] relative bg-indigo-vibrant border-[6px] border-outline shadow-[8px_8px_0_var(--shadow-color)]"
          >
            <Wallet className="w-14 h-14 text-true-white" strokeWidth={2.5} />
            
            {/* Badge */}
            <motion.div
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-coral border-[4px] border-outline shadow-lg"
            >
              💰
            </motion.div>
          </div>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-10"
        >
          <h1
            className="font-black italic tracking-tighter"
            style={{
              fontSize: '5.5rem',
              fontFamily: "'Bangers', 'Impact', cursive",
              color: 'var(--color-sun)',
              WebkitTextStroke: '3px var(--theme-border)',
              textShadow: '8px 8px 0px var(--color-coral)'
            }}
          >
            KASH
          </h1>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="inline-block bg-mint text-true-ink font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 border-[3px] border-outline shadow-[3px_3px_0_var(--shadow-color)] rotate-[-1deg]"
          >
            Smart Finance Assistant
          </motion.div>
        </motion.div>

        {/* Loading Indicator */}
        <div className="w-48 h-5 bg-white/20 dark:bg-white/5 rounded-full border-[3px] border-outline relative overflow-hidden shadow-inner">
          <motion.div
            className="absolute top-0 left-0 h-full bg-sun border-r-[3px] border-outline"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
          />
        </div>
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-ink/40 dark:text-white/30 font-black text-[9px] mt-4 uppercase tracking-[0.2em]"
        >
          Loading your balance...
        </motion.p>
      </div>

      {/* Version Footer */}
      <div className="absolute bottom-10 flex items-center gap-3 opacity-20 dark:opacity-40">
        <div className="h-px w-8 bg-ink dark:bg-white" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ink dark:text-white">
          v2.0.2
        </span>
        <div className="h-px w-8 bg-ink dark:bg-white" />
      </div>
    </motion.div>
  );
}

// ── Splash Provider ──────────────────────────────────────────────────────
export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onDone={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
