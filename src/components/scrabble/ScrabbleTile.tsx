import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';

interface ScrabbleTileProps {
  tile: Tile;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
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
  const handleDragStart = (e: React.DragEvent) => {
    if (e.dataTransfer) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
    }
    onDragStart?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggable) return;
    const target = e.currentTarget as HTMLDivElement;
    target.style.opacity = '0.5';
    // Erstelle ein DragEvent-ähnliches Objekt für Touch
    const touch = e.touches[0];
    const dragEvent = new DragEvent('dragstart', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    onDragStart?.(dragEvent as any);
  };

  const handleTouchEnd = () => {
    if (!draggable) return;
    onDragEnd?.();
  };

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
        draggable && "cursor-move touch-manipulation",
        "border border-scrabble-tile/20",
        "transition-all duration-200",
        "hover:scale-105 hover:shadow-lg active:scale-95",
        isDragging && "opacity-50 scale-95",
        className
      )}
      style={{
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-extrabold text-black",
          size === 'small' ? "text-lg" : "text-2xl"
        )}>
          {tile.letter}
        </span>
      </div>
      <div className="absolute bottom-0.5 right-1">
        <span className={cn(
          "font-bold text-black/70",
          size === 'small' ? "text-[10px]" : "text-xs"
        )}>
          {tile.points}
        </span>
      </div>
    </div>
  );
}
