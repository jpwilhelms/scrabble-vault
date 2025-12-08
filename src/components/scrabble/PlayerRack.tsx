import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';
import { useRef, useCallback } from 'react';

interface PlayerRackProps {
  tiles: Tile[];
  draggedTileId?: string | null;
  onTileDragStart: (tile: Tile, position: { x: number; y: number }) => void;
  onTileDragMove: (position: { x: number; y: number }) => void;
  onTileDragEnd: (position: { x: number; y: number }) => void;
  onReorderTiles?: (fromIndex: number, toIndex: number) => void;
}

export function PlayerRack({ 
  tiles, 
  draggedTileId,
  onTileDragStart, 
  onTileDragMove,
  onTileDragEnd,
  onReorderTiles,
}: PlayerRackProps) {
  const rackRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = useCallback((tile: Tile, index: number, pos: { x: number; y: number }) => {
    onTileDragStart(tile, pos);
  }, [onTileDragStart]);

  return (
    <div 
      ref={rackRef}
      className="bg-card rounded-lg shadow-lg p-2 sm:p-4 border-2 border-border"
      data-drop-target="rack"
    >
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Deine Buchstaben</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {tiles.map((tile, index) => (
          <div
            key={tile.id}
            ref={el => tileRefs.current[index] = el}
            data-rack-index={index}
            className="relative"
          >
            <ScrabbleTile
              tile={tile}
              isDragging={draggedTileId === tile.id}
              onDragStart={(pos) => handleDragStart(tile, index, pos)}
              onDragMove={onTileDragMove}
              onDragEnd={onTileDragEnd}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
