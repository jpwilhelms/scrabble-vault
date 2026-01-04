import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tile } from '@/types/scrabble';
import { ScrabbleTile } from './ScrabbleTile';
import { cn } from '@/lib/utils';

interface ExchangeTilesDialogProps {
  open: boolean;
  tiles: (Tile | null)[];
  tilesInBag: number;
  onExchange: (tileIds: string[]) => void;
  onCancel: () => void;
}

export function ExchangeTilesDialog({
  open,
  tiles,
  tilesInBag,
  onExchange,
  onCancel,
}: ExchangeTilesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleTile = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExchange = () => {
    onExchange(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleCancel = () => {
    setSelectedIds(new Set());
    onCancel();
  };

  const canExchange = selectedIds.size > 0 && selectedIds.size <= tilesInBag;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Steine tauschen</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Wähle die Steine aus, die du tauschen möchtest. 
            ({tilesInBag} Steine im Beutel)
          </p>
          
          <div className="grid grid-cols-7 gap-2">
            {tiles.map((tile, index) => (
              <div
                key={tile?.id ?? `empty-${index}`}
                className="relative aspect-square"
              >
                {tile && (
                  <div
                    onClick={() => toggleTile(tile.id)}
                    className={cn(
                      "cursor-pointer rounded-md transition-all",
                      selectedIds.has(tile.id) && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <ScrabbleTile
                      tile={tile}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleExchange} 
            disabled={!canExchange}
          >
            {selectedIds.size} Stein{selectedIds.size !== 1 ? 'e' : ''} tauschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
