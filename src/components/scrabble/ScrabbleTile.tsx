import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface ScrabbleTileProps {
  tile: Tile;
  isDragging?: boolean;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDragMove?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  className?: string;
  draggable?: boolean;
  size?: 'normal' | 'small';
}

export function ScrabbleTile({ 
  tile, 
  isDragging = false, 
  onDragStart,
  onDragMove,
  onDragEnd,
  className,
  draggable = true,
  size = 'normal',
}: ScrabbleTileProps) {
  const isBlank = tile.letter === ' ';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    onDragStart?.({ x: touch.clientX, y: touch.clientY });
  }, [draggable, onDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggable) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    onDragMove?.({ x: touch.clientX, y: touch.clientY });
  }, [draggable, onDragMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!draggable) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    onDragEnd?.({ x: touch.clientX, y: touch.clientY });
  }, [draggable, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    onDragStart?.({ x: e.clientX, y: e.clientY });
  }, [draggable, onDragStart]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={cn(
        "relative aspect-square bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
        "rounded-md shadow-md select-none",
        draggable && "cursor-move",
        "border border-scrabble-tile/20",
        "transition-all duration-200",
        isDragging && "opacity-30 scale-95",
        className
      )}
      style={{
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {!isBlank && (
          <span className={cn(
            "font-extrabold text-black",
            size === 'small' ? "text-sm" : "text-2xl"
          )}>
            {tile.letter}
          </span>
        )}
      </div>

      {!isBlank && (
        <span 
          className={cn(
            "absolute font-bold text-black/70",
            size === 'small'
              ? "right-0 bottom-0 text-[7px]"
              : "right-0.5 bottom-0 text-xs"
          )}
        >
          {tile.points}
        </span>
      )}
    </div>
  );
}
