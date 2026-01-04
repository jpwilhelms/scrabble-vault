import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BoardSquare as BoardSquareType, Tile, PlayedWord } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { calculateTotalPoints } from '@/utils/wordScoring';
import { BoardSquare } from '@/components/scrabble/BoardSquare';
import { PlayerRack } from '@/components/scrabble/PlayerRack';
import { ScoreBoard } from '@/components/scrabble/ScoreBoard';
import { GameControls } from '@/components/scrabble/GameControls';
import { BlankTileDialog } from '@/components/scrabble/BlankTileDialog';
import { ExchangeTilesDialog } from '@/components/scrabble/ExchangeTilesDialog';
import { DragOverlay } from '@/components/scrabble/DragOverlay';
import { useTouchDrag } from '@/hooks/useTouchDrag';
import { useAuth } from '@/hooks/useAuth';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, ArrowLeft, Loader2 } from 'lucide-react';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';

interface WordScore {
  word: string;
  points: number;
}

type GameMode = 'lobby' | 'solo' | 'multiplayer';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [gameMode, setGameMode] = useState<GameMode>('lobby');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  
  const [board, setBoard] = useState<BoardSquareType[][]>(() => createBoard());
  const [tileBag, setTileBag] = useState<Tile[]>(() => generateTileBag());
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>(() => Array(7).fill(null));
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('Gegner');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [lastWords, setLastWords] = useState<WordScore[]>([]);
  const [lastBingo, setLastBingo] = useState(false);
  const [placedTiles, setPlacedTiles] = useState<Array<{ x: number; y: number; tile: Tile; originalBlank?: boolean }>>([]);
  const [hasFirstMove, setHasFirstMove] = useState(false);
  const [blankTileDialog, setBlankTileDialog] = useState<{ open: boolean; x: number; y: number; tile: Tile } | null>(null);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);

  const { dragState, startDrag, updatePosition, endDrag, getDragState } = useTouchDrag();

  // Game persistence hook for multiplayer
  const { gameState, loading: gameLoading, saveGame } = useGamePersistence({
    gameId: currentGameId,
    userId: user?.id ?? null,
    enabled: gameMode === 'multiplayer'
  });

  // Sync local state with loaded game state
  useEffect(() => {
    if (gameState && gameMode === 'multiplayer') {
      setBoard(gameState.board);
      setTileBag(gameState.tileBag);
      setPlayerTiles(gameState.playerTiles);
      setScore(gameState.playerScore);
      setOpponentScore(gameState.opponentScore);
      setOpponentName(gameState.opponentName);
      setIsMyTurn(gameState.isMyTurn);
      setHasFirstMove(gameState.hasFirstMove);
      setPlacedTiles([]);
    }
  }, [gameState, gameMode]);

  // Initialisiere Spieler-Tiles für Solo-Spiel
  useEffect(() => {
    if (gameMode === 'solo') {
      const bagCopy = [...tileBag];
      const initialTiles = drawTiles(bagCopy, 7);
      const rack: (Tile | null)[] = Array(7).fill(null);
      for (let i = 0; i < initialTiles.length; i++) {
        rack[i] = initialTiles[i];
      }
      setPlayerTiles(rack);
      setTileBag(bagCopy);
      setIsMyTurn(true);
    }
  }, [gameMode]);

  const handleStartSoloGame = useCallback(() => {
    setBoard(createBoard());
    setTileBag(generateTileBag());
    setPlayerTiles(Array(7).fill(null));
    setScore(0);
    setOpponentScore(0);
    setLastWords([]);
    setLastBingo(false);
    setPlacedTiles([]);
    setHasFirstMove(false);
    setIsMyTurn(true);
    setGameMode('solo');
  }, []);

  const handleSelectGame = useCallback((gameId: string) => {
    setCurrentGameId(gameId);
    setGameMode('multiplayer');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setGameMode('lobby');
    setCurrentGameId(null);
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
      
      // Check if target is empty - prevent placing on occupied squares
      if (board[y][x].tile) {
        toast.error('Dieses Feld ist bereits belegt');
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
        // Remove from rack but keep position by setting slot to null
        setPlayerTiles(prev => {
          const newTiles = [...prev];
          const index = newTiles.findIndex(t => t?.id === tile.id);
          if (index !== -1) {
            newTiles[index] = null;
          }
          return newTiles;
        });
      }

      // Check for blank tile - always show dialog for blanks (original oder aktueller)
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
          // Place at specific rack slot if possible, otherwise first empty slot
          setPlayerTiles(prev => {
            const newTiles = [...prev];
            const targetIndex = dropTarget.index!;
            if (!newTiles[targetIndex]) {
              newTiles[targetIndex] = originalTile;
            } else {
              const emptyIndex = newTiles.findIndex(t => t === null);
              if (emptyIndex !== -1) {
                newTiles[emptyIndex] = originalTile;
              } else {
                newTiles[targetIndex] = originalTile;
              }
            }
            return newTiles;
          });
        } else {
          // Drop anywhere on rack: use first empty slot
          setPlayerTiles(prev => {
            const newTiles = [...prev];
            const emptyIndex = newTiles.findIndex(t => t === null);
            if (emptyIndex !== -1) {
              newTiles[emptyIndex] = originalTile;
            }
            return newTiles;
          });
        }
      } else if (source?.type === 'rack' && dropTarget.index !== undefined) {
        // Reorder within rack (shift tiles to make space, preserve relative order)
        setPlayerTiles(prev => {
          const currentIndex = prev.findIndex(t => t?.id === tile.id);
          const targetIndex = dropTarget.index!;
          if (currentIndex === -1 || currentIndex === targetIndex) return prev;

          const newTiles = [...prev];
          const [movingTile] = newTiles.splice(currentIndex, 1);
          newTiles.splice(targetIndex, 0, movingTile);
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
    setPlayerTiles(prev => {
      const newTiles = [...prev];
      const emptyIndex = newTiles.findIndex(t => t === null);
      if (emptyIndex !== -1) {
        newTiles[emptyIndex] = blankTileDialog.tile;
      }
      return newTiles;
    });
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

    // In multiplayer, check if it's my turn
    if (gameMode === 'multiplayer' && !isMyTurn) {
      toast.error('Du bist nicht am Zug!');
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
    } else {
      // Validate that placed tiles connect to existing words
      const isConnected = placedTiles.some(({ x, y }) => {
        // Check all 4 neighbors for existing tiles (not newly placed)
        const neighbors = [
          { nx: x - 1, ny: y },
          { nx: x + 1, ny: y },
          { nx: x, ny: y - 1 },
          { nx: x, ny: y + 1 },
        ];
        return neighbors.some(({ nx, ny }) => {
          if (nx < 0 || nx > 14 || ny < 0 || ny > 14) return false;
          const neighborTile = board[ny][nx].tile;
          if (!neighborTile) return false;
          // Check if neighbor is not one of the newly placed tiles
          const isNewlyPlaced = placedTiles.some(p => p.x === nx && p.y === ny);
          return !isNewlyPlaced;
        });
      });

      if (!isConnected) {
        toast.error('Das Wort muss an bestehende Buchstaben anschließen');
        return;
      }
    }

    // Berechne alle Wörter und Punkte
    const { totalPoints, words } = calculateTotalPoints(board, placedTiles);
    const isBingo = placedTiles.length === 7;
    const newScore = score + totalPoints;

    // Speichere in played_words Datenbank
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
 
    // Update local state
    setHasFirstMove(true);
    setScore(newScore);
    setLastWords(words);
    setLastBingo(isBingo);
    setPlacedTiles([]);

    const bagCopy = [...tileBag];
    const newTiles = drawTiles(bagCopy, placedTiles.length);
    const updatedRack = [...playerTiles];
    let tileIndex = 0;
    for (let i = 0; i < updatedRack.length && tileIndex < newTiles.length; i++) {
      if (!updatedRack[i]) {
        updatedRack[i] = newTiles[tileIndex++];
      }
    }
    setPlayerTiles(updatedRack);
    setTileBag(bagCopy);

    // Save to database for multiplayer
    if (gameMode === 'multiplayer') {
      const saved = await saveGame(board, bagCopy, updatedRack, newScore, true);
      if (saved) {
        setIsMyTurn(false);
        toast.success(`${words.map(w => w.word).join(', ')} für ${totalPoints} Punkte! Gegner ist am Zug.`);
      }
    } else {
      const wordList = words.map(w => w.word).join(', ');
      const bonusText = isBingo ? ' (+50 Bingo!)' : '';
      toast.success(`${wordList} für ${totalPoints} Punkte${bonusText}`);
    }
  }, [placedTiles, extractWordDirection, score, tileBag, hasFirstMove, board, gameMode, isMyTurn, playerTiles, saveGame]);

  const handleReset = useCallback(() => {
    // Blanko-Steine zurück als leere Steine
    const tilesToReturn = placedTiles.map(({ tile, originalBlank }) => 
      originalBlank ? { ...tile, letter: ' ', points: 0 } : tile
    );
    setPlayerTiles(prev => {
      const newTiles = [...prev];
      for (const tile of tilesToReturn) {
        const emptyIndex = newTiles.findIndex(t => t === null);
        if (emptyIndex !== -1) {
          newTiles[emptyIndex] = tile;
        }
      }
      return newTiles;
    });

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      placedTiles.forEach(({ x, y }) => {
        newBoard[y][x] = { ...newBoard[y][x], tile: undefined };
      });
      return newBoard;
    });

    setPlacedTiles([]);
  }, [placedTiles]);

  const handlePass = useCallback(async () => {
    if (gameMode === 'multiplayer' && !isMyTurn) {
      toast.error('Du bist nicht am Zug!');
      return;
    }

    if (gameMode === 'multiplayer') {
      const saved = await saveGame(board, tileBag, playerTiles, score, true);
      if (saved) {
        setIsMyTurn(false);
        toast.info('Du hast ausgesetzt. Gegner ist am Zug.');
      }
    } else {
      toast.info('Du hast ausgesetzt.');
    }
  }, [gameMode, isMyTurn, board, tileBag, playerTiles, score, saveGame]);

  const handleExchange = useCallback((tileIds: string[]) => {
    if (tileBag.length < 7) {
      toast.error('Nicht genug Steine im Beutel zum Tauschen');
      return;
    }

    const bagCopy = [...tileBag];
    const newTiles = drawTiles(bagCopy, tileIds.length);
    
    // Put exchanged tiles back in bag
    const exchangedTiles = playerTiles.filter(t => t && tileIds.includes(t.id)) as Tile[];
    bagCopy.push(...exchangedTiles);
    
    // Shuffle the bag
    for (let i = bagCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bagCopy[i], bagCopy[j]] = [bagCopy[j], bagCopy[i]];
    }

    // Update rack
    const updatedRack = playerTiles.map(tile => {
      if (tile && tileIds.includes(tile.id)) {
        const newTile = newTiles.shift();
        return newTile || null;
      }
      return tile;
    });

    setPlayerTiles(updatedRack);
    setTileBag(bagCopy);
    setExchangeDialogOpen(false);

    if (gameMode === 'multiplayer') {
      saveGame(board, bagCopy, updatedRack, score, true).then(saved => {
        if (saved) {
          setIsMyTurn(false);
          toast.info(`${tileIds.length} Stein${tileIds.length !== 1 ? 'e' : ''} getauscht. Gegner ist am Zug.`);
        }
      });
    } else {
      toast.info(`${tileIds.length} Stein${tileIds.length !== 1 ? 'e' : ''} getauscht.`);
    }
  }, [tileBag, playerTiles, gameMode, board, score, saveGame]);

  // Wenn eingeloggt und im Lobby-Modus, zeige MultiplayerLobby
  if (user && gameMode === 'lobby') {
    return (
      <MultiplayerLobby 
        onSelectGame={handleSelectGame}
        onStartSoloGame={handleStartSoloGame}
      />
    );
  }

  // Loading state for multiplayer game
  if (gameMode === 'multiplayer' && gameLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Spiel wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background p-2 sm:p-4 flex flex-col">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        {/* Header mit Auth */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="sm" onClick={handleBackToLobby}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Lobby
              </Button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Scrabble
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {authLoading ? null : user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  <User className="w-4 h-4 inline mr-1" />
                  {user.user_metadata?.username || user.email?.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Abmelden</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Anmelden</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
          {/* Spielfeld - width-driven, full width container */}
          <div className="w-full">
            <div className="bg-card rounded-lg shadow-2xl p-1 sm:p-2 border-2 border-border w-full aspect-square">
              <div className="grid grid-cols-15 gap-0 w-full h-full">
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
              onPass={handlePass}
              onExchange={() => setExchangeDialogOpen(true)}
              canConfirm={placedTiles.length > 0 && (gameMode === 'solo' || isMyTurn)}
              canExchange={tileBag.length >= 7 && (gameMode === 'solo' || isMyTurn)}
              hasPlacedTiles={placedTiles.length > 0}
            />

            <ScoreBoard 
              score={score}
              opponentScore={opponentScore}
              opponentName={opponentName}
              isMyTurn={isMyTurn}
              isMultiplayer={gameMode === 'multiplayer'}
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

      <ExchangeTilesDialog
        open={exchangeDialogOpen}
        tiles={playerTiles}
        tilesInBag={tileBag.length}
        onExchange={handleExchange}
        onCancel={() => setExchangeDialogOpen(false)}
      />
    </div>
  );
};

export default Index;
