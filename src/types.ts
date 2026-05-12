export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface TokenPosition {
  type: 'base' | 'path' | 'homeStretch' | 'finished';
  index: number; // For path it's 0-51, for homeStretch it's 0-5, for base it's 0-3
  mood?: 'happy' | 'sad' | 'angry';
}

export interface Player {
  id: PlayerColor;
  tokens: TokenPosition[];
  homePathStart: number; // Index in the 52-path where they enter home stretch
  startPathIndex: number; // Index in the 52-path where they start
}

export interface GameState {
  players: Record<PlayerColor, Player>;
  currentTurn: PlayerColor;
  diceValue: number | null;
  isRolling: boolean;
  gameStatus: 'setup' | 'rolling' | 'moving' | 'finished';
  winner: PlayerColor | null;
  playerCount: 2 | 4;
}
