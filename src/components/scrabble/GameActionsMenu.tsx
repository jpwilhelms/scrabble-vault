import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, SkipForward, Shuffle, Flag } from 'lucide-react';

interface GameActionsMenuProps {
  onPass: () => void;
  onExchange: () => void;
  onForfeit?: () => void;
  canExchange: boolean;
  hasPlacedTiles: boolean;
  isMultiplayer?: boolean;
}

export function GameActionsMenu({ 
  onPass, 
  onExchange, 
  onForfeit,
  canExchange,
  hasPlacedTiles,
  isMultiplayer,
}: GameActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={onPass}
          disabled={hasPlacedTiles}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          Passen
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExchange}
          disabled={!canExchange || hasPlacedTiles}
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Steine tauschen
        </DropdownMenuItem>
        {isMultiplayer && onForfeit && (
          <DropdownMenuItem
            onClick={onForfeit}
            className="text-destructive focus:text-destructive"
          >
            <Flag className="mr-2 h-4 w-4" />
            Aufgeben
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
