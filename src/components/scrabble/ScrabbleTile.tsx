import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface ScrabbleTileProps {
  tile: Tile;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
  draggable?: boolean;
  size?: 'normal' | 'small';
}

export function ScrabbleTile({ 
  tile, 
  isDragging = false, 
  onDragStart, 
  onDragEnd,
  className,
  draggable = true,
  size = 'normal',
}: ScrabbleTileProps) {
  const isBlank = tile.letter === ' ';

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!draggable) return;
    if (e.dataTransfer) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
    }
    onDragStart?.();
  }, [draggable, onDragStart]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!draggable) return;
    // Verhindere Scroll während Drag
    e.stopPropagation();
    onDragStart?.();
  }, [draggable, onDragStart]);

  const handleTouchEnd = useCallback(() => {
    if (!draggable) return;
    onDragEnd?.();
  }, [draggable, onDragEnd]);

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "relative aspect-square bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
        "rounded-md shadow-md select-none",
        draggable && "cursor-move",
        "border border-scrabble-tile/20",
        "transition-all duration-200",
        "hover:scale-105 hover:shadow-lg active:scale-95",
        isDragging && "opacity-50 scale-95",
        className
      )}
      style={{
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
        touchAction: draggable ? 'none' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {!isBlank && (
          <span className={cn(
            "font-extrabold text-black",
            size === 'small' ? "text-lg" : "text-2xl"
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
              ? "right-0 text-[10px]"
              : "right-0.5 text-xs"
          )}
          style={{ bottom: size === 'small' ? '-3px' : '-4px' }}
        >
          {tile.points}
        </span>
      )}
    </div>
  );
}
