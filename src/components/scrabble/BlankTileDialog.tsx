import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BlankTileDialogProps {
  open: boolean;
  onSelect: (letter: string) => void;
  onCancel: () => void;
}

const GERMAN_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'Ä', 'Ö', 'Ü'
];

export function BlankTileDialog({ open, onSelect, onCancel }: BlankTileDialogProps) {
  const handleSelect = (letter: string) => {
    onSelect(letter);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Blanko-Stein: Buchstabe wählen</DialogTitle>
          <DialogDescription>
            Tippe auf den Buchstaben, den dieser Blanko-Stein repräsentieren soll (0 Punkte).
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-7 gap-2 py-4">
          {GERMAN_LETTERS.map((letter) => (
            <Button
              key={letter}
              variant="outline"
              className="aspect-square p-0 text-lg font-bold"
              onClick={() => handleSelect(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
