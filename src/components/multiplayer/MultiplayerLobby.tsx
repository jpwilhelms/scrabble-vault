import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PlayerList } from './PlayerList';
import { GameList } from './GameList';
import { InvitationList } from './InvitationList';
import { LogOut, User, Gamepad2 } from 'lucide-react';

interface MultiplayerLobbyProps {
  onSelectGame: (gameId: string) => void;
  onStartSoloGame: () => void;
}

export function MultiplayerLobby({ onSelectGame, onStartSoloGame }: MultiplayerLobbyProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Scrabble</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              <User className="w-4 h-4 inline mr-1" />
              {user?.user_metadata?.username || user?.email?.split('@')[0]}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Solo-Spiel Button */}
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={onStartSoloGame}
        >
          <Gamepad2 className="w-5 h-5 mr-2" />
          Solo spielen (ohne Gegner)
        </Button>

        {/* Einladungen */}
        <InvitationList onGameAccepted={onSelectGame} />

        {/* Laufende Spiele */}
        <GameList onSelectGame={onSelectGame} />

        {/* Spielerliste */}
        <PlayerList />
      </div>
    </div>
  );
}
