import { useState, useCallback, useEffect } from 'react';
import { BoardSquare as BoardSquareType, Tile, PlayedWord } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { BoardSquare } from '@/components/scrabble/BoardSquare';
import { PlayerRack } from '@/components/scrabble/PlayerRack';
import { ScoreBoard } from '@/components/scrabble/ScoreBoard';
import { GameControls } from '@/components/scrabble/GameControls';
import { BlankTileDialog } from '@/components/scrabble/BlankTileDialog';
import { DragOverlay } from '@/components/scrabble/DragOverlay';
import { useTouchDrag } from '@/hooks/useTouchDrag';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const [board, setBoard] = useState<BoardSquareType[][]>(() => createBoard());
  const [tileBag, setTileBag] = useState<Tile[]>(() => generateTileBag());
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [lastWord, setLastWord] = useState<string>();
  const [lastPoints, setLastPoints] = useState<number>();
  const [placedTiles, setPlacedTiles] = useState<Array<{ x: number; y: number; tile: Tile }>>([]);
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
    startDrag(tile, { type: 'board', x, y }, position);
  }, [startDrag]);

  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    updatePosition(position);
  }, [updatePosition]);

  const findDropTarget = useCallback((x: number, y: number): { type: 'board'; x: number; y: number } | { type: 'rack' } | null => {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;

    // Check for board square
    const boardSquare = element.closest('[data-board-x]');
    if (boardSquare) {
      const bx = parseInt(boardSquare.getAttribute('data-board-x') || '0');
      const by = parseInt(boardSquare.getAttribute('data-board-y') || '0');
      return { type: 'board', x: bx, y: by };
    }

    // Check for rack
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

      // Remove from source
      if (source?.type === 'board' && source.x !== undefined && source.y !== undefined) {
        setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
          return newBoard;
        });
        setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
      } else {
        setPlayerTiles(prev => prev.filter(t => t.id !== tile.id));
      }

      // Check for blank tile
      if (tile.letter === ' ') {
        setBlankTileDialog({ open: true, x, y, tile });
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

    } else if (dropTarget?.type === 'rack' && source?.type === 'board') {
      // Return to rack from board
      if (source.x !== undefined && source.y !== undefined) {
        setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
          return newBoard;
        });
        setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
        setPlayerTiles(prev => [...prev, tile]);
      }
    }

    endDrag();
  }, [board, endDrag, findDropTarget, getDragState]);

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

    setPlacedTiles(prev => [...prev, { x, y, tile: newTile }]);
    setBlankTileDialog(null);
  }, [blankTileDialog]);

  const handleBlankTileCancel = useCallback(() => {
    if (!blankTileDialog) return;
    setPlayerTiles(prev => [...prev, blankTileDialog.tile]);
    setBlankTileDialog(null);
  }, [blankTileDialog]);

  const calculateWordPoints = useCallback((tiles: Array<{ x: number; y: number; tile: Tile }>) => {
    let points = 0;
    let wordMultiplier = 1;

    tiles.forEach(({ x, y, tile }) => {
      const premium = board[y][x].premium;
      let tilePoints = tile.points;

      if (premium === 'DL') {
        tilePoints *= 2;
      } else if (premium === 'TL') {
        tilePoints *= 3;
      } else if (premium === 'DW') {
        wordMultiplier *= 2;
      } else if (premium === 'TW' || premium === 'STAR') {
        wordMultiplier *= 3;
      }

      points += tilePoints;
    });

    return points * wordMultiplier;
  }, [board]);

  const extractWord = useCallback((tiles: Array<{ x: number; y: number; tile: Tile }>): { word: string; direction: 'horizontal' | 'vertical' } | null => {
    if (tiles.length === 0) return null;

    const sortedByX = [...tiles].sort((a, b) => a.x - b.x);
    const sortedByY = [...tiles].sort((a, b) => a.y - b.y);

    const isHorizontal = sortedByX.every((tile, i, arr) => 
      i === 0 || tile.y === arr[i - 1].y
    );

    const isVertical = sortedByY.every((tile, i, arr) => 
      i === 0 || tile.x === arr[i - 1].x
    );

    if (!isHorizontal && !isVertical) {
      return null;
    }

    const sorted = isHorizontal ? sortedByX : sortedByY;
    const word = sorted.map(t => t.tile.letter).join('');
    
    return {
      word,
      direction: isHorizontal ? 'horizontal' : 'vertical'
    };
  }, []);

  const handleConfirmWord = useCallback(async () => {
    if (placedTiles.length === 0) {
      toast.error('Bitte platziere zuerst Buchstaben auf dem Brett');
      return;
    }

    const wordData = extractWord(placedTiles);
    if (!wordData) {
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

    const points = calculateWordPoints(placedTiles);
    const newScore = score + points;

    // Speichere in Datenbank (fehlertoleranter)
    const playedWord: PlayedWord = {
      word: wordData.word,
      points,
      position_x: placedTiles[0].x,
      position_y: placedTiles[0].y,
      direction: wordData.direction
    };

    try {
      const { error } = await supabase
        .from('played_words')
        .insert([playedWord]);
   
      if (error) {
        console.error('Datenbankfehler:', error);
        // Spiel trotzdem fortsetzen
      }
    } catch (e) {
      console.error('Netzwerkfehler:', e);
      // Spiel trotzdem fortsetzen
    }
 
    setHasFirstMove(true);
    setScore(newScore);
    setLastWord(wordData.word);
    setLastPoints(points);
    setPlacedTiles([]);

    const newTiles = drawTiles(tileBag, placedTiles.length);
    setPlayerTiles(prev => [...prev, ...newTiles]);
    setTileBag([...tileBag]);

    toast.success(`"${wordData.word}" gelegt für ${points} Punkte!`);
  }, [placedTiles, calculateWordPoints, extractWord, score, tileBag, hasFirstMove]);

  const handleReset = useCallback(() => {
    const tilesToReturn = placedTiles.map(({ tile }) => tile);
    setPlayerTiles(prev => [...prev, ...tilesToReturn]);

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      placedTiles.forEach(({ x, y }) => {
        newBoard[y][x] = { ...newBoard[y][x], tile: undefined };
      });
      return newBoard;
    });

    setPlacedTiles([]);
    toast.info('Buchstaben zurückgesetzt');
  }, [placedTiles]);

  return (
    <div className="h-screen overflow-hidden bg-background p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4 lg:mb-8 text-center">
          Scrabble
        </h1>
        
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 flex-1">
          {/* Spielfeld */}
          <div className="w-full flex-shrink-0">
            <div className="bg-card rounded-lg shadow-2xl p-1 sm:p-2 lg:p-4 border-2 lg:border-4 border-border mx-auto max-w-full">
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

          {/* Rack und Controls */}
          <div className="space-y-2 sm:space-y-3 flex-shrink-0">
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
          </div>

          {/* Punktestand */}
          <div className="mt-auto">
            <ScoreBoard 
              score={score} 
              lastWord={lastWord} 
              lastPoints={lastPoints} 
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
