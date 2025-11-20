import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';

interface ScrabbleTileProps {
  tile: Tile;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  className?: string;
}

export function ScrabbleTile({ 
  tile, 
  isDragging = false, 
  onDragStart, 
  onDragEnd,
  className 
}: ScrabbleTileProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative w-12 h-12 bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
        "rounded-sm shadow-lg cursor-move select-none",
        "border-2 border-scrabble-tile/30",
        "transition-all duration-200",
        "hover:scale-105 hover:shadow-xl",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary-foreground">
          {tile.letter}
        </span>
      </div>
      <div className="absolute bottom-0.5 right-1">
        <span className="text-xs font-semibold text-primary-foreground/80">
          {tile.points}
        </span>
      </div>
    </div>
  );
}
