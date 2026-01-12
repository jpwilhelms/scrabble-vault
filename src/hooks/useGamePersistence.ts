import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BoardSquare, Tile } from '@/types/scrabble';
import { createBoard } from '@/utils/scrabbleBoard';
import { generateTileBag, drawTiles } from '@/utils/tileGenerator';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface GameState {
  board: BoardSquare[][];
  tileBag: Tile[];
  playerTiles: (Tile | null)[];
  opponentTiles: (Tile | null)[];
  playerScore: number;
  opponentScore: number;
  isMyTurn: boolean;
  hasFirstMove: boolean;
  opponentName: string;
  consecutivePasses: number;
  gameStatus: 'pending' | 'active' | 'finished' | 'abandoned';
  winnerId: string | null;
  isPlayer1: boolean;
  player1Id: string;
  player2Id: string | null;
  lastMoveType: 'word' | 'pass' | 'exchange' | null;
}

interface UseGamePersistenceOptions {
  gameId: string | null;
  userId: string | null;
  enabled: boolean;
}

// Helper to convert board to JSON-safe format
const boardToJson = (board: BoardSquare[][]): Json => {
  return board.map(row => 
    row.map(square => ({
      x: square.x,
      y: square.y,
      premium: square.premium,
      tile: square.tile ? {
        letter: square.tile.letter,
        points: square.tile.points,
        id: square.tile.id
      } : null
    }))
  ) as Json;
};

// Helper to convert rack to JSON-safe format
const rackToJson = (rack: (Tile | null)[]): Json => {
  return rack.map(tile => 
    tile ? { letter: tile.letter, points: tile.points, id: tile.id } : null
  ) as Json;
};

// Helper to convert tileBag to JSON-safe format
const tileBagToJson = (bag: Tile[]): Json => {
  return bag.map(tile => ({
    letter: tile.letter,
    points: tile.points,
    id: tile.id
  })) as Json;
};

// Helper to parse board from JSON
const parseBoard = (jsonBoard: Json): BoardSquare[][] => {
  if (!Array.isArray(jsonBoard) || jsonBoard.length === 0) {
    return createBoard();
  }
  
  return (jsonBoard as unknown as Array<Array<{
    x: number;
    y: number;
    premium: BoardSquare['premium'];
    tile: { letter: string; points: number; id: string } | null;
  }>>).map(row => 
    row.map(square => ({
      x: square.x,
      y: square.y,
      premium: square.premium,
      tile: square.tile ? {
        letter: square.tile.letter,
        points: square.tile.points,
        id: square.tile.id
      } : undefined
    }))
  );
};

// Helper to parse rack from JSON
const parseRack = (jsonRack: Json): (Tile | null)[] => {
  if (!Array.isArray(jsonRack)) {
    return Array(7).fill(null);
  }
  
  return (jsonRack as Array<{ letter: string; points: number; id: string } | null>).map(tile => 
    tile ? { letter: tile.letter, points: tile.points, id: tile.id } : null
  );
};

// Helper to parse tile bag from JSON
const parseTileBag = (jsonBag: Json): Tile[] => {
  if (!Array.isArray(jsonBag)) {
    return [];
  }
  
  return (jsonBag as Array<{ letter: string; points: number; id: string }>).map(tile => ({
    letter: tile.letter,
    points: tile.points,
    id: tile.id
  }));
};

export function useGamePersistence({ gameId, userId, enabled }: UseGamePersistenceOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load game state from database
  const loadGame = useCallback(async () => {
    if (!gameId || !userId || !enabled) return;

    setLoading(true);
    setError(null);

    const processGameData = async (game: {
      id: string;
      player1_id: string;
      player2_id: string | null;
      current_turn_player_id: string | null;
      board_state: Json;
      tile_bag: Json;
      player1_rack: Json;
      player2_rack: Json;
      player1_score: number;
      player2_score: number;
      consecutive_passes: number;
      status: 'pending' | 'active' | 'finished' | 'abandoned';
      winner_id: string | null;
      last_move_type: string | null;
      player1?: { id: string; display_name: string | null; username: string | null } | null;
      player2?: { id: string; display_name: string | null; username: string | null } | null;
    }) => {
      const isPlayer1 = game.player1_id === userId;
      const isMyTurn = game.current_turn_player_id === userId;
      
      // Parse board state
      let board = parseBoard(game.board_state);
      const tileBag = parseTileBag(game.tile_bag);
      
      // Check if this is a fresh game (empty board and racks)
      const boardStateArray = game.board_state as unknown[];
      const player1RackArray = game.player1_rack as unknown[];
      const isNewGame = 
        (!Array.isArray(boardStateArray) || boardStateArray.length === 0) &&
        (!Array.isArray(player1RackArray) || player1RackArray.length === 0 || 
         player1RackArray.every(t => t === null));

      let playerRack: (Tile | null)[];
      let opponentRack: (Tile | null)[];
      let newTileBag = tileBag;

      if (isNewGame && tileBag.length === 0) {
        // Initialize new game
        const freshBag = generateTileBag();
        const player1Tiles = drawTiles(freshBag, 7);
        const player2Tiles = drawTiles(freshBag, 7);
        
        board = createBoard();
        newTileBag = freshBag;
        
        // Save initial state
        const { error: updateError } = await supabase
          .from('games')
          .update({
            board_state: boardToJson(board),
            tile_bag: tileBagToJson(newTileBag),
            player1_rack: rackToJson(player1Tiles.map(t => t)),
            player2_rack: rackToJson(player2Tiles.map(t => t))
          })
          .eq('id', gameId);

        if (updateError) throw updateError;

        playerRack = isPlayer1 
          ? player1Tiles.map(t => t as Tile | null)
          : player2Tiles.map(t => t as Tile | null);
        opponentRack = isPlayer1 
          ? player2Tiles.map(t => t as Tile | null)
          : player1Tiles.map(t => t as Tile | null);
      } else {
        // Load existing racks
        playerRack = isPlayer1 
          ? parseRack(game.player1_rack)
          : parseRack(game.player2_rack);
        opponentRack = isPlayer1 
          ? parseRack(game.player2_rack)
          : parseRack(game.player1_rack);
      }

      // Determine opponent name
      const opponent = isPlayer1 ? game.player2 : game.player1;
      const opponentName = opponent 
        ? (opponent.display_name || opponent.username || 'Gegner')
        : 'Gegner';

      // Check if any tiles have been placed (first move made)
      const hasFirstMove = board.some(row => row.some(sq => sq.tile));

      setGameState({
        board,
        tileBag: newTileBag,
        playerTiles: playerRack,
        opponentTiles: opponentRack,
        playerScore: isPlayer1 ? game.player1_score : game.player2_score,
        opponentScore: isPlayer1 ? game.player2_score : game.player1_score,
        isMyTurn,
        hasFirstMove,
        opponentName,
        consecutivePasses: game.consecutive_passes ?? 0,
        gameStatus: game.status,
        winnerId: game.winner_id,
        isPlayer1,
        player1Id: game.player1_id,
        player2Id: game.player2_id,
        lastMoveType: game.last_move_type as 'word' | 'pass' | 'exchange' | null,
      });
    };

    try {
      // Use maybeSingle to avoid errors when RLS hasn't propagated yet
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          player1:profiles!games_player1_id_fkey(id, display_name, username),
          player2:profiles!games_player2_id_fkey(id, display_name, username)
        `)
        .eq('id', gameId)
        .maybeSingle();

      if (gameError) throw gameError;
      if (!game) {
        // Game not found or not accessible yet - retry after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: retryGame, error: retryError } = await supabase
          .from('games')
          .select(`
            *,
            player1:profiles!games_player1_id_fkey(id, display_name, username),
            player2:profiles!games_player2_id_fkey(id, display_name, username)
          `)
          .eq('id', gameId)
          .maybeSingle();
        
        if (retryError) throw retryError;
        if (!retryGame) throw new Error('Spiel nicht gefunden oder kein Zugriff');
        
        await processGameData(retryGame);
      } else {
        await processGameData(game);
      }
    } catch (err) {
      console.error('Error loading game:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Spiels');
      toast.error('Fehler beim Laden des Spiels');
    } finally {
      setLoading(false);
    }
  }, [gameId, userId, enabled]);

  // Save game state to database
  const saveGame = useCallback(async (
    board: BoardSquare[][],
    tileBag: Tile[],
    playerTiles: (Tile | null)[],
    playerScore: number,
    switchTurn: boolean = true,
    moveType: 'word' | 'pass' | 'exchange' = 'word'
  ) => {
    if (!gameId || !userId || !enabled) return false;

    try {
      // First get current game to know which player we are
      const { data: game, error: fetchError } = await supabase
        .from('games')
        .select('player1_id, player2_id, player1_score, player2_score, consecutive_passes')
        .eq('id', gameId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!game) throw new Error('Spiel nicht gefunden');

      const isPlayer1 = game.player1_id === userId;
      const nextPlayerId = isPlayer1 ? game.player2_id : game.player1_id;
      
      // Calculate consecutive passes
      let newConsecutivePasses = 0;
      if (moveType === 'pass') {
        newConsecutivePasses = (game.consecutive_passes ?? 0) + 1;
      } else if (moveType === 'exchange') {
        newConsecutivePasses = (game.consecutive_passes ?? 0) + 1;
      }
      // word resets to 0

      const updateData: Record<string, unknown> = {
        board_state: boardToJson(board),
        tile_bag: tileBagToJson(tileBag),
        updated_at: new Date().toISOString(),
        consecutive_passes: newConsecutivePasses,
        last_move_type: moveType,
      };

      if (isPlayer1) {
        updateData.player1_rack = rackToJson(playerTiles);
        updateData.player1_score = playerScore;
      } else {
        updateData.player2_rack = rackToJson(playerTiles);
        updateData.player2_score = playerScore;
      }

      if (switchTurn) {
        updateData.current_turn_player_id = nextPlayerId;
      }

      const { error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error saving game:', err);
      toast.error('Fehler beim Speichern des Spiels');
      return false;
    }
  }, [gameId, userId, enabled]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!gameId || !enabled) return;

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        () => {
          // Reload game state when opponent makes a move
          loadGame();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, enabled, loadGame]);

  // Initial load
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  return {
    gameState,
    loading,
    error,
    loadGame,
    saveGame
  };
}
