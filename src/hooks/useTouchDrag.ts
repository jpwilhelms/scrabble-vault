import { useState, useRef, useCallback, useEffect } from 'react';
import { Tile } from '@/types/scrabble';

interface DragState {
  tile: Tile | null;
  source: { type: 'rack' | 'board'; x?: number; y?: number } | null;
  position: { x: number; y: number } | null;
}

export function useTouchDrag() {
  const [dragState, setDragState] = useState<DragState>({
    tile: null,
    source: null,
    position: null,
  });
  
  const dragStateRef = useRef<DragState>(dragState);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const startDrag = useCallback((
    tile: Tile, 
    source: { type: 'rack' | 'board'; x?: number; y?: number },
    initialPosition: { x: number; y: number }
  ) => {
    setDragState({
      tile,
      source,
      position: initialPosition,
    });
  }, []);

  const updatePosition = useCallback((position: { x: number; y: number }) => {
    setDragState(prev => ({
      ...prev,
      position,
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState({
      tile: null,
      source: null,
      position: null,
    });
  }, []);

  const getDragState = useCallback(() => dragStateRef.current, []);

  return {
    dragState,
    startDrag,
    updatePosition,
    endDrag,
    getDragState,
  };
}
