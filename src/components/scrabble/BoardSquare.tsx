import { BoardSquare as BoardSquareType, Tile } from '@/types/scrabble';
import { getPremiumLabel, getPremiumColor } from '@/utils/scrabbleBoard';
import { ScrabbleTile } from './ScrabbleTile';
import { cn } from '@/lib/utils';
import { useRef, useCallback } from 'react';

interface BoardSquareProps {
  square: BoardSquareType;
  onDrop: (x: number, y: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
  isCurrentTurn?: boolean;
  onTileDragStart?: (tile: Tile, fromX: number, fromY: number) => void;
  onTileDragEnd?: () => void;
}

export function BoardSquare({ 
  square, 
  onDrop, 
  onDragOver, 
  isDropTarget,
  isCurrentTurn = false,
  onTileDragStart,
  onTileDragEnd
}: BoardSquareProps) {
  const squareRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(square.x, square.y);
  };

  const handleTileDragStart = () => {
    if (square.tile && isCurrentTurn && onTileDragStart) {
      onTileDragStart(square.tile, square.x, square.y);
    }
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!squareRef.current) return;
    
    const touch = e.changedTouches[0];
    const rect = squareRef.current.getBoundingClientRect();
    
    // Prüfe ob Touch innerhalb dieses Feldes endet
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      onDrop(square.x, square.y);
    }
  }, [onDrop, square.x, square.y]);

  return (
    <div
      ref={squareRef}
      onDrop={handleDrop}
      onDragOver={onDragOver}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "aspect-square border border-border/40 relative",
        "transition-all duration-200",
        !square.tile && getPremiumColor(square.premium),
        square.tile && "bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
        isDropTarget && "ring-2 ring-accent ring-offset-2"
      )}
    >
      {!square.tile && square.premium && square.premium !== 'STAR' && (
        <div className="absolute inset-0 flex items-center justify-center p-0.5">
          <span className="text-xs leading-tight font-extrabold text-center text-white">
            {getPremiumLabel(square.premium)}
          </span>
        </div>
      )}
      {square.tile && (
        <div className="absolute inset-0">
          <ScrabbleTile 
            tile={square.tile} 
            draggable={isCurrentTurn} 
            size="small"
            onDragStart={handleTileDragStart}
            onDragEnd={onTileDragEnd}
          />
        </div>
      )}
    </div>
  );
}
