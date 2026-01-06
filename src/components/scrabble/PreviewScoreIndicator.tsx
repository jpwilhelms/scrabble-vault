interface PreviewScoreIndicatorProps {
  score: number;
  // Position relative to the board container (percentage 0-1)
  cellX: number;
  cellY: number;
}

export function PreviewScoreIndicator({ score, cellX, cellY }: PreviewScoreIndicatorProps) {
  if (score === 0) return null;

  // Position at bottom-right corner of the cell
  const left = `${((cellX + 1) / 15) * 100}%`;
  const top = `${((cellY + 1) / 15) * 100}%`;

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left,
        top,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-lg border border-background">
        {score}
      </div>
    </div>
  );
}
