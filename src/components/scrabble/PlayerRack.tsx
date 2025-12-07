import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';
import { useRef, useCallback } from 'react';

interface PlayerRackProps {
  tiles: Tile[];
  onTileDragStart: (tile: Tile) => void;
  onTileDragEnd: () => void;
  onDropToRack?: () => void;
}

export function PlayerRack({ tiles, onTileDragStart, onTileDragEnd, onDropToRack }: PlayerRackProps) {
  const rackRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDropToRack?.();
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!rackRef.current) return;
    
    const touch = e.changedTouches[0];
    const rect = rackRef.current.getBoundingClientRect();
    
    // Prüfe ob Touch innerhalb des Racks endet
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      onDropToRack?.();
    }
  }, [onDropToRack]);

  return (
    <div 
      ref={rackRef}
      className="bg-card rounded-lg shadow-lg p-2 sm:p-4 border-2 border-border"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchEnd={handleTouchEnd}
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
