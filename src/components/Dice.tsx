import { motion } from 'motion/react';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const DiceFace = ({ value }: { value: number | null }) => {
  if (!value) return null;
  
  const Dot = () => <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-neutral-900 rounded-full shadow-sm" />;

  const renderDots = () => {
    switch (value) {
      case 1:
        return <div className="flex items-center justify-center h-full"><Dot /></div>;
      case 2:
        return (
          <div className="flex flex-col justify-between h-full p-1.5 md:p-2">
            <div className="flex justify-end"><Dot /></div>
            <div className="flex justify-start"><Dot /></div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col justify-between h-full p-1.5 md:p-2">
            <div className="flex justify-end"><Dot /></div>
            <div className="flex justify-center"><Dot /></div>
            <div className="flex justify-start"><Dot /></div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col justify-between h-full p-1.5 md:p-2">
            <div className="flex justify-between"><Dot /><Dot /></div>
            <div className="flex justify-between"><Dot /><Dot /></div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col justify-between h-full p-1.5 md:p-2">
            <div className="flex justify-between"><Dot /><Dot /></div>
            <div className="flex justify-center"><Dot /></div>
            <div className="flex justify-between"><Dot /><Dot /></div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col justify-between h-full p-1.5 md:p-2">
            <div className="flex justify-between"><Dot /><Dot /></div>
            <div className="flex justify-between"><Dot /><Dot /></div>
            <div className="flex justify-between"><Dot /><Dot /></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg md:rounded-xl border-b-4 border-r-2 border-stone-300 shadow-inner">
      {renderDots()}
    </div>
  );
};

export default function Dice({ value, isRolling, onRoll, disabled }: DiceProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileHover={!disabled ? { 
          scale: 1.1, 
          rotateY: 15,
          rotateX: -10,
          boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' 
        } : {}}
        whileTap={!disabled ? { scale: 0.9, rotateX: 20 } : {}}
        onClick={onRoll}
        disabled={disabled}
        className={`relative w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all bg-stone-200 border-b-8 border-r-4 border-stone-400 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_4px_8px_rgba(255,255,255,0.5)] group overflow-hidden`}
        style={{ 
          perspective: '1500px',
          transformStyle: 'preserve-3d'
        }}
      >
        <motion.div
          animate={isRolling ? { 
            rotateX: [0, 360, 720],
            rotateY: [0, 270, 540],
            rotateZ: [0, 180, 0],
            scale: [1, 1.3, 0.8, 1.2, 1],
            y: [0, -40, 0]
          } : { 
            rotateX: value ? 20 : 0, 
            rotateY: value ? -15 : 0,
            y: 0 
          }}
          transition={isRolling ? { repeat: Infinity, duration: 0.5, ease: "linear" } : { type: "spring", stiffness: 120, damping: 10 }}
          className="relative z-10 w-full h-full flex items-center justify-center p-1.5 md:p-2.5"
        >
          <DiceFace value={value || 1} />
        </motion.div>

        {/* Shine Sweep */}
        {!disabled && (
          <motion.div 
            animate={{ x: [-100, 100] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 w-8 h-full bg-white/10 skew-x-[-30deg] blur-md z-20 pointer-events-none"
          />
        )}

        {/* Outer Glow */}
        {!disabled && (
           <div className="absolute inset-0 bg-yellow-600/10 blur-3xl -z-20 rounded-full scale-150 animate-pulse" />
        )}
      </motion.button>
      <span className="text-[10px] md:text-xs font-black uppercase italic tracking-[0.3em] text-yellow-500/80 font-serif drop-shadow-md">
        {isRolling ? 'The Fates Spin...' : value ? `Destiny: ${value}` : 'Invoke the Oracle'}
      </span>
    </div>
  );
}
