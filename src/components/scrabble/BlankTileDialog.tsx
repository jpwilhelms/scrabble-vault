import { useState } from 'react';
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
  const [selectedLetter, setSelectedLetter] = useState<string>('');

  const handleConfirm = () => {
    if (selectedLetter) {
      onSelect(selectedLetter);
      setSelectedLetter('');
    }
  };

  const handleCancel = () => {
    setSelectedLetter('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Blanko-Stein: Buchstabe wählen</DialogTitle>
          <DialogDescription>
            Wähle den Buchstaben, den dieser Blanko-Stein repräsentieren soll (0 Punkte).
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-7 gap-2 py-4">
          {GERMAN_LETTERS.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'default' : 'outline'}
              className="aspect-square p-0 text-lg font-bold"
              onClick={() => setSelectedLetter(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLetter}>
            Bestätigen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
