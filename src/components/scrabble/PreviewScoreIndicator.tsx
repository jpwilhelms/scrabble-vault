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
        transform: 'translate(-25%, -25%)',
      }}
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-lg border border-background">
        {score}
      </div>
    </div>
  );
}
