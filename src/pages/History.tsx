import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Target, Loader2, TrendingUp } from 'lucide-react';

interface FinishedGame {
  id: string;
  status: string;
  player1_id: string;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
  is_solo: boolean;
  player1_profile?: { display_name: string | null; username: string | null };
  player2_profile?: { display_name: string | null; username: string | null };
}

interface OpponentStats {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  draws: number;
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<FinishedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageGameScore, setAverageGameScore] = useState(0);
  const [averageWordScore, setAverageWordScore] = useState(0);
  const [opponentStats, setOpponentStats] = useState<OpponentStats[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      // Load finished games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          *,
          player1_profile:profiles!games_player1_id_fkey(display_name, username),
          player2_profile:profiles!games_player2_id_fkey(display_name, username)
        `)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'finished')
        .order('updated_at', { ascending: false });

      if (gamesError) throw gamesError;
      
      const finishedGames = (gamesData as FinishedGame[]) || [];
      setGames(finishedGames);

      // Calculate average game score
      if (finishedGames.length > 0) {
        const totalScore = finishedGames.reduce((sum, game) => {
          const myScore = game.player1_id === user.id ? game.player1_score : game.player2_score;
          return sum + myScore;
        }, 0);
        setAverageGameScore(Math.round(totalScore / finishedGames.length));
      }

      // Load word scores for average word score
      const { data: turnsData, error: turnsError } = await supabase
        .from('game_turns')
        .select('score')
        .eq('player_id', user.id)
        .eq('status', 'accepted')
        .gt('score', 0);

      if (!turnsError && turnsData && turnsData.length > 0) {
        const totalWordScore = turnsData.reduce((sum, turn) => sum + turn.score, 0);
        setAverageWordScore(Math.round(totalWordScore / turnsData.length));
      }

      // Calculate opponent stats (only for multiplayer games)
      const multiplayerGames = finishedGames.filter(g => !g.is_solo && g.player2_id);
      const statsMap = new Map<string, OpponentStats>();

      multiplayerGames.forEach(game => {
        const opponentId = game.player1_id === user.id ? game.player2_id! : game.player1_id;
        const opponentProfile = game.player1_id === user.id ? game.player2_profile : game.player1_profile;
        const opponentName = opponentProfile?.display_name || opponentProfile?.username || 'Unbekannt';

        if (!statsMap.has(opponentId)) {
          statsMap.set(opponentId, {
            opponentId,
            opponentName,
            wins: 0,
            losses: 0,
            draws: 0
          });
        }

        const stats = statsMap.get(opponentId)!;
        if (game.winner_id === user.id) {
          stats.wins++;
        } else if (game.winner_id === opponentId) {
          stats.losses++;
        } else {
          stats.draws++;
        }
      });

      setOpponentStats(Array.from(statsMap.values()).sort((a, b) => 
        (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws)
      ));

    } catch (e) {
      console.error('Fehler beim Laden der Historie:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOpponentName = (game: FinishedGame) => {
    if (!user) return 'Unbekannt';
    if (game.is_solo) return 'Solo-Spiel';
    
    if (game.player1_id === user.id) {
      return game.player2_profile?.display_name || 
             game.player2_profile?.username || 
             'Unbekannt';
    }
    return game.player1_profile?.display_name || 
           game.player1_profile?.username || 
           'Unbekannt';
  };

  const getGameResult = (game: FinishedGame) => {
    if (!user) return 'draw';
    if (game.winner_id === user.id) return 'win';
    if (game.winner_id && game.winner_id !== user.id) return 'loss';
    return 'draw';
  };

  const getMyScore = (game: FinishedGame) => {
    if (!user) return 0;
    return game.player1_id === user.id ? game.player1_score : game.player2_score;
  };

  const getOpponentScore = (game: FinishedGame) => {
    if (!user) return 0;
    return game.player1_id === user.id ? game.player2_score : game.player1_score;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Historie</h1>
        </div>

        {/* Statistiken */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Ø Spielpunktzahl</div>
                <div className="text-2xl font-bold text-primary">{averageGameScore}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Ø Wortpunktzahl</div>
                <div className="text-2xl font-bold text-primary">{averageWordScore}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gegner-Statistik */}
        {opponentStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Bilanz pro Gegner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {opponentStats.map(stats => (
                  <div
                    key={stats.opponentId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">{stats.opponentName}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600 font-medium">{stats.wins}W</span>
                      <span className="text-red-600 font-medium">{stats.losses}L</span>
                      {stats.draws > 0 && (
                        <span className="text-muted-foreground">{stats.draws}U</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Abgeschlossene Spiele */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abgeschlossene Spiele</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine abgeschlossenen Spiele</p>
            ) : (
              <div className="space-y-2">
                {games.map((game) => {
                  const result = getGameResult(game);
                  return (
                    <div
                      key={game.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result === 'win' ? 'bg-green-500/10 border border-green-500/30' :
                        result === 'loss' ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {result === 'win' && <Trophy className="w-4 h-4 text-yellow-500" />}
                          <span className="font-medium">{getOpponentName(game)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(game.updated_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {getMyScore(game)} : {getOpponentScore(game)}
                        </div>
                        <div className={`text-xs ${
                          result === 'win' ? 'text-green-600' :
                          result === 'loss' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>
                          {result === 'win' ? 'Gewonnen' : result === 'loss' ? 'Verloren' : 'Unentschieden'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
