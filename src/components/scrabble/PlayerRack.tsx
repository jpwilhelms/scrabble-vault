import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';

interface PlayerRackProps {
  tiles: Tile[];
  onTileDragStart: (tile: Tile) => void;
  onTileDragEnd: () => void;
}

export function PlayerRack({ tiles, onTileDragStart, onTileDragEnd }: PlayerRackProps) {
  return (
    <div className="bg-card rounded-lg shadow-lg p-4 border-2 border-border">
      <h3 className="text-sm font-semibold text-foreground mb-2">Deine Buchstaben</h3>
      <div className="flex gap-2 justify-center">
        {tiles.map((tile) => (
          <ScrabbleTile
            key={tile.id}
            tile={tile}
            onDragStart={() => onTileDragStart(tile)}
            onDragEnd={onTileDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
