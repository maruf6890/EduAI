import { useRef, useCallback, useEffect } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeGestureOptions) {
  const startTouchRef = useRef<TouchPoint | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    startTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !startTouchRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouchRef.current.x;
    const deltaY = touch.clientY - startTouchRef.current.y;
    const deltaTime = Date.now() - startTouchRef.current.time;

    // Only trigger if horizontal swipe and within reasonable time (< 500ms)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
    const isQuickEnough = deltaTime < 500;
    const isLongEnough = Math.abs(deltaX) >= threshold;

    if (isHorizontalSwipe && isQuickEnough && isLongEnough) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    startTouchRef.current = null;
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, enabled]);

  return elementRef;
}
