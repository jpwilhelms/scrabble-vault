import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';
import { useRef, useCallback } from 'react';

interface PlayerRackProps {
  tiles: (Tile | null)[];
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
      className="w-full h-full"
      data-drop-target="rack"
    >
      <div className="grid grid-cols-7 gap-[2%] h-full">
        {Array.from({ length: 7 }).map((_, index) => {
          const tile = tiles[index];
          return (
            <div
              key={tile?.id ?? `empty-${index}`}
              ref={el => tileRefs.current[index] = el}
              data-rack-index={index}
              className="relative aspect-square"
            >
              {tile && (
                <ScrabbleTile
                  tile={tile}
                  isDragging={draggedTileId === tile.id}
                  onDragStart={(pos) => handleDragStart(tile, index, pos)}
                  onDragMove={onTileDragMove}
                  onDragEnd={onTileDragEnd}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
