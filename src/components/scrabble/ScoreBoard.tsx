interface WordScore {
  word: string;
  points: number;
}

interface ScoreBoardProps {
  score: number;
  opponentScore?: number;
  opponentName?: string;
  isMyTurn?: boolean;
  isMultiplayer?: boolean;
  lastWords?: WordScore[];
  bingoBonus?: boolean;
  tilesRemaining: number;
  lastMoveInfo?: {
    type: 'word' | 'pass' | 'exchange';
    playerName?: string;
    words?: WordScore[];
    exchangedCount?: number;
  } | null;
}

export function ScoreBoard({ 
  score, 
  opponentScore, 
  opponentName = 'Gegner',
  isMyTurn = true,
  isMultiplayer = false,
  lastWords, 
  bingoBonus, 
  tilesRemaining,
  lastMoveInfo
}: ScoreBoardProps) {
  // Calculate total for last words
  const lastWordsTotal = lastWords?.reduce((sum, w) => sum + w.points, 0) ?? 0;
  const totalWithBonus = lastWordsTotal + (bingoBonus ? 50 : 0);

  return (
    <div className="bg-card rounded-lg shadow-lg p-3 sm:p-4 border-2 border-border">
      {isMultiplayer ? (
        <div className="space-y-2">
          {/* Last move info for opponent */}
          {lastMoveInfo && (
            <div className="text-xs p-2 rounded bg-muted/50 border border-border">
              <span className="font-medium">{lastMoveInfo.playerName || opponentName}:</span>{' '}
              {lastMoveInfo.type === 'pass' && (
                <span className="text-muted-foreground">hat ausgesetzt</span>
              )}
              {lastMoveInfo.type === 'exchange' && (
                <span className="text-muted-foreground">
                  hat {lastMoveInfo.exchangedCount} Stein{lastMoveInfo.exchangedCount !== 1 ? 'e' : ''} getauscht
                </span>
              )}
              {lastMoveInfo.type === 'word' && lastMoveInfo.words && (
                <span>
                  {lastMoveInfo.words.map((w, i) => (
                    <span key={i}>
                      {i > 0 && ' + '}
                      <span className="font-semibold text-foreground">{w.word}</span> ({w.points}P)
                    </span>
                  ))}
                  {' = '}
                  <span className="font-bold text-primary">
                    {lastMoveInfo.words.reduce((s, w) => s + w.points, 0)}P
                  </span>
                </span>
              )}
            </div>
          )}
          
          {/* Multiplayer score display */}
          <div className="flex items-center justify-between">
            <div className={`flex-1 p-2 rounded ${isMyTurn ? 'bg-primary/10 border border-primary' : ''}`}>
              <div className="text-xs text-muted-foreground">Du {isMyTurn && '(am Zug)'}</div>
              <div className="text-2xl font-bold text-primary">{score}</div>
            </div>
            <div className="px-2 text-muted-foreground">vs</div>
            <div className={`flex-1 p-2 rounded text-right ${!isMyTurn ? 'bg-destructive/10 border border-destructive' : ''}`}>
              <div className="text-xs text-muted-foreground">{opponentName} {!isMyTurn && '(am Zug)'}</div>
              <div className="text-2xl font-bold text-destructive">{opponentScore ?? 0}</div>
            </div>
          </div>
          {lastWords && lastWords.length > 0 && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {lastWords.map((w, i) => (
                <span key={i}>
                  {i > 0 && ' + '}
                  <span className="font-semibold text-foreground">{w.word}</span> ({w.points}P)
                </span>
              ))}
              {bingoBonus && <span className="text-accent font-bold"> +50 Bingo!</span>}
              <span className="ml-2 font-bold text-primary">= {totalWithBonus}P</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Steine im Beutel: <span className="font-semibold">{tilesRemaining}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Punktestand</h2>
            {lastWords && lastWords.length > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {lastWords.map((w, i) => (
                  <span key={i}>
                    {i > 0 && ' + '}
                    <span className="font-semibold text-foreground">{w.word}</span> ({w.points}P)
                  </span>
                ))}
                {bingoBonus && <span className="text-accent font-bold"> +50 Bingo!</span>}
                <span className="ml-2 font-bold text-primary">= {totalWithBonus}P</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Steine im Beutel: <span className="font-semibold">{tilesRemaining}</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-primary">{score}</div>
        </div>
      )}
    </div>
  );
}
