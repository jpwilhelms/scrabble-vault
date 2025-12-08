import { Tile } from '@/types/scrabble';
import { cn } from '@/lib/utils';

interface DragOverlayProps {
  tile: Tile | null;
  position: { x: number; y: number } | null;
}

export function DragOverlay({ tile, position }: DragOverlayProps) {
  if (!tile || !position) return null;

  const isBlank = tile.letter === ' ';
  const size = 56;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2, // Zentriert unter dem Finger
        width: size,
        height: size,
      }}
    >
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-scrabble-tileLight to-scrabble-tile",
          "rounded-md shadow-xl",
          "border-2 border-scrabble-tile/40",
          "flex items-center justify-center"
        )}
        style={{
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.4)'
        }}
      >
        {!isBlank && (
          <>
            <span className="font-extrabold text-black text-3xl">
              {tile.letter}
            </span>
            <span className="absolute bottom-0.5 right-1 font-bold text-black/70 text-sm">
              {tile.points}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
