import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, Trophy } from 'lucide-react';

interface Game {
  id: string;
  status: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  current_turn_player_id: string | null;
  created_at: string;
  player1_profile?: { display_name: string | null; username: string | null };
  player2_profile?: { display_name: string | null; username: string | null };
}

interface GameListProps {
  onSelectGame: (gameId: string) => void;
}

export function GameList({ onSelectGame }: GameListProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGames();
      subscribeToGames();
    }
  }, [user]);

  const loadGames = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          player1_profile:profiles!games_player1_id_fkey(display_name, username),
          player2_profile:profiles!games_player2_id_fkey(display_name, username)
        `)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Sort games: my turn first, then others
      const sortedGames = ((data as Game[]) || []).sort((a, b) => {
        const aIsMyTurn = a.current_turn_player_id === user.id;
        const bIsMyTurn = b.current_turn_player_id === user.id;
        if (aIsMyTurn && !bIsMyTurn) return -1;
        if (!aIsMyTurn && bIsMyTurn) return 1;
        return 0;
      });
      
      setGames(sortedGames);
    } catch (e) {
      console.error('Fehler beim Laden der Spiele:', e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToGames = () => {
    const channel = supabase
      .channel('games-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games'
        },
        () => {
          loadGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getOpponentName = (game: Game) => {
    if (!user) return 'Unbekannt';
    
    if (game.player1_id === user.id) {
      return game.player2_profile?.display_name || 
             game.player2_profile?.username || 
             'Warte auf Gegner...';
    }
    return game.player1_profile?.display_name || 
           game.player1_profile?.username || 
           'Unbekannt';
  };

  const isMyTurn = (game: Game) => {
    return game.current_turn_player_id === user?.id;
  };

  const getMyScore = (game: Game) => {
    if (!user) return 0;
    return game.player1_id === user.id ? game.player1_score : game.player2_score;
  };

  const getOpponentScore = (game: Game) => {
    if (!user) return 0;
    return game.player1_id === user.id ? game.player2_score : game.player1_score;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meine Spiele</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meine Spiele</CardTitle>
      </CardHeader>
      <CardContent className="max-h-60 overflow-y-auto">
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine aktiven Spiele</p>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getOpponentName(game)}</span>
                    {isMyTurn(game) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Dein Zug
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Trophy className="w-3 h-3" />
                    <span>{getMyScore(game)} : {getOpponentScore(game)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectGame(game.id)}
                  disabled={game.status === 'pending'}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Spielen
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
