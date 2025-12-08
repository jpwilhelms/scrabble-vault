interface WordScore {
  word: string;
  points: number;
}

interface ScoreBoardProps {
  score: number;
  lastWords?: WordScore[];
  bingoBonus?: boolean;
}

export function ScoreBoard({ score, lastWords, bingoBonus }: ScoreBoardProps) {
  return (
    <div className="bg-card rounded-lg shadow-lg p-3 sm:p-4 border-2 border-border">
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
            </div>
          )}
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-primary">{score}</div>
      </div>
    </div>
  );
}
