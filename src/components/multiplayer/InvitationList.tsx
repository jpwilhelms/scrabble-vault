import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  game_id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender_profile?: { display_name: string | null; username: string | null };
  recipient_profile?: { display_name: string | null; username: string | null };
}

interface InvitationListProps {
  onGameAccepted?: (gameId: string) => void;
}

export function InvitationList({ onGameAccepted }: InvitationListProps) {
  const { user } = useAuth();
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvitations();
      subscribeToInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      // Empfangene Einladungen
      const { data: received, error: recError } = await supabase
        .from('game_invitations')
        .select(`
          *,
          sender_profile:profiles!game_invitations_sender_id_fkey(display_name, username)
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (recError) throw recError;

      // Gesendete Einladungen
      const { data: sent, error: sentError } = await supabase
        .from('game_invitations')
        .select(`
          *,
          recipient_profile:profiles!game_invitations_recipient_id_fkey(display_name, username)
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      setReceivedInvitations((received as Invitation[]) || []);
      setSentInvitations((sent as Invitation[]) || []);
    } catch (e) {
      console.error('Fehler beim Laden der Einladungen:', e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToInvitations = () => {
    const channel = supabase
      .channel('invitations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_invitations'
        },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = async (invitation: Invitation) => {
    if (!user) return;
    setProcessingId(invitation.id);

    try {
      // Update invitation status - DB trigger will auto-activate the game
      const { error: invError } = await supabase
        .from('game_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (invError) throw invError;

      toast.success('Einladung angenommen! Spiel startet.');
      
      // Small delay to let the DB trigger complete
      setTimeout(() => {
        onGameAccepted?.(invitation.game_id);
      }, 300);
    } catch (e) {
      console.error('Fehler:', e);
      toast.error('Fehler beim Annehmen der Einladung');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: Invitation) => {
    setProcessingId(invitation.id);

    try {
      // Update invitation status
      const { error: invError } = await supabase
        .from('game_invitations')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (invError) throw invError;

      // Delete the pending game
      const { error: gameError } = await supabase
        .from('games')
        .delete()
        .eq('id', invitation.game_id);

      if (gameError) console.error('Game deletion error:', gameError);

      toast.success('Einladung abgelehnt');
    } catch (e) {
      console.error('Fehler:', e);
      toast.error('Fehler beim Ablehnen');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Einladungen</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasInvitations = receivedInvitations.length > 0 || sentInvitations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Einladungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasInvitations ? (
          <p className="text-sm text-muted-foreground">Keine offenen Einladungen</p>
        ) : (
          <>
            {receivedInvitations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Empfangen
                </h4>
                {receivedInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <span className="font-medium">
                        {inv.sender_profile?.display_name || inv.sender_profile?.username || 'Unbekannt'}
                      </span>
                      {inv.message && (
                        <p className="text-sm text-muted-foreground">{inv.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAccept(inv)}
                        disabled={processingId === inv.id}
                      >
                        {processingId === inv.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDecline(inv)}
                        disabled={processingId === inv.id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sentInvitations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Gesendet
                </h4>
                {sentInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">
                      {inv.recipient_profile?.display_name || inv.recipient_profile?.username || 'Unbekannt'}
                    </span>
                    <span className="text-sm text-muted-foreground">Warte auf Antwort...</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
