import { useState, useCallback, useEffect, useRef } from 'react';
import { BoardSquare as BoardSquareType, Tile, PlayedWord } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { BoardSquare } from '@/components/scrabble/BoardSquare';
import { PlayerRack } from '@/components/scrabble/PlayerRack';
import { ScoreBoard } from '@/components/scrabble/ScoreBoard';
import { GameControls } from '@/components/scrabble/GameControls';
import { BlankTileDialog } from '@/components/scrabble/BlankTileDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const [board, setBoard] = useState<BoardSquareType[][]>(() => createBoard());
  const [tileBag, setTileBag] = useState<Tile[]>(() => generateTileBag());
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]);
  const [draggedTile, setDraggedTile] = useState<Tile | null>(null);
  const [score, setScore] = useState(0);
  const [lastWord, setLastWord] = useState<string>();
  const [lastPoints, setLastPoints] = useState<number>();
  const [placedTiles, setPlacedTiles] = useState<Array<{ x: number; y: number; tile: Tile }>>([]);
  const [hasFirstMove, setHasFirstMove] = useState(false);
  const [blankTileDialog, setBlankTileDialog] = useState<{ open: boolean; x: number; y: number; tile: Tile } | null>(null);
  const [dragSource, setDragSource] = useState<{ type: 'rack' | 'board'; x?: number; y?: number } | null>(null);
  
  // Touch-Drag State
  const draggedTileRef = useRef<Tile | null>(null);
  const dragSourceRef = useRef<{ type: 'rack' | 'board'; x?: number; y?: number } | null>(null);

  // Initialisiere Spieler-Tiles
  useEffect(() => {
    const initialTiles = drawTiles(tileBag, 7);
    setPlayerTiles(initialTiles);
    setTileBag([...tileBag]);
  }, []);

  // Sync refs mit state für Touch-Events
  useEffect(() => {
    draggedTileRef.current = draggedTile;
    dragSourceRef.current = dragSource;
  }, [draggedTile, dragSource]);

  const handleTileDragStart = useCallback((tile: Tile) => {
    setDraggedTile(tile);
    setDragSource({ type: 'rack' });
  }, []);

  const handleBoardTileDragStart = useCallback((tile: Tile, fromX: number, fromY: number) => {
    setDraggedTile(tile);
    setDragSource({ type: 'board', x: fromX, y: fromY });
  }, []);

  const handleTileDragEnd = useCallback(() => {
    setDraggedTile(null);
    setDragSource(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((x: number, y: number) => {
    const tile = draggedTileRef.current || draggedTile;
    const source = dragSourceRef.current || dragSource;
    
    if (!tile) return;
    if (board[y][x].tile) return;

    // Wenn vom Board gezogen, altes Feld leeren
    if (source?.type === 'board' && source.x !== undefined && source.y !== undefined) {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
        return newBoard;
      });
      setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
    } else {
      // Tile vom Rack entfernen
      setPlayerTiles(prev => prev.filter(t => t.id !== tile.id));
    }

    // Prüfe ob es ein Blanko-Stein ist
    if (tile.letter === ' ') {
      setBlankTileDialog({ open: true, x, y, tile });
      setDraggedTile(null);
      setDragSource(null);
      return;
    }

    // Tile auf dem Board platzieren
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[y][x] = { ...newBoard[y][x], tile };
      return newBoard;
    });

    // Platzierte Tiles tracken
    setPlacedTiles(prev => [...prev, { x, y, tile }]);

    setDraggedTile(null);
    setDragSource(null);
  }, [draggedTile, board, dragSource]);

  const handleDropToRack = useCallback(() => {
    const tile = draggedTileRef.current || draggedTile;
    const source = dragSourceRef.current || dragSource;
    
    if (!tile) return;
    if (source?.type !== 'board') return;

    // Tile vom Board entfernen
    if (source.x !== undefined && source.y !== undefined) {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[source.y!][source.x!] = { ...newBoard[source.y!][source.x!], tile: undefined };
        return newBoard;
      });
      setPlacedTiles(prev => prev.filter(p => !(p.x === source.x && p.y === source.y)));
    }

    // Tile ins Rack legen
    setPlayerTiles(prev => [...prev, tile]);
    setDraggedTile(null);
    setDragSource(null);
  }, [draggedTile, dragSource]);

  const handleBlankTileSelect = useCallback((letter: string) => {
    if (!blankTileDialog) return;

    const { x, y, tile } = blankTileDialog;
    
    // Erstelle neuen Tile mit gewähltem Buchstaben aber 0 Punkten
    const newTile: Tile = {
      ...tile,
      letter,
      points: 0
    };

    // Tile auf dem Board platzieren
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[y][x] = { ...newBoard[y][x], tile: newTile };
      return newBoard;
    });

    // Platzierte Tiles tracken
    setPlacedTiles(prev => [...prev, { x, y, tile: newTile }]);

    setBlankTileDialog(null);
  }, [blankTileDialog]);

  const handleBlankTileCancel = useCallback(() => {
    if (!blankTileDialog) return;

    // Tile zurück ins Rack legen
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

    // Sortiere Tiles nach Position
    const sortedByX = [...tiles].sort((a, b) => a.x - b.x);
    const sortedByY = [...tiles].sort((a, b) => a.y - b.y);

    // Prüfe ob horizontal
    const isHorizontal = sortedByX.every((tile, i, arr) => 
      i === 0 || tile.y === arr[i - 1].y
    );

    // Prüfe ob vertikal
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

    // Erster Zug muss das mittlere Feld (7,7) einschließen
    if (!hasFirstMove) {
      const centerIncluded = placedTiles.some(({ x, y }) => x === 7 && y === 7);
      if (!centerIncluded) {
        toast.error('Der erste Zug muss das mittlere Feld einschließen');
        return;
      }
    }

    const points = calculateWordPoints(placedTiles);
    const newScore = score + points;

    // Speichere in Datenbank
    const playedWord: PlayedWord = {
      word: wordData.word,
      points,
      position_x: placedTiles[0].x,
      position_y: placedTiles[0].y,
      direction: wordData.direction
    };

    const { error } = await supabase
      .from('played_words')
      .insert([playedWord]);
 
    if (error) {
      toast.error('Fehler beim Speichern des Wortes');
      console.error(error);
      return;
    }
 
    setHasFirstMove(true);
    setScore(newScore);
    setLastWord(wordData.word);
    setLastPoints(points);
    setPlacedTiles([]);

    // Neue Tiles ziehen
    const newTiles = drawTiles(tileBag, placedTiles.length);
    setPlayerTiles(prev => [...prev, ...newTiles]);
    setTileBag([...tileBag]);

    toast.success(`"${wordData.word}" gelegt für ${points} Punkte!`);
  }, [placedTiles, calculateWordPoints, extractWord, score, tileBag, hasFirstMove]);

  const handleReset = useCallback(() => {
    // Platzierte Tiles zurück ins Rack
    const tilesToReturn = placedTiles.map(({ tile }) => tile);
    setPlayerTiles(prev => [...prev, ...tilesToReturn]);

    // Board zurücksetzen
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
                    return (
                      <BoardSquare
                        key={`${x}-${y}`}
                        square={square}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        isCurrentTurn={isCurrentTurn}
                        onTileDragStart={handleBoardTileDragStart}
                        onTileDragEnd={handleTileDragEnd}
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
              onTileDragStart={handleTileDragStart}
              onTileDragEnd={handleTileDragEnd}
              onDropToRack={handleDropToRack}
            />
            
            <GameControls
              onConfirm={handleConfirmWord}
              onReset={handleReset}
              canConfirm={placedTiles.length > 0}
            />
          </div>

          {/* Punktestand ganz unten */}
          <div className="mt-auto">
            <ScoreBoard 
              score={score} 
              lastWord={lastWord} 
              lastPoints={lastPoints} 
            />
          </div>
        </div>
      </div>

      <BlankTileDialog
        open={blankTileDialog?.open ?? false}
        onSelect={handleBlankTileSelect}
        onCancel={handleBlankTileCancel}
      />
    </div>
  );
};

export default Index;
