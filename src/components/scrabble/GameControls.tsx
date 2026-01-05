import { Button } from '@/components/ui/button';
import { RotateCcw, Check, SkipForward, Shuffle, Flag } from 'lucide-react';

interface GameControlsProps {
  onConfirm: () => void;
  onReset: () => void;
  onPass: () => void;
  onExchange: () => void;
  onForfeit?: () => void;
  canConfirm: boolean;
  canExchange: boolean;
  hasPlacedTiles: boolean;
  isMultiplayer?: boolean;
}

export function GameControls({ 
  onConfirm, 
  onReset, 
  onPass, 
  onExchange, 
  onForfeit,
  canConfirm, 
  canExchange,
  hasPlacedTiles,
  isMultiplayer,
}: GameControlsProps) {
  return (
    <div className="flex gap-2 sm:gap-3 flex-wrap">
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        size="lg"
        className="flex-1 min-w-[120px]"
      >
        <Check className="mr-2 h-5 w-5" />
        Wort legen
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        disabled={!hasPlacedTiles}
      >
        <RotateCcw className="mr-2 h-5 w-5" />
        Zurücksetzen
      </Button>
      <Button
        onClick={onPass}
        variant="secondary"
        size="lg"
        disabled={hasPlacedTiles}
      >
        <SkipForward className="mr-2 h-5 w-5" />
        Passen
      </Button>
      <Button
        onClick={onExchange}
        variant="secondary"
        size="lg"
        disabled={!canExchange || hasPlacedTiles}
      >
        <Shuffle className="mr-2 h-5 w-5" />
        Tauschen
      </Button>
      {isMultiplayer && onForfeit && (
        <Button
          onClick={onForfeit}
          variant="destructive"
          size="lg"
        >
          <Flag className="mr-2 h-5 w-5" />
          Aufgeben
        </Button>
      )}
    </div>
  );
}
