import { useState, useCallback, useEffect } from 'react';
import { BoardSquare as BoardSquareType, Tile, PlayedWord } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { calculateTotalPoints } from '@/utils/wordScoring';
import { BoardSquare } from '@/components/scrabble/BoardSquare';
import { PlayerRack } from '@/components/scrabble/PlayerRack';
import { ScoreBoard } from '@/components/scrabble/ScoreBoard';
import { GameControls } from '@/components/scrabble/GameControls';
import { BlankTileDialog } from '@/components/scrabble/BlankTileDialog';
import { DragOverlay } from '@/components/scrabble/DragOverlay';
import { useTouchDrag } from '@/hooks/useTouchDrag';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WordScore {
  word: string;
  points: number;
}

const Index = () => {
  const [board, setBoard] = useState<BoardSquareType[][]>(() => createBoard());
  const [tileBag, setTileBag] = useState<Tile[]>(() => generateTileBag());
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [lastWords, setLastWords] = useState<WordScore[]>([]);
  const [lastBingo, setLastBingo] = useState(false);
  const [placedTiles, setPlacedTiles] = useState<Array<{ x: number; y: number; tile: Tile; originalBlank?: boolean }>>([]);
  const [hasFirstMove, setHasFirstMove] = useState(false);
  const [blankTileDialog, setBlankTileDialog] = useState<{ open: boolean; x: number; y: number; tile: Tile } | null>(null);

  const { dragState, startDrag, updatePosition, endDrag, getDragState } = useTouchDrag();

  // Initialisiere Spieler-Tiles
  useEffect(() => {
    const initialTiles = drawTiles(tileBag, 7);
    setPlayerTiles(initialTiles);
    setTileBag([...tileBag]);
  }, []);

  // Global mouse move/up handlers for desktop drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = getDragState();
      if (state.tile) {
        updatePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const state = getDragState();
      if (state.tile) {
        handleDragEnd({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getDragState, updatePosition]);

  const handleRackTileDragStart = useCallback((tile: Tile, position: { x: number; y: number }) => {
    startDrag(tile, { type: 'rack' }, position);
  }, [startDrag]);

  const handleBoardTileDragStart = useCallback((tile: Tile, x: number, y: number, position: { x: number; y: number }) => {
    // Prüfe ob es ein Blanko-Stein ist der erneut bewegt wird
    const placedInfo = placedTiles.find(p => p.x === x && p.y === y);
    const isOriginalBlank = placedInfo?.originalBlank || tile.points === 0;
    
    startDrag(
      isOriginalBlank ? { ...tile, letter: ' ', points: 0 } : tile, 
      { type: 'board', x, y }, 
      position
    );
  }, [startDrag, placedTiles]);

  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    updatePosition(position);
  }, [updatePosition]);

  const findDropTarget = useCallback((x: number, y: number): { type: 'board'; x: number; y: number } | { type: 'rack'; index?: number } | null => {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;

    // Check for board square
    const boardSquare = element.closest('[data-board-x]');
    if (boardSquare) {
      const bx = parseInt(boardSquare.getAttribute('data-board-x') || '0');
      const by = parseInt(boardSquare.getAttribute('data-board-y') || '0');
      return { type: 'board', x: bx, y: by };
    }

    // Check for rack slot
    const rackSlot = element.closest('[data-rack-index]');
    if (rackSlot) {
      const index = parseInt(rackSlot.getAttribute('data-rack-index') || '0');
      return { type: 'rack', index };
    }

    // Check for rack container
    const rack = element.closest('[data-drop-target="rack"]');
    if (rack) {
      return { type: 'rack' };
    }

    return null;
  }, []);

  const handleDragEnd = useCallback((position: { x: number; y: number }) => {
    const state = getDragState();
    const tile = state.tile;
    const source = state.source;

    if (!tile) {
      endDrag();
      return;
    }

    const dropTarget = findDropTarget(position.x, position.y);

    if (dropTarget?.type === 'board') {
      const { x, y } = dropTarget;
      
      // Check if target is empty
      if (board[y][x].tile) {
        endDrag();
        return;
      }

      // Check if this is an original blank tile being moved
      const isOriginalBlank = source?.type === 'board' && 
        placedTiles.find(p => p.x === source.x && p.y === source.y)?.originalBlank;

      // Remove from source
      if (source?.type === 'board' && source.x !== undefined && source.y !== undefined) {
        setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
          return newBoard;
        });
        setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
      } else {
        // Remove from rack but keep position by replacing with null marker
        setPlayerTiles(prev => {
          const index = prev.findIndex(t => t.id === tile.id);
          if (index === -1) return prev;
          const newTiles = [...prev];
          newTiles.splice(index, 1);
          return newTiles;
        });
      }

      // Check for blank tile - always show dialog for blanks (original or current)
      if (tile.letter === ' ' || isOriginalBlank) {
        setBlankTileDialog({ open: true, x, y, tile: { ...tile, letter: ' ', points: 0 } });
        endDrag();
        return;
      }

      // Place tile
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[y][x] = { ...newBoard[y][x], tile };
        return newBoard;
      });
      setPlacedTiles(prev => [...prev, { x, y, tile }]);

    } else if (dropTarget?.type === 'rack') {
      if (source?.type === 'board' && source.x !== undefined && source.y !== undefined) {
        // Return to rack from board
        const placedInfo = placedTiles.find(p => p.x === source.x && p.y === source.y);
        const originalTile = placedInfo?.originalBlank ? { ...tile, letter: ' ', points: 0 } : tile;
        
        setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
          return newBoard;
        });
        setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
        
        if (dropTarget.index !== undefined) {
          // Insert at specific position
          setPlayerTiles(prev => {
            const newTiles = prev.filter(t => t.id !== originalTile.id);
            newTiles.splice(dropTarget.index!, 0, originalTile);
            return newTiles;
          });
        } else {
          setPlayerTiles(prev => [...prev, originalTile]);
        }
      } else if (source?.type === 'rack' && dropTarget.index !== undefined) {
        // Reorder within rack
        setPlayerTiles(prev => {
          const currentIndex = prev.findIndex(t => t.id === tile.id);
          if (currentIndex === -1) return prev;
          
          const newTiles = [...prev];
          newTiles.splice(currentIndex, 1);
          newTiles.splice(dropTarget.index!, 0, tile);
          return newTiles;
        });
      }
    }

    endDrag();
  }, [board, endDrag, findDropTarget, getDragState, placedTiles]);

  const handleBlankTileSelect = useCallback((letter: string) => {
    if (!blankTileDialog) return;

    const { x, y, tile } = blankTileDialog;
    
    const newTile: Tile = {
      ...tile,
      letter,
      points: 0
    };

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[y][x] = { ...newBoard[y][x], tile: newTile };
      return newBoard;
    });

    setPlacedTiles(prev => [...prev, { x, y, tile: newTile, originalBlank: true }]);
    setBlankTileDialog(null);
  }, [blankTileDialog]);

  const handleBlankTileCancel = useCallback(() => {
    if (!blankTileDialog) return;
    setPlayerTiles(prev => [...prev, blankTileDialog.tile]);
    setBlankTileDialog(null);
  }, [blankTileDialog]);

  const extractWordDirection = useCallback((tiles: Array<{ x: number; y: number; tile: Tile }>): 'horizontal' | 'vertical' | null => {
    if (tiles.length === 0) return null;
    if (tiles.length === 1) return 'horizontal';

    const sortedByX = [...tiles].sort((a, b) => a.x - b.x);
    const sortedByY = [...tiles].sort((a, b) => a.y - b.y);

    const isHorizontal = sortedByX.every((tile, i, arr) => 
      i === 0 || tile.y === arr[i - 1].y
    );

    if (isHorizontal) return 'horizontal';
    
    const isVertical = sortedByY.every((tile, i, arr) => 
      i === 0 || tile.x === arr[i - 1].x
    );

    return isVertical ? 'vertical' : null;
  }, []);

  const handleConfirmWord = useCallback(async () => {
    if (placedTiles.length === 0) {
      toast.error('Bitte platziere zuerst Buchstaben auf dem Brett');
      return;
    }

    const direction = extractWordDirection(placedTiles);
    if (!direction) {
      toast.error('Die Buchstaben müssen in einer Reihe liegen');
      return;
    }

    if (!hasFirstMove) {
      const centerIncluded = placedTiles.some(({ x, y }) => x === 7 && y === 7);
      if (!centerIncluded) {
        toast.error('Der erste Zug muss das mittlere Feld einschließen');
        return;
      }
    }

    // Berechne alle Wörter und Punkte
    const { totalPoints, words } = calculateTotalPoints(board, placedTiles);
    const isBingo = placedTiles.length === 7;
    const newScore = score + totalPoints;

    // Speichere in Datenbank
    for (const word of words) {
      const playedWord: PlayedWord = {
        word: word.word,
        points: word.points,
        position_x: placedTiles[0].x,
        position_y: placedTiles[0].y,
        direction
      };

      try {
        const { error } = await supabase
          .from('played_words')
          .insert([playedWord]);
     
        if (error) {
          console.error('Datenbankfehler:', error);
        }
      } catch (e) {
        console.error('Netzwerkfehler:', e);
      }
    }
 
    setHasFirstMove(true);
    setScore(newScore);
    setLastWords(words);
    setLastBingo(isBingo);
    setPlacedTiles([]);

    const newTiles = drawTiles(tileBag, placedTiles.length);
    setPlayerTiles(prev => [...prev, ...newTiles]);
    setTileBag([...tileBag]);

    const wordList = words.map(w => w.word).join(', ');
    const bonusText = isBingo ? ' (+50 Bingo!)' : '';
    toast.success(`${wordList} für ${totalPoints} Punkte${bonusText}`);
  }, [placedTiles, extractWordDirection, score, tileBag, hasFirstMove, board]);

  const handleReset = useCallback(() => {
    // Blanko-Steine zurück als leere Steine
    const tilesToReturn = placedTiles.map(({ tile, originalBlank }) => 
      originalBlank ? { ...tile, letter: ' ', points: 0 } : tile
    );
    setPlayerTiles(prev => [...prev, ...tilesToReturn]);

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      placedTiles.forEach(({ x, y }) => {
        newBoard[y][x] = { ...newBoard[y][x], tile: undefined };
      });
      return newBoard;
    });

    setPlacedTiles([]);
    // Kein Toast - direkt zurücksetzen
  }, [placedTiles]);

  return (
    <div className="h-screen overflow-hidden bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 text-center">
          Scrabble
        </h1>
        
        <div className="flex flex-col gap-2 sm:gap-3 flex-1">
          {/* Spielfeld */}
          <div className="w-full flex-shrink-0">
            <div className="bg-card rounded-lg shadow-2xl p-1 sm:p-2 border-2 border-border mx-auto max-w-full">
              <div className="grid grid-cols-15 gap-0 w-full">
                {board.map((row, y) =>
                  row.map((square, x) => {
                    const isCurrentTurn = placedTiles.some(p => p.x === x && p.y === y);
                    const isDraggedTile = dragState.source?.type === 'board' && 
                      dragState.source.x === x && dragState.source.y === y;
                    return (
                      <BoardSquare
                        key={`${x}-${y}`}
                        square={square}
                        isCurrentTurn={isCurrentTurn}
                        isDraggedTile={isDraggedTile}
                        onTileDragStart={handleBoardTileDragStart}
                        onTileDragMove={handleDragMove}
                        onTileDragEnd={handleDragEnd}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Rack, Controls und Score */}
          <div className="space-y-2 flex-shrink-0">
            <PlayerRack
              tiles={playerTiles}
              draggedTileId={dragState.source?.type === 'rack' ? dragState.tile?.id : null}
              onTileDragStart={handleRackTileDragStart}
              onTileDragMove={handleDragMove}
              onTileDragEnd={handleDragEnd}
            />
            
            <GameControls
              onConfirm={handleConfirmWord}
              onReset={handleReset}
              canConfirm={placedTiles.length > 0}
            />

            <ScoreBoard 
              score={score} 
              lastWords={lastWords.length > 0 ? lastWords : undefined}
              bingoBonus={lastBingo}
              tilesRemaining={tileBag.length}
            />
          </div>
        </div>
      </div>

      <DragOverlay tile={dragState.tile} position={dragState.position} />

      <BlankTileDialog
        open={blankTileDialog?.open ?? false}
        onSelect={handleBlankTileSelect}
        onCancel={handleBlankTileCancel}
      />
    </div>
  );
};

export default Index;
