import { BoardSquare as BoardSquareType } from '@/types/scrabble';
import { getPremiumLabel, getPremiumColor } from '@/utils/scrabbleBoard';
import { ScrabbleTile } from './ScrabbleTile';
import { cn } from '@/lib/utils';

interface BoardSquareProps {
  square: BoardSquareType;
  onDrop: (x: number, y: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
}

export function BoardSquare({ square, onDrop, onDragOver, isDropTarget }: BoardSquareProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(square.x, square.y);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={onDragOver}
      className={cn(
        "aspect-square border border-border/40 relative",
        "transition-all duration-200",
        !square.tile && getPremiumColor(square.premium),
        isDropTarget && "ring-2 ring-accent ring-offset-2"
      )}
    >
      {!square.tile && square.premium && (
        <div className="absolute inset-0 flex items-center justify-center p-0.5">
          <span className="text-[8px] leading-tight font-bold text-center whitespace-pre-line text-primary-foreground/70">
            {getPremiumLabel(square.premium)}
          </span>
        </div>
      )}
      {square.tile && (
        <div className="absolute inset-0 flex items-center justify-center p-0.5">
          <ScrabbleTile tile={square.tile} draggable={false} />
        </div>
      )}
    </div>
  );
}
