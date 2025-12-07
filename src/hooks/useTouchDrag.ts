import { useRef, useCallback } from 'react';

interface UseTouchDragOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
}

export function useTouchDrag({ onDragStart, onDragEnd, disabled = false }: UseTouchDragOptions = {}) {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = true;
    
    // Sofort Drag starten ohne Verzögerung
    onDragStart?.();
  }, [disabled, onDragStart]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onDragEnd?.();
  }, [onDragEnd]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
    isDragging: isDraggingRef.current,
  };
}
