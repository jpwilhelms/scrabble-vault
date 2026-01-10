import { BoardSquare as BoardSquareType, Tile } from '@/types/scrabble';
import { getPremiumLabel, getPremiumColor } from '@/utils/scrabbleBoard';
import { ScrabbleTile } from './ScrabbleTile';
import { cn } from '@/lib/utils';

interface BoardSquareProps {
  square: BoardSquareType;
  isCurrentTurn?: boolean;
  isDraggedTile?: boolean;
  isLastPlaced?: boolean;
  onTileDragStart?: (tile: Tile, x: number, y: number, position: { x: number; y: number }) => void;
  onTileDragMove?: (position: { x: number; y: number }) => void;
  onTileDragEnd?: (position: { x: number; y: number }) => void;
}

export function BoardSquare({ 
  square, 
  isCurrentTurn = false,
  isDraggedTile = false,
  isLastPlaced = false,
  onTileDragStart,
  onTileDragMove,
  onTileDragEnd,
}: BoardSquareProps) {
  const handleTileDragStart = (pos: { x: number; y: number }) => {
    if (square.tile && isCurrentTurn && onTileDragStart) {
      onTileDragStart(square.tile, square.x, square.y, pos);
    }
  };

  const isCenter = square.x === 7 && square.y === 7;

  return (
    <div
      data-board-x={square.x}
      data-board-y={square.y}
      className={cn(
        "aspect-square border border-border/40 relative",
        "transition-all duration-200",
        !square.tile && getPremiumColor(square.premium),
        square.tile && !isLastPlaced && "bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
        square.tile && isLastPlaced && "bg-gradient-to-br from-scrabble-tile to-scrabble-tileDark",
      )}
    >
      {!square.tile && square.premium && square.premium !== 'STAR' && (
        <div className="absolute inset-0 flex items-center justify-center p-0.5">
          <span className="text-[10px] sm:text-sm leading-tight font-extrabold text-center text-white drop-shadow-sm">
            {getPremiumLabel(square.premium)}
          </span>
        </div>
      )}
      {!square.tile && isCenter && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl sm:text-2xl text-scrabble-doubleWord">★</span>
        </div>
      )}
      {square.tile && (
        <div className="absolute inset-0">
          <ScrabbleTile 
            tile={square.tile} 
            draggable={isCurrentTurn} 
            size="small"
            isDragging={isDraggedTile}
            isHighlighted={isLastPlaced}
            onDragStart={handleTileDragStart}
            onDragMove={onTileDragMove}
            onDragEnd={onTileDragEnd}
          />
        </div>
      )}
    </div>
  );
}
