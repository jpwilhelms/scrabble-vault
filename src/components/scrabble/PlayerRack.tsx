import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';

interface PlayerRackProps {
  tiles: Tile[];
  onTileDragStart: (tile: Tile) => void;
  onTileDragEnd: () => void;
  onDropToRack?: () => void;
}

export function PlayerRack({ tiles, onTileDragStart, onTileDragEnd, onDropToRack }: PlayerRackProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDropToRack?.();
  };

  return (
    <div 
      className="bg-card rounded-lg shadow-lg p-2 sm:p-4 border-2 border-border"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Deine Buchstaben</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
