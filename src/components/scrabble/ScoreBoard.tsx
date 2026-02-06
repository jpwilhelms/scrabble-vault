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
    <div className="bg-card rounded-lg shadow-md p-2 sm:p-3 border-2 border-border">
      {isMultiplayer ? (
        <div className="space-y-1">
          {/* Last move info for opponent */}
          {lastMoveInfo && (
            <div className="text-xs p-1.5 rounded bg-muted/50 border border-border">
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
          
          {/* Multiplayer score display - more compact */}
          <div className="flex items-center justify-between gap-2">
            <div className={`flex-1 p-1.5 rounded ${isMyTurn ? 'bg-primary/10 border border-primary' : ''}`}>
              <div className="text-[10px] text-muted-foreground leading-tight">Du {isMyTurn && '(am Zug)'}</div>
              <div className="text-xl font-bold text-primary leading-tight">{score}</div>
            </div>
            <div className="text-xs text-muted-foreground">vs</div>
            <div className={`flex-1 p-1.5 rounded text-right ${!isMyTurn ? 'bg-destructive/10 border border-destructive' : ''}`}>
              <div className="text-[10px] text-muted-foreground leading-tight">{opponentName} {!isMyTurn && '(am Zug)'}</div>
              <div className="text-xl font-bold text-destructive leading-tight">{opponentScore ?? 0}</div>
            </div>
          </div>
          {lastWords && lastWords.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {lastWords.map((w, i) => (
                <span key={i}>
                  {i > 0 && ' + '}
                  <span className="font-semibold text-foreground">{w.word}</span> ({w.points}P)
                </span>
              ))}
              {bingoBonus && <span className="text-accent font-bold"> +50 Bingo!</span>}
              <span className="ml-1 font-bold text-primary">= {totalWithBonus}P</span>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground">
            Beutel: <span className="font-semibold">{tilesRemaining}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">Punkte</h2>
            {lastWords && lastWords.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {lastWords.map((w, i) => (
                  <span key={i}>
                    {i > 0 && ' + '}
                    <span className="font-semibold text-foreground">{w.word}</span> ({w.points}P)
                  </span>
                ))}
                {bingoBonus && <span className="text-accent font-bold"> +50 Bingo!</span>}
                <span className="ml-1 font-bold text-primary">= {totalWithBonus}P</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Beutel: <span className="font-semibold">{tilesRemaining}</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{score}</div>
        </div>
      )}
    </div>
  );
}
