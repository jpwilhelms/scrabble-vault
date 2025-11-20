import { BoardSquare, PremiumType } from '@/types/scrabble';

const PREMIUM_LAYOUT: (PremiumType)[][] = [
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  ['TW', null, null, 'DL', null, null, null, 'STAR', null, null, null, 'DL', null, null, 'TW'],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
];

export function createBoard(): BoardSquare[][] {
  const board: BoardSquare[][] = [];
  
  for (let y = 0; y < 15; y++) {
    board[y] = [];
    for (let x = 0; x < 15; x++) {
      board[y][x] = {
        x,
        y,
        premium: PREMIUM_LAYOUT[y][x],
      };
    }
  }
  
  return board;
}

export function getPremiumLabel(premium: PremiumType): string {
  switch (premium) {
    case 'DL':
      return '2×\nBuchst.';
    case 'TL':
      return '3×\nBuchst.';
    case 'DW':
      return '2×\nWort';
    case 'TW':
      return '3×\nWort';
    case 'STAR':
      return '★';
    default:
      return '';
  }
}

export function getPremiumColor(premium: PremiumType): string {
  switch (premium) {
    case 'DL':
      return 'bg-scrabble-doubleLetter';
    case 'TL':
      return 'bg-scrabble-tripleLetter';
    case 'DW':
      return 'bg-scrabble-doubleWord';
    case 'TW':
      return 'bg-scrabble-tripleWord';
    case 'STAR':
      return 'bg-scrabble-star';
    default:
      return 'bg-card';
  }
}
