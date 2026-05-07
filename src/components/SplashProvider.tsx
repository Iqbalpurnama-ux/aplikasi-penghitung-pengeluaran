import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';

// ── Splash Screen ─────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#121212]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Dynamic Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #FFD93D 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-vibrant blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.05, 0.08, 0.05]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-coral blur-[120px]" 
        />
      </div>

      {/* Original Decorative shapes restored */}
      <motion.div
        className="absolute top-16 left-10 w-16 h-16 rounded-lg z-0"
        style={{ background: '#6C5CE7', border: '4px solid #FFD93D' }}
        initial={{ rotate: -20, scale: 0, x: -40 }}
        animate={{ rotate: 12, scale: 1, x: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      />
      <motion.div
        className="absolute bottom-24 right-8 w-20 h-20 rounded-full z-0"
        style={{ background: '#FF6B6B', border: '4px solid #FFD93D' }}
        initial={{ scale: 0, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
      />
      <motion.div
        className="absolute top-1/3 -right-4 w-12 h-12 z-0"
        style={{ background: '#4ECDC4', border: '4px solid #fff', transform: 'rotate(45deg)' }}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      />
      <motion.div
        className="absolute bottom-48 left-6 w-8 h-8 z-0"
        style={{ background: '#FFD93D', border: '4px solid #fff' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      />

      {/* Main Content Container */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Floating Logo Box */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: [0, -10, 0],
            rotate: [0, 2, 0]
          }}
          transition={{ 
            opacity: { duration: 0.6 },
            scale: { type: 'spring', stiffness: 100, damping: 15 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="mb-12 relative"
        >
          <div
            className="w-32 h-32 flex items-center justify-center rounded-[2.5rem] relative group"
            style={{
              background: 'linear-gradient(135deg, #6C5CE7 0%, #4834d4 100%)',
              border: '6px solid #1A1A1A',
              boxShadow: '10px 10px 0px #FFD93D',
            }}
          >
            <Wallet className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
            
            {/* Badge */}
            <motion.div
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-coral border-[4px] border-[#1A1A1A] shadow-lg"
            >
              💰
            </motion.div>
          </div>
        </motion.div>

        {/* Text Group */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <motion.div
            initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="font-black uppercase italic tracking-tighter leading-none select-none flex items-center"
              style={{
                fontSize: '6rem',
                fontFamily: "'Bangers', 'Impact', cursive",
              }}
            >
              <span style={{ color: '#FFD93D', WebkitTextStroke: '3px #1A1A1A', textShadow: '8px 8px 0px #FF6B6B' }}>K</span>
              <span style={{ color: '#FFD93D', WebkitTextStroke: '3px #1A1A1A', textShadow: '8px 8px 0px #FF6B6B' }}>A</span>
              <span style={{ color: '#FFD93D', WebkitTextStroke: '3px #1A1A1A', textShadow: '8px 8px 0px #FF6B6B' }}>S</span>
              <span style={{ color: '#FFD93D', WebkitTextStroke: '3px #1A1A1A', textShadow: '8px 8px 0px #FF6B6B' }}>H</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
          >
            <p 
              className="font-black uppercase text-center tracking-[0.3em]"
              style={{ fontSize: '0.6rem', color: '#FFD93D' }}
            >
              PANTAU KEUANGAN HARIANMU DENGAN LEBIH MUDAH
            </p>
          </motion.div>
        </div>

        {/* Premium Loading Bar */}
        <div className="w-48 h-3 bg-white/5 rounded-full border-2 border-[#1A1A1A] relative overflow-hidden shadow-inner">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, #FFD93D, #FF6B6B)',
              boxShadow: '0 0 15px rgba(255, 217, 61, 0.5)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1, duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
        </div>
      </div>

      {/* Footer Version */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 flex items-center gap-3"
      >
        <div className="h-px w-8 bg-white/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
          V2.0
        </span>
        <div className="h-px w-8 bg-white/20" />
      </motion.div>
    </motion.div>
  );
}

// ── Provider ─────────────────────────────────────────────────────────────
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
