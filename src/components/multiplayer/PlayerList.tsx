import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
}

export function PlayerList() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, [user]);

  const loadPlayers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .neq('id', user.id);

      if (error) throw error;
      setPlayers(data || []);
    } catch (e) {
      console.error('Fehler beim Laden der Spieler:', e);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (recipientId: string) => {
    if (!user) return;
    setSendingTo(recipientId);

    try {
      // Erstelle zuerst ein neues Spiel
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          player1_id: user.id,
          status: 'pending',
          board_state: [],
          tile_bag: [],
          player1_rack: [],
          player2_rack: []
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Dann sende die Einladung
      const { error: inviteError } = await supabase
        .from('game_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          game_id: game.id,
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      toast.success('Einladung gesendet!');
    } catch (e) {
      console.error('Fehler beim Senden:', e);
      toast.error('Einladung konnte nicht gesendet werden');
    } finally {
      setSendingTo(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spieler</CardTitle>
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
        <CardTitle className="text-lg">Spieler einladen</CardTitle>
      </CardHeader>
      <CardContent className="max-h-60 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine anderen Spieler gefunden</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="font-medium">
                  {player.display_name || player.username || 'Unbekannt'}
                </span>
                <Button
                  size="sm"
                  onClick={() => sendInvitation(player.id)}
                  disabled={sendingTo === player.id}
                >
                  {sendingTo === player.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Einladen
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
