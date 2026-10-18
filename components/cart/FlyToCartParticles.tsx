'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';

export interface FlyingParticle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

interface FlyToCartParticlesProps {
  particles: FlyingParticle[];
}

export default function FlyToCartParticles({ particles }: FlyToCartParticlesProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              position: 'fixed', 
              left: particle.startX, 
              top: particle.startY, 
              scale: 0.2, 
              opacity: 1 
            }}
            animate={{ 
              left: particle.targetX, 
              top: particle.targetY, 
              scale: [0.2, 1.4, 1, 0.2], 
              opacity: [1, 1, 1, 0], 
              rotate: [0, 180, 360, 540] 
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="fixed -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-amber-400/60 blur-md animate-pulse" />
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,1)] border-2 border-white ring-2 ring-amber-300/80">
                <Star className="w-5 h-5 text-white fill-white drop-shadow-sm" />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
