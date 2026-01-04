interface PreviewScoreIndicatorProps {
  score: number;
  position: { x: number; y: number };
}

export function PreviewScoreIndicator({ score, position }: PreviewScoreIndicatorProps) {
  if (score === 0) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(50%, 50%)',
      }}
    >
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold shadow-lg border-2 border-background">
        {score}
      </div>
    </div>
  );
}
