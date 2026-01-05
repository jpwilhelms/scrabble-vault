import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';
import { GameActionsMenu } from './GameActionsMenu';

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
    <div className="flex gap-2 sm:gap-3">
      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        size="lg"
        className="flex-1"
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
        Zurück
      </Button>
      <GameActionsMenu
        onPass={onPass}
        onExchange={onExchange}
        onForfeit={onForfeit}
        canExchange={canExchange}
        hasPlacedTiles={hasPlacedTiles}
        isMultiplayer={isMultiplayer}
      />
    </div>
  );
}
