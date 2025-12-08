import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';

interface GameControlsProps {
  onConfirm: () => void;
  onReset: () => void;
  canConfirm: boolean;
}

export function GameControls({ onConfirm, onReset, canConfirm }: GameControlsProps) {
  const handleReset = () => {
    // Direkt zurücksetzen ohne Toast
    onReset();
  };

  return (
    <div className="flex gap-2 sm:gap-4">
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
        onClick={handleReset}
        variant="outline"
        size="lg"
      >
        <RotateCcw className="mr-2 h-5 w-5" />
        Zurücksetzen
      </Button>
    </div>
  );
}
