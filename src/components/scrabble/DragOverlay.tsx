import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';

interface DragOverlayProps {
  tile: Tile | null;
  position: { x: number; y: number } | null;
}

export function DragOverlay({ tile, position }: DragOverlayProps) {
  if (!tile || !position) return null;

  const isBlank = tile.letter === ' ';

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x - 20,
        top: position.y - 20,
        width: 40,
        height: 40,
      }}
    >
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
          "rounded-md shadow-xl",
          "border border-scrabble-tile/20",
          "flex items-center justify-center",
          "opacity-90 scale-110"
        )}
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
      >
        {!isBlank && (
          <span className="font-extrabold text-black text-lg">
            {tile.letter}
          </span>
        )}
      </div>
    </div>
  );
}
