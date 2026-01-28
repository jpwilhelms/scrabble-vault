import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseGameNotificationsOptions {
  userId: string | null;
  currentGameId: string | null;
  enabled: boolean;
}

interface GamePayload {
  id: string;
  current_turn_player_id: string | null;
  status: string;
  player1_id: string;
  player2_id: string | null;
}

interface InvitationPayload {
  id: string;
  status: string;
  sender_id: string;
  recipient_id: string;
  game_id: string;
}

export function useGameNotifications({ userId, currentGameId, enabled }: UseGameNotificationsOptions) {
  // Handle game updates (new moves)
  const handleGameUpdate = useCallback((newGame: GamePayload, oldGame: Partial<GamePayload>) => {
    if (!userId) return;
    
    // Skip if this is the currently active game (handled by game persistence)
    if (newGame.id === currentGameId) return;

    // Check if it's now my turn (turn switched to me)
    const wasMyTurn = oldGame.current_turn_player_id === userId;
    const isNowMyTurn = newGame.current_turn_player_id === userId;
    
    if (!wasMyTurn && isNowMyTurn && newGame.status === 'active') {
      // Opponent made a move, now it's my turn
      toast.info('🎯 Dein Gegner hat gespielt! Du bist am Zug.', {
        duration: 5000,
        action: {
          label: 'Zum Spiel',
          onClick: () => {
            window.location.href = `/?game=${newGame.id}`;
          }
        }
      });
    }
  }, [userId, currentGameId]);

  // Handle invitation accepted (game becomes active)
  const handleInvitationAccepted = useCallback((newInv: InvitationPayload, oldInv: Partial<InvitationPayload>) => {
    if (!userId) return;
    
    // Check if I sent this invitation and it was just accepted
    if (newInv.sender_id === userId && oldInv.status === 'pending' && newInv.status === 'accepted') {
      toast.success('🎉 Deine Spieleinladung wurde angenommen!', {
        duration: 5000,
        action: {
          label: 'Zum Spiel',
          onClick: () => {
            window.location.href = `/?game=${newInv.game_id}`;
          }
        }
      });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Subscribe to game updates for all my games
    const gamesChannel = supabase
      .channel('game-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games'
        },
        (payload) => {
          const newGame = payload.new as GamePayload;
          const oldGame = payload.old as Partial<GamePayload>;
          
          // Only handle games where I'm a player
          if (newGame.player1_id === userId || newGame.player2_id === userId) {
            handleGameUpdate(newGame, oldGame);
          }
        }
      )
      .subscribe();

    // Subscribe to invitation status changes
    const invitationsChannel = supabase
      .channel('invitation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_invitations'
        },
        (payload) => {
          const newInv = payload.new as InvitationPayload;
          const oldInv = payload.old as Partial<InvitationPayload>;
          handleInvitationAccepted(newInv, oldInv);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesChannel);
      supabase.removeChannel(invitationsChannel);
    };
  }, [userId, enabled, handleGameUpdate, handleInvitationAccepted]);
}
