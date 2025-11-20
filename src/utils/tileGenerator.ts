import { Tile, GERMAN_LETTER_DISTRIBUTION } from '@/types/scrabble';

export function generateTileBag(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  Object.entries(GERMAN_LETTER_DISTRIBUTION).forEach(([letter, { count, points }]) => {
    for (let i = 0; i < count; i++) {
      tiles.push({
        letter: letter === ' ' ? '?' : letter,
        points,
        id: `tile-${id++}`,
      });
    }
  });

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

export function drawTiles(bag: Tile[], count: number): Tile[] {
  return bag.splice(0, Math.min(count, bag.length));
}
