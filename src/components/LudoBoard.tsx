import React from 'react';
import { PlayerColor } from '../types';
import { GENERAL_PATH, HOME_STRETCH, COLORS, SAFE_INDICES } from '../constants';
import Token from './Token';
import { Star } from 'lucide-react';

interface LudoBoardProps {
  tokensByPosition: Record<string, { color: PlayerColor; index: number; id: number; isFinished: boolean; mood?: 'happy' | 'sad' | 'angry' }[]>;
  onTokenMove: (color: PlayerColor, tokenId: number) => void;
  clickableTokens: { color: PlayerColor; tokenId: number }[];
}

export default function LudoBoard({ tokensByPosition, onTokenMove, clickableTokens }: LudoBoardProps) {
  const renderCell = (row: number, col: number) => {
    const isRedBase = row < 6 && col < 6;
    const isGreenBase = row < 6 && col > 8;
    const isYellowBase = row > 8 && col > 8;
    const isBlueBase = row > 8 && col < 6;
    
    const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
    
    let homeStretchColor: PlayerColor | null = null;
    for (const [color, path] of Object.entries(HOME_STRETCH)) {
      if (path.some(([r, c]) => r === row && c === col)) {
        homeStretchColor = color as PlayerColor;
        break;
      }
    }

    const pathIndex = GENERAL_PATH.findIndex(([r, c]) => r === row && c === col);
    const isSafe = pathIndex !== -1 && SAFE_INDICES.includes(pathIndex);

    let styles: React.CSSProperties = { 
        backgroundColor: '#FFFFFF',
    };

    if (isRedBase) styles.backgroundColor = COLORS.red;
    if (isGreenBase) styles.backgroundColor = COLORS.green;
    if (isYellowBase) styles.backgroundColor = COLORS.yellow;
    if (isBlueBase) styles.backgroundColor = COLORS.blue;
    
    // Start squares and home stretches
    if (pathIndex === 1) styles.backgroundColor = COLORS.red;
    if (pathIndex === 14) styles.backgroundColor = COLORS.green;
    if (pathIndex === 27) styles.backgroundColor = COLORS.yellow;
    if (pathIndex === 40) styles.backgroundColor = COLORS.blue;
    if (homeStretchColor) styles.backgroundColor = COLORS[homeStretchColor];

    const posKey = `${row}-${col}`;
    const tokensAtThisPos = tokensByPosition[posKey] || [];

    // Bases: The large white squares with 4 circles
    const isBaseCenter = 
        ((row === 1 || row === 4) && (col === 1 || col === 4)) || 
        ((row === 1 || row === 4) && (col === 10 || col === 13)) || 
        ((row === 10 || row === 13) && (col === 10 || col === 13)) || 
        ((row === 10 || row === 13) && (col === 1 || col === 4));

    // The white inner squares of the bases
    const isInnerBase = 
        (row >= 1 && row <= 4 && col >= 1 && col <= 4) ||
        (row >= 1 && row <= 4 && col >= 10 && col <= 13) ||
        (row >= 10 && row <= 13 && col >= 10 && col <= 13) ||
        (row >= 10 && row <= 13 && col >= 1 && col <= 4);

    return (
      <div 
        key={`${row}-${col}`}
        className={`w-full aspect-square border-[0.5px] border-black/10 flex items-center justify-center relative ${isCenter ? 'overflow-hidden' : ''}`}
        style={styles}
      >
        {isInnerBase && !isBaseCenter && (
            <div className="absolute inset-0 bg-white m-[2px] z-0 rounded-xl" />
        )}
        {isBaseCenter && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-0 rounded-2xl m-[4px]">
                <div className="w-2/3 h-2/3 rounded-full shadow-inner" style={{ backgroundColor: isRedBase ? COLORS.red : isGreenBase ? COLORS.green : isYellowBase ? COLORS.yellow : COLORS.blue }} />
            </div>
        )}

        {isCenter && (
          <div className="absolute inset-0">
             {/* Cross-split triangles matching the image */}
             <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)', backgroundColor: COLORS.red }} />
             <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%)', backgroundColor: COLORS.green }} />
             <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)', backgroundColor: COLORS.yellow }} />
             <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)', backgroundColor: COLORS.blue }} />
          </div>
        )}

        {isSafe && !isCenter && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-1 md:p-1.5 opacity-30">
                <Star className="w-full h-full text-black" strokeWidth={1.5} />
            </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-0.5 z-10 w-full h-full p-0.5 pointer-events-none">
          {tokensAtThisPos.map((t) => (
            <div key={`${t.color}-${t.id}`} className="pointer-events-auto">
              <Token 
                color={t.color}
                id={t.id}
                isClickable={clickableTokens.some(ct => ct.color === t.color && ct.tokenId === t.id)}
                onClick={() => onTokenMove(t.color, t.id)}
                position={posKey}
                isFinished={t.isFinished}
                mood={t.mood}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      cells.push(renderCell(r, c));
    }
  }

  return (
    <div className="grid grid-cols-15 grid-rows-15 w-full aspect-square bg-white select-none">
      {cells}
    </div>
  );
}
