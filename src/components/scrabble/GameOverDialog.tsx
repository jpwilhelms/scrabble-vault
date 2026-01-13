import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Frown, RotateCcw } from 'lucide-react';

interface GameOverDialogProps {
  open: boolean;
  winner: 'player' | 'opponent' | 'draw';
  playerScore: number;
  opponentScore: number;
  opponentName: string;
  reason: 'tiles' | 'passes' | 'forfeit';
  showRevenge?: boolean;
  onClose: () => void;
  onRevenge?: () => void;
}

export function GameOverDialog({
  open,
  winner,
  playerScore,
  opponentScore,
  opponentName,
  reason,
  showRevenge = false,
  onClose,
  onRevenge,
}: GameOverDialogProps) {
  const isWinner = winner === 'player';
  const isDraw = winner === 'draw';

  const reasonText = {
    tiles: 'Alle Steine wurden gelegt.',
    passes: 'Beide Spieler haben zweimal hintereinander ausgesetzt.',
    forfeit: 'Aufgabe.',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isDraw ? (
              'Unentschieden!'
            ) : isWinner ? (
              <>
                <Trophy className="w-6 h-6 text-yellow-500" />
                Gewonnen!
              </>
            ) : (
              <>
                <Frown className="w-6 h-6 text-muted-foreground" />
                Verloren
              </>
            )}
          </DialogTitle>
          <DialogDescription>{reasonText[reason]}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className={`text-center p-4 rounded-lg ${isWinner ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
            <div className="text-sm text-muted-foreground">Du</div>
            <div className="text-3xl font-bold text-primary">{playerScore}</div>
          </div>
          <div className={`text-center p-4 rounded-lg ${!isWinner && !isDraw ? 'bg-destructive/10 border border-destructive' : 'bg-muted'}`}>
            <div className="text-sm text-muted-foreground">{opponentName}</div>
            <div className="text-3xl font-bold text-destructive">{opponentScore}</div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {showRevenge && onRevenge && (
            <Button onClick={onRevenge} variant="default" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Revanche
            </Button>
          )}
          <Button onClick={onClose} variant={showRevenge ? "outline" : "default"} className="w-full">
            Zurück zur Lobby
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
