import { useState, useCallback, useEffect } from 'react';
import { BoardSquare as BoardSquareType, Tile, PlayedWord } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { BoardSquare } from '@/components/scrabble/BoardSquare';
import { PlayerRack } from '@/components/scrabble/PlayerRack';
import { ScoreBoard } from '@/components/scrabble/ScoreBoard';
import { GameControls } from '@/components/scrabble/GameControls';
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

  // Initialisiere Spieler-Tiles
  useEffect(() => {
    const initialTiles = drawTiles(tileBag, 7);
    setPlayerTiles(initialTiles);
    setTileBag([...tileBag]);
  }, []);

  const handleTileDragStart = useCallback((tile: Tile) => {
    setDraggedTile(tile);
  }, []);

  const handleTileDragEnd = useCallback(() => {
    setDraggedTile(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((x: number, y: number) => {
    if (!draggedTile) return;
    if (board[y][x].tile) return;

    // Tile vom Rack entfernen
    setPlayerTiles(prev => prev.filter(t => t.id !== draggedTile.id));

    // Tile auf dem Board platzieren
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[y][x] = { ...newBoard[y][x], tile: draggedTile };
      return newBoard;
    });

    // Platzierte Tiles tracken
    setPlacedTiles(prev => [...prev, { x, y, tile: draggedTile }]);

    setDraggedTile(null);
  }, [draggedTile, board]);

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
                  row.map((square, x) => (
                    <BoardSquare
                      key={`${x}-${y}`}
                      square={square}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    />
                  ))
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
    </div>
  );
};

export default Index;
