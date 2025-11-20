interface ScoreBoardProps {
  score: number;
  lastWord?: string;
  lastPoints?: number;
}

export function ScoreBoard({ score, lastWord, lastPoints }: ScoreBoardProps) {
  return (
    <div className="bg-card rounded-lg shadow-lg p-6 border-2 border-border">
      <h2 className="text-2xl font-bold text-foreground mb-4">Punktestand</h2>
      <div className="text-5xl font-bold text-primary mb-4">{score}</div>
      {lastWord && lastPoints && (
        <div className="text-sm text-muted-foreground">
          Letztes Wort: <span className="font-semibold text-foreground">{lastWord}</span> ({lastPoints} Punkte)
        </div>
      )}
    </div>
  );
}
