export type PremiumType = 'DL' | 'TL' | 'DW' | 'TW' | 'STAR' | null;

export interface BoardSquare {
  x: number;
  y: number;
  premium: PremiumType;
  tile?: Tile;
}

export interface Tile {
  letter: string;
  points: number;
  id: string;
}

export interface PlayedWord {
  word: string;
  points: number;
  position_x: number;
  position_y: number;
  direction: 'horizontal' | 'vertical';
}

export const GERMAN_LETTER_DISTRIBUTION: Record<string, { count: number; points: number }> = {
  'A': { count: 5, points: 1 },
  'B': { count: 2, points: 3 },
  'C': { count: 2, points: 4 },
  'D': { count: 4, points: 1 },
  'E': { count: 15, points: 1 },
  'F': { count: 2, points: 4 },
  'G': { count: 3, points: 2 },
  'H': { count: 4, points: 2 },
  'I': { count: 6, points: 1 },
  'J': { count: 1, points: 6 },
  'K': { count: 2, points: 4 },
  'L': { count: 3, points: 2 },
  'M': { count: 4, points: 3 },
  'N': { count: 9, points: 1 },
  'O': { count: 3, points: 2 },
  'P': { count: 1, points: 4 },
  'Q': { count: 1, points: 10 },
  'R': { count: 6, points: 1 },
  'S': { count: 7, points: 1 },
  'T': { count: 6, points: 1 },
  'U': { count: 6, points: 1 },
  'V': { count: 1, points: 6 },
  'W': { count: 1, points: 3 },
  'X': { count: 1, points: 8 },
  'Y': { count: 1, points: 10 },
  'Z': { count: 1, points: 3 },
  'Ä': { count: 1, points: 6 },
  'Ö': { count: 1, points: 8 },
  'Ü': { count: 1, points: 6 },
  ' ': { count: 2, points: 0 }, // Blanks
};
