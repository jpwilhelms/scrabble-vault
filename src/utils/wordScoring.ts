import { BoardSquare, Tile } from '@/types/scrabble';

interface PlacedTile {
  x: number;
  y: number;
  tile: Tile;
}

interface WordInfo {
  word: string;
  tiles: PlacedTile[];
  direction: 'horizontal' | 'vertical';
}

// Findet alle Wörter, die durch die gelegten Tiles gebildet wurden
export function findAllWords(
  board: BoardSquare[][],
  placedTiles: PlacedTile[]
): WordInfo[] {
  const words: WordInfo[] = [];
  
  if (placedTiles.length === 0) return words;

  // Bestimme Richtung der gelegten Tiles
  const allSameRow = placedTiles.every(t => t.y === placedTiles[0].y);
  const allSameCol = placedTiles.every(t => t.x === placedTiles[0].x);
  
  const mainDirection: 'horizontal' | 'vertical' = allSameRow ? 'horizontal' : 'vertical';
  const crossDirection: 'horizontal' | 'vertical' = mainDirection === 'horizontal' ? 'vertical' : 'horizontal';

  // Hauptwort finden (entlang der Legelinien)
  const mainWord = findWordAt(board, placedTiles[0].x, placedTiles[0].y, mainDirection);
  if (mainWord && mainWord.tiles.length > 1) {
    words.push(mainWord);
  }

  // Kreuzwörter für jeden gelegten Tile finden
  for (const placed of placedTiles) {
    const crossWord = findWordAt(board, placed.x, placed.y, crossDirection);
    if (crossWord && crossWord.tiles.length > 1) {
      // Prüfen ob dieses Wort nicht schon gefunden wurde
      const wordKey = `${crossWord.tiles[0].x},${crossWord.tiles[0].y},${crossDirection}`;
      const existingKeys = words.map(w => `${w.tiles[0].x},${w.tiles[0].y},${w.direction}`);
      if (!existingKeys.includes(wordKey)) {
        words.push(crossWord);
      }
    }
  }

  return words;
}

function findWordAt(
  board: BoardSquare[][],
  startX: number,
  startY: number,
  direction: 'horizontal' | 'vertical'
): WordInfo | null {
  const tiles: PlacedTile[] = [];
  
  // Finde Anfang des Wortes
  let x = startX;
  let y = startY;
  
  if (direction === 'horizontal') {
    while (x > 0 && board[y][x - 1].tile) x--;
  } else {
    while (y > 0 && board[y - 1][x].tile) y--;
  }

  // Sammle alle Tiles des Wortes
  while (
    (direction === 'horizontal' ? x < 15 : y < 15) &&
    board[y][x].tile
  ) {
    tiles.push({
      x,
      y,
      tile: board[y][x].tile!
    });
    
    if (direction === 'horizontal') x++;
    else y++;
  }

  if (tiles.length < 2) return null;

  return {
    word: tiles.map(t => t.tile.letter).join(''),
    tiles,
    direction
  };
}

// Berechnet Punkte für ein Wort
export function calculateWordPoints(
  wordInfo: WordInfo,
  board: BoardSquare[][],
  placedTiles: PlacedTile[]
): number {
  let points = 0;
  let wordMultiplier = 1;
  
  const placedPositions = new Set(placedTiles.map(t => `${t.x},${t.y}`));

  for (const { x, y, tile } of wordInfo.tiles) {
    let tilePoints = tile.points;
    const premium = board[y][x].premium;
    const isNewlyPlaced = placedPositions.has(`${x},${y}`);

    // Premium-Felder nur für neu gelegte Tiles anwenden
    if (isNewlyPlaced && premium) {
      if (premium === 'DL') {
        tilePoints *= 2;
      } else if (premium === 'TL') {
        tilePoints *= 3;
      } else if (premium === 'DW' || premium === 'STAR') {
        wordMultiplier *= 2;
      } else if (premium === 'TW') {
        wordMultiplier *= 3;
      }
    }

    points += tilePoints;
  }

  return points * wordMultiplier;
}

// Berechnet Gesamtpunkte für alle gebildeten Wörter
export function calculateTotalPoints(
  board: BoardSquare[][],
  placedTiles: PlacedTile[]
): { totalPoints: number; words: Array<{ word: string; points: number }> } {
  const allWords = findAllWords(board, placedTiles);
  
  let totalPoints = 0;
  const words: Array<{ word: string; points: number }> = [];

  for (const wordInfo of allWords) {
    const wordPoints = calculateWordPoints(wordInfo, board, placedTiles);
    totalPoints += wordPoints;
    words.push({ word: wordInfo.word, points: wordPoints });
  }

  // Bingo-Bonus: 50 Punkte extra wenn alle 7 Buchstaben gelegt wurden
  if (placedTiles.length === 7) {
    totalPoints += 50;
  }

  return { totalPoints, words };
}
