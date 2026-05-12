import { motion } from 'motion/react';
import { PlayerColor } from '../types';
import { COLORS } from '../constants';

export interface TokenProps {
  color: PlayerColor;
  id: number;
  onClick?: () => void;
  isClickable?: boolean;
  position?: string; // row-col key
  isFinished?: boolean;
  mood?: 'happy' | 'sad' | 'angry';
}

const Face = ({ mood, color }: { mood: 'happy' | 'sad' | 'angry', color: PlayerColor }) => {
  return (
    <div className="relative w-full h-full group" style={{ perspective: '500px' }}>
      {/* 3D Side/Rim */}
      <div 
        className="absolute inset-0 rounded-full translate-y-[3px]" 
        style={{ backgroundColor: '#B8860B', border: `1px solid ${COLORS[color]}` }} 
      />
      
      {/* Main Face Disc */}
      <div 
        className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
        style={{ 
          backgroundColor: '#FFDE34', 
          boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.6)',
          border: `1.5px solid ${COLORS[color]}`,
          transform: 'translateZ(2px)'
        }}
      >
        {mood === 'sad' && (
          <div className="flex flex-col items-center justify-center relative w-full h-full">
            <div className="flex gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 bg-black/80 rounded-full relative">
                <motion.div animate={{ height: [0, 6, 10], y: [0, 2, 6], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-full left-0 w-1 bg-blue-400 rounded-full shadow-sm" />
              </div>
              <div className="w-1.5 h-1.5 bg-black/80 rounded-full relative">
                <motion.div animate={{ height: [0, 6, 10], y: [0, 2, 6], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="absolute top-full left-0 w-1 bg-blue-400 rounded-full shadow-sm" />
              </div>
            </div>
            <div className="w-3 h-1.5 border-t-2 border-black/60 rounded-[50%] mt-1" />
          </div>
        )}

        {mood === 'angry' && (
          <div className="flex flex-col items-center justify-center w-full h-full bg-red-500/10">
            <div className="flex gap-1.5 mb-1 relative">
              <div className="relative">
                <div className="absolute -top-1 -left-0.5 w-2.5 h-0.5 bg-black rotate-[30deg] rounded-full" />
                <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
              </div>
              <div className="relative">
                <div className="absolute -top-1 -right-0.5 w-2.5 h-0.5 bg-black -rotate-[30deg] rounded-full" />
                <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
              </div>
            </div>
            <div className="w-3 h-1 bg-black/80 rounded-sm shadow-sm" />
          </div>
        )}

        {mood === 'happy' && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex gap-2.5 mb-1">
              <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
              <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
            </div>
            <div className="relative w-4 h-2.5 bg-black/80 rounded-b-full overflow-hidden shadow-inner">
               <div className="absolute top-0 left-0 w-full h-0.5 bg-white/90" />
            </div>
          </div>
        )}
        
        {/* Specular Highlight */}
        <div className="absolute top-[10%] left-[15%] w-1.5 h-1 bg-white/40 blur-[1px] rounded-full rotate-[-20deg]" />
      </div>
    </div>
  );
};

export default function Token({ color, id, onClick, isClickable, position, isFinished, mood = 'happy' }: TokenProps) {
  return (
    <motion.div
      layoutId={`token-${color}-${id}`}
      key={`token-${color}-${id}-${position}`}
      initial={{ scale: 0.8, y: -20, rotateX: 0 }}
      animate={{ 
        scale: isFinished ? [1, 1.1, 1] : 1, 
        y: isClickable ? [0, -10, 0] : 0,
        boxShadow: isFinished 
          ? `0 0 40px ${COLORS[color]}, 0 0 60px rgba(255,255,255,0.5)`
          : (isClickable 
            ? `0 15px 30px rgba(0,0,0,0.4), 0 0 20px ${COLORS[color]}80` 
            : `0 5px 15px rgba(0,0,0,0.3)`)
      }}
      transition={{ 
        type: "spring", stiffness: 400, damping: 15,
        y: isClickable ? { repeat: Infinity, duration: 2 } : { type: "spring" },
        scale: isFinished ? { repeat: Infinity, duration: 1.5 } : { type: "spring" },
        layout: { duration: 0.7, type: "spring", stiffness: 120, damping: 18 }
      }}
      whileHover={isClickable ? { scale: 1.2 } : {}}
      whileTap={isClickable ? { scale: 0.9 } : {}}
      onClick={isClickable ? onClick : undefined}
      className={`relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center z-20 cursor-pointer`}
    >
      <Face mood={mood} color={color} />

      {/* Active/Move Glow */}
      {isClickable && (
        <motion.div 
          animate={{ 
            scale: [1, 1.8, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 blur-2xl -z-20 rounded-full"
          style={{ backgroundColor: COLORS[color] }}
        />
      )}

      {/* Royal Sparkle */}
      {isClickable && (
        <motion.div
           animate={{ 
             scale: [0, 1.5, 0],
             rotate: [0, 180],
             opacity: [0, 1, 0]
           }}
           transition={{ repeat: Infinity, duration: 1.5, delay: Math.random() }}
           className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 pointer-events-none z-40"
        >
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-white blur-[0.5px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[2px] bg-white blur-[0.5px]" />
        </motion.div>
      )}

      {/* Shine Sweep Effect */}
      {isClickable && (
        <motion.div
           animate={{ x: [-100, 200] }}
           transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
           className="absolute inset-0 w-20 h-full bg-white/40 skew-x-[-45deg] blur-xl pointer-events-none z-30"
        />
      )}
    </motion.div>
  );
}
