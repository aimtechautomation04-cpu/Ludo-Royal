import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayerColor, GameState, Player, TokenPosition } from './types';
import { 
  GENERAL_PATH, 
  HOME_STRETCH, 
  BASE_POSITIONS, 
  START_INDEX, 
  PRE_HOME_INDEX, 
  SAFE_INDICES,
  COLORS,
  BOARD_COLORS
} from './constants';
import LudoBoard from './components/LudoBoard';
import Dice from './components/Dice';
import { Trophy, RefreshCcw, Volume2, VolumeX, Crown, Shield, Castle, Sword, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundService } from './services/soundService';

const INITIAL_PLAYERS: Record<PlayerColor, Player> = {
  red: {
    id: 'red',
    tokens: Array(4).fill(null).map((_, i) => ({ type: 'base', index: i })),
    homePathStart: PRE_HOME_INDEX.red,
    startPathIndex: START_INDEX.red,
  },
  green: {
    id: 'green',
    tokens: Array(4).fill(null).map((_, i) => ({ type: 'base', index: i })),
    homePathStart: PRE_HOME_INDEX.green,
    startPathIndex: START_INDEX.green,
  },
  yellow: {
    id: 'yellow',
    tokens: Array(4).fill(null).map((_, i) => ({ type: 'base', index: i })),
    homePathStart: PRE_HOME_INDEX.yellow,
    startPathIndex: START_INDEX.yellow,
  },
  blue: {
    id: 'blue',
    tokens: Array(4).fill(null).map((_, i) => ({ type: 'base', index: i })),
    homePathStart: PRE_HOME_INDEX.blue,
    startPathIndex: START_INDEX.blue,
  },
};

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    players: INITIAL_PLAYERS,
    currentTurn: 'red',
    diceValue: null,
    isRolling: false,
    gameStatus: 'setup',
    winner: null,
    playerCount: 4,
  });

  const playerOrder = useMemo(() => {
    return gameState.playerCount === 2 ? ['red', 'yellow'] as PlayerColor[] : ['red', 'green', 'yellow', 'blue'] as PlayerColor[];
  }, [gameState.playerCount]);

  const nextTurn = useCallback((shouldStay: boolean = false) => {
    setGameState(prev => {
      const order = prev.playerCount === 2 ? (['red', 'yellow'] as PlayerColor[]) : (['red', 'green', 'yellow', 'blue'] as PlayerColor[]);
      const currentIndex = order.indexOf(prev.currentTurn);
      const nextPlayer = shouldStay ? prev.currentTurn : order[(currentIndex + 1) % order.length];
      return {
        ...prev,
        currentTurn: nextPlayer as PlayerColor,
        diceValue: null,
        gameStatus: 'rolling',
      };
    });
  }, []);

  const rollDice = async () => {
    if (gameState.isRolling || gameState.gameStatus !== 'rolling') return;

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    if (!isMuted) soundService.playDiceRoll();
    setGameState(prev => ({ ...prev, isRolling: true }));
    
    // Simulate roll animation
    await new Promise(resolve => setTimeout(resolve, 800));

    const value = Math.floor(Math.random() * 6) + 1;
    
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentTurn];
      const movableTokens = currentPlayer.tokens.filter((token, i) => {
        if (token.type === 'finished') return false;
        if (token.type === 'base' && value !== 6) return false;
        if (token.type === 'homeStretch' && token.index + value > 5) return false;
        return true;
      });

      if (movableTokens.length === 0 && value !== 6) {
        // No moves possible, wait a bit and move to next turn
        setTimeout(() => nextTurn(), 1000);
        return {
          ...prev,
          diceValue: value,
          isRolling: false,
          gameStatus: 'moving'
        };
      }

      return {
        ...prev,
        diceValue: value,
        isRolling: false,
        gameStatus: 'moving'
      };
    });
  };

  const handleTokenMove = useCallback((color: PlayerColor, tokenId: number) => {
    if (gameState.currentTurn !== color || gameState.gameStatus !== 'moving' || !gameState.diceValue) return;

    const diceValue = gameState.diceValue;
    const players = { ...gameState.players };
    const player = players[color];
    const token = player.tokens[tokenId];

    // Reset current player moods to happy when they start moving
    player.tokens = player.tokens.map(t => ({ ...t, mood: 'happy' }));

    let newTokenPos: TokenPosition = { ...token, mood: 'happy' };
    let captured = false;
    let reachedHome = false;

    if (token.type === 'base') {
      if (diceValue === 6) {
        newTokenPos = { type: 'path', index: START_INDEX[color], mood: 'happy' };
      }
    } else if (token.type === 'path') {
      let newIdx = token.index;
      let stepsRemaining = diceValue;
      
      const preHomeIdx = PRE_HOME_INDEX[color];
      
      // Dodge Detection: check path for opponent tokens we move over
      let passedIndices: number[] = [];
      let tempIdx = token.index;
      for(let i=0; i<diceValue; i++) {
        tempIdx = (tempIdx + 1) % 52;
        passedIndices.push(tempIdx);
      }

      // Mark dodged opponents as angry
      for (const otherColor of playerOrder) {
        if (otherColor === color) continue;
        const otherPlayer = players[otherColor];
        otherPlayer.tokens = otherPlayer.tokens.map(t => {
          if (t.type === 'path' && passedIndices.includes(t.index)) {
            return { ...t, mood: 'angry' };
          }
          return t;
        });
      }
      
      // Move logic
      newIdx = token.index;
      stepsRemaining = diceValue;
      while (stepsRemaining > 0) {
        if (newIdx === preHomeIdx) {
          newTokenPos = { type: 'homeStretch', index: stepsRemaining - 1, mood: 'happy' };
          stepsRemaining = 0;
        } else {
          newIdx = (newIdx + 1) % 52;
          stepsRemaining--;
        }
      }

      if (newTokenPos.type === 'path') {
        newTokenPos.index = newIdx;
      }
    } else if (token.type === 'homeStretch') {
      if (token.index + diceValue <= 5) {
        newTokenPos.index = token.index + diceValue;
        if (newTokenPos.index === 5) {
          newTokenPos.type = 'finished';
          reachedHome = true;
        }
      } else {
        // Should have been blocked by clickable check, but safety
        return;
      }
    }

    // Capture logic
    if (newTokenPos.type === 'path') {
      const isSafe = SAFE_INDICES.includes(newTokenPos.index);
      if (!isSafe) {
        for (const otherColor of playerOrder) {
          if (otherColor === color) continue;
          
          const otherPlayer = players[otherColor];
          const tokensToCapture = otherPlayer.tokens.filter(t => t.type === 'path' && t.index === newTokenPos.index);
          
          if (tokensToCapture.length > 0) {
            captured = true;
            otherPlayer.tokens = otherPlayer.tokens.map(t => 
              (t.type === 'path' && t.index === newTokenPos.index) 
              ? { type: 'base', index: otherPlayer.tokens.indexOf(t), mood: 'sad' } 
              : t
            );
          }
        }
      }
    }

    // Update state
    player.tokens[tokenId] = newTokenPos;
    
    // Play sound based on action
    if (!isMuted) {
      if (player.tokens.every(t => t.type === 'finished')) soundService.playWin();
      else if (reachedHome) soundService.playHome();
      else if (captured) soundService.playCapture();
      else soundService.playMove();
    }

    // Check for win
    const allFinished = player.tokens.every(t => t.type === 'finished');
    if (allFinished) {
      setGameState(prev => ({
        ...prev,
        players,
        winner: color,
        gameStatus: 'finished'
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      players,
    }));

    // Decide if next turn or stay
    const stay = diceValue === 6 || captured || reachedHome;
    nextTurn(stay);
  }, [gameState.currentTurn, gameState.gameStatus, gameState.diceValue, gameState.players, playerOrder, isMuted, nextTurn]);

  const tokensByPosition = useMemo(() => {
    const map: Record<string, { color: PlayerColor; index: number; id: number; isFinished: boolean; mood?: 'happy' | 'sad' | 'angry' }[]> = {};
    
    playerOrder.forEach((color) => {
      const player = gameState.players[color];
      player.tokens.forEach((token, i) => {
        let r, c;
        if (token.type === 'base') {
          [r, c] = BASE_POSITIONS[color as PlayerColor][i];
        } else if (token.type === 'path') {
          [r, c] = GENERAL_PATH[token.index];
        } else if (token.type === 'homeStretch') {
          [r, c] = HOME_STRETCH[color as PlayerColor][token.index];
        } else {
            // Finished tokens move to center middle
            [r, c] = [7, 7];
        }

        const key = `${r}-${c}`;
        if (!map[key]) map[key] = [];
        map[key].push({ color: color as PlayerColor, index: i, id: i, isFinished: token.type === 'finished', mood: token.mood });
      });
    });
    
    return map;
  }, [gameState.players, playerOrder]);

  const clickableTokens = useMemo(() => {
    if (gameState.gameStatus !== 'moving' || !gameState.diceValue) return [];
    
    const currentPlayer = gameState.players[gameState.currentTurn];
    const diceValue = gameState.diceValue;

    return currentPlayer.tokens
      .map((token, i) => {
        if (token.type === 'finished') return null;
        if (token.type === 'base' && diceValue !== 6) return null;
        if (token.type === 'homeStretch' && token.index + diceValue > 5) return null;
        return { color: gameState.currentTurn, tokenId: i };
      })
      .filter((t): t is { color: PlayerColor; tokenId: number } => t !== null);
  }, [gameState.gameStatus, gameState.diceValue, gameState.currentTurn, gameState.players]);

  // Auto-move effect
  useEffect(() => {
    if (gameState.gameStatus === 'moving' && clickableTokens.length === 1) {
      const timer = setTimeout(() => {
        handleTokenMove(clickableTokens[0].color, clickableTokens[0].tokenId);
      }, 700); // 700ms delay to let user see the dice roll result
      return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, clickableTokens, handleTokenMove]);

  const resetGame = () => {
    setGameState({
      players: JSON.parse(JSON.stringify(INITIAL_PLAYERS)),
      currentTurn: 'red',
      diceValue: null,
      isRolling: false,
      gameStatus: 'setup',
      winner: null,
      playerCount: 4,
    });
  };

  const startGame = (count: 2 | 4) => {
    setGameState({
      players: JSON.parse(JSON.stringify(INITIAL_PLAYERS)),
      currentTurn: 'red',
      diceValue: null,
      isRolling: false,
      playerCount: count,
      gameStatus: 'rolling',
      winner: null,
    });
  };

  return (
    <div 
      className="min-h-screen text-white font-sans flex flex-col items-center p-2 md:p-8 gap-4 md:gap-8 overflow-x-hidden relative"
      style={{ backgroundColor: BOARD_COLORS.dark }}
    >
      {/* Background Pattern & Bokeh */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
      
      {/* Decorative Orbs & Bokeh */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Floating Bokeh Bubbles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`bokeh-${i}`}
          initial={{ 
            opacity: 0,
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%'
          }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            y: ['-10%', '110%'],
            x: [Math.random() * 100 + '%', Math.random() * 100 + '%']
          }}
          transition={{ 
            duration: 15 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear",
            delay: -Math.random() * 20
          }}
          className="absolute w-12 h-12 md:w-24 md:h-24 rounded-full border border-white/10 blur-sm pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent)`
          }}
        />
      ))}

      {/* Lens Flares / Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180]
            }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
            className="absolute"
            style={{ 
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 w-8 h-8 md:w-12 md:h-12 bg-white/20 blur-xl rounded-full translate-x-[-15%] translate-y-[-15%]" />
              <div className="w-4 h-[1px] md:w-8 md:h-[2px] bg-white rounded-full" />
              <div className="h-4 w-[1px] md:h-8 md:w-[2px] bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
        ))}
      </div>

      {gameState.gameStatus !== 'setup' && (
        <button 
          onClick={resetGame}
          className="absolute top-4 left-4 p-3 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700 hover:bg-neutral-700 transition-colors z-50 shadow-xl flex items-center gap-2 pr-5 group"
        >
          <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest text-yellow-500/80">Back</span>
        </button>
      )}

      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 right-4 p-3 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700 hover:bg-neutral-700 transition-colors z-50 shadow-xl"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-yellow-500" />}
      </button>

      <header className="flex flex-col items-center gap-0.5 md:gap-1 text-center z-10 mt-10 md:mt-0">
        <div className="hidden md:flex items-center gap-3 mb-1">
            <div className="h-[1px] w-12 bg-yellow-600/30" />
            <Crown className="w-8 h-8 text-yellow-500 p-1 border border-yellow-600/30 rounded-full" />
            <div className="h-[1px] w-12 bg-yellow-600/30" />
        </div>
        <h1 className="text-3xl md:text-9xl font-serif font-black tracking-tighter uppercase italic select-none drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 via-yellow-600 to-yellow-900">
          Ludo Royale
        </h1>
        <p className="text-yellow-700/80 uppercase tracking-[0.5em] text-[8px] md:text-xs font-bold font-sans">The Sovereign Strategy Board</p>
      </header>

      <AnimatePresence mode="wait">
        {gameState.gameStatus === 'setup' ? (
          <motion.main 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-10 z-10 w-full max-w-4xl"
          >
            <div className="text-center">
              <h2 className="text-3xl font-serif italic text-yellow-600/80 mb-2">Choose Your Conquest</h2>
              <p className="text-neutral-500 uppercase tracking-widest text-xs">Select the number of claimants to the throne</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {[2, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => startGame(count as 2 | 4)}
                  className="group relative p-8 md:p-12 bg-neutral-900/50 backdrop-blur-md rounded-[2.5rem] border-2 border-yellow-800/30 hover:border-yellow-600 transition-all flex flex-col items-center gap-6 overflow-hidden shadow-2xl"
                >
                  <div className="absolute inset-0 bg-yellow-600/0 group-hover:bg-yellow-600/5 transition-colors" />
                  <div className="relative">
                    {count === 2 ? (
                      <div className="flex gap-4">
                        <Shield className="w-16 h-16 text-red-800" />
                        <Shield className="w-16 h-16 text-yellow-800" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <Shield className="w-10 h-10 text-red-800" />
                        <Shield className="w-10 h-10 text-green-800" />
                        <Shield className="w-10 h-10 text-blue-800" />
                        <Shield className="w-10 h-10 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-5xl font-black font-serif italic text-white group-hover:text-yellow-500 transition-colors">
                      {count} <span className="text-2xl">Players</span>
                    </span>
                    <p className="text-neutral-500 uppercase tracking-[0.2em] text-[10px] mt-2">
                      {count === 2 ? 'A Duel of Destinies' : 'A Royal Conflict'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.main>
        ) : (
          <motion.main 
            key="game"
            initial={{ opacity: 0, scale: 0.8, rotateX: 45, y: 100 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="flex flex-col lg:flex-row items-center gap-4 md:gap-16 w-full max-w-6xl z-10"
          >
            {/* Board Section */}
            <div className="relative flex-1 flex justify-center w-full px-2 md:px-0">
              <div className="w-full max-w-[660px] aspect-square" style={{ perspective: '2000px' }}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, rotateX: 0 }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                    rotateX: 10,
                    boxShadow: `0 50px 100px -20px rgba(0,0,0,0.5), 0 30px 60px -30px rgba(0,0,0,0.3)`
                  }}
                  className="w-full h-full p-2 md:p-4 bg-white border-[8px] md:border-[16px] border-neutral-100 rounded-lg relative group transition-all"
                  style={{ 
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Board Depth (Pseudo-3D Side) */}
                  <div className="absolute inset-0 translate-z-[-20px] bg-neutral-300 rounded-lg" style={{ transform: 'translateZ(-1px) translateY(12px)' }} />

                  <div className="relative z-10 w-full h-full border-2 border-black/10 rounded-sm overflow-hidden bg-white shadow-inner">
                      <LudoBoard 
                        tokensByPosition={tokensByPosition} 
                        onTokenMove={handleTokenMove} 
                        clickableTokens={clickableTokens}
                      />
                  </div>
                </motion.div>
              </div>
              
              <AnimatePresence>
                {gameState.winner && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl"
                  >
                    <motion.div 
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-neutral-900 p-8 md:p-12 rounded-[2rem] border-4 border-yellow-600 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(217,119,6,0.3)] text-center m-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                      
                      <div className="relative">
                        <Trophy className="w-20 h-20 md:w-28 md:h-28 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-yellow-500/20 rounded-full scale-150" 
                        />
                      </div>

                      <div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter font-serif text-white">
                          {gameState.winner} <span className="text-yellow-600 font-serif">Ascends!</span>
                        </h2>
                        <p className="text-yellow-700 font-bold uppercase tracking-[0.2em] mt-3 text-xs md:text-sm">The Throne is yours, Oh Sovereign One</p>
                      </div>

                      <button 
                        onClick={resetGame}
                        className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-500 text-black px-10 py-4 rounded-full font-black uppercase text-sm transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                        <RefreshCcw className="w-5 h-5" /> Start New Reign
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls Section */}
            <div className="flex flex-row lg:flex-col items-center justify-center lg:justify-between h-full py-1 md:py-8 gap-4 md:gap-16 min-w-[320px] w-full lg:w-auto">
              <div className="flex flex-col items-center gap-1 md:gap-4">
                <h3 className="text-[7px] md:text-xs font-black text-yellow-600/40 uppercase tracking-[0.5em] font-sans hidden md:block">Dominion</h3>
                <div 
                  className="px-3 py-1 md:px-16 md:py-8 rounded-lg md:rounded-3xl border md:border-4 flex flex-row lg:flex-col items-center gap-2 md:gap-3 transition-all shadow-lg relative overflow-hidden group"
                  style={{ 
                    borderColor: `${COLORS[gameState.currentTurn]}80`,
                    backgroundColor: `${COLORS[gameState.currentTurn]}15`,
                    color: COLORS[gameState.currentTurn]
                  }}
                >
                  <div className="w-2 h-2 md:w-8 md:h-8 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ backgroundColor: COLORS[gameState.currentTurn] }} />
                  <span className="text-sm md:text-4xl font-serif font-bold uppercase tracking-tight italic drop-shadow-md">
                    {gameState.currentTurn}
                  </span>
                </div>
              </div>

              <Dice 
                value={gameState.diceValue} 
                isRolling={gameState.isRolling} 
                onRoll={rollDice} 
                disabled={gameState.gameStatus !== 'rolling' || gameState.winner !== null}
              />

              <div className="bg-neutral-900/40 backdrop-blur-md p-4 md:p-8 rounded-xl md:rounded-[2rem] border border-yellow-600/20 w-full max-w-[300px] hidden lg:block shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950 px-4 py-1 border border-yellow-600/20 rounded-full">
                  <p className="text-[9px] font-black text-yellow-600/60 uppercase tracking-[0.4em]">Tactical Oracle</p>
                </div>
                <div className="text-sm md:text-base text-gray-400 leading-relaxed font-serif italic text-center pt-2">
                  {gameState.gameStatus === 'rolling' && "Seek the counsel of the dice to chart your journey."}
                  {gameState.gameStatus === 'moving' && (clickableTokens.length > 0 
                    ? "Commander, direct your forces toward the Citadel."
                    : "The fates are silent. Turn passed.")}
                  {gameState.diceValue === 6 && "A royal decree! Six grants extra maneuver."}
                </div>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Stats / Player Grid */}
      {gameState.gameStatus !== 'setup' && (
        <footer className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 w-full max-w-5xl mt-2 md:mt-8">
          {playerOrder.map(color => {
            const player = gameState.players[color] as Player;
          const finishedCount = player.tokens.filter(t => t.type === 'finished').length;
          const isActive = gameState.currentTurn === color;
          
          return (
            <div 
              key={color}
              className={`p-2 md:p-5 rounded-xl md:rounded-2xl border md:border-2 transition-all relative overflow-hidden group shadow-lg ${
                isActive ? 'border-yellow-500/50 bg-neutral-900/40 shadow-yellow-500/10' : 'border-neutral-800/50 bg-black/40 opacity-70 hover:opacity-100'
              }`}
            >
                {isActive && (
                    <motion.div 
                        layoutId="active-highlight"
                        className="absolute inset-0 bg-yellow-600/10 z-0 animate-pulse" 
                    />
                )}
                <div className="flex justify-between items-center mb-1 md:mb-3 relative z-10">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest font-serif flex items-center gap-1" style={{ color: COLORS[color] }}>
                        {isActive && <Crown className="w-2 h-2 md:w-3 md:h-3 animate-bounce" />}
                        {color}
                    </span>
                    <span className="text-[8px] md:text-[10px] font-bold text-yellow-600/40 uppercase tracking-tighter">
                        {finishedCount}/4 Home
                    </span>
                </div>
                <div className="flex gap-1 md:gap-2 relative z-10">
                    {player.tokens.map((t, i) => (
                        <div 
                            key={i} 
                            className={`flex-1 h-1 md:h-1.5 rounded-full transition-all duration-1000 ${
                                t.type === 'finished' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-neutral-800'
                            }`} 
                        />
                    ))}
                </div>
            </div>
          );
        })}
        </footer>
      )}
    </div>
  );
}
