import React, { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';

/**
 * InPlaceFlipCard — Flips a card in place within the grid.
 *
 * No portal, no overlay, no backdrop. The card rotates 180° on its Y-axis
 * right where it sits, and the container height animates to fit the active face.
 */

interface InPlaceFlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  accentColor: string;
  className?: string;
  isFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
}

const FLIP_MS = 500;
const HEIGHT_MS = 400;

const InPlaceFlipCard: React.FC<InPlaceFlipCardProps> = ({
  front,
  back,
  accentColor,
  className = '',
  isFlipped: controlledFlipped,
  onFlipChange,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isControlled = controlledFlipped !== undefined;
  const isFlipped = isControlled ? controlledFlipped : internalFlipped;

  const cardRef = useRef<HTMLDivElement>(null);
  const frontMeasureRef = useRef<HTMLDivElement>(null);
  const backMeasureRef = useRef<HTMLDivElement>(null);
  const [frontHeight, setFrontHeight] = useState(0);
  const [backHeight, setBackHeight] = useState(0);

  // Measure both faces
  const measure = useCallback(() => {
    if (frontMeasureRef.current) setFrontHeight(frontMeasureRef.current.offsetHeight);
    if (backMeasureRef.current) setBackHeight(backMeasureRef.current.offsetHeight);
  }, []);

  useLayoutEffect(measure, [measure, front, back]);

  useEffect(() => {
    const frontEl = frontMeasureRef.current;
    const backEl = backMeasureRef.current;
    if (!frontEl || !backEl) return;

    const obs = new ResizeObserver(measure);
    obs.observe(frontEl);
    obs.observe(backEl);
    return () => obs.disconnect();
  }, [measure]);

  // Toggle flip
  const toggle = useCallback(() => {
    const next = !isFlipped;
    if (!isControlled) setInternalFlipped(next);
    onFlipChange?.(next);
  }, [isFlipped, isControlled, onFlipChange]);

  // Click outside to flip back
  useEffect(() => {
    if (!isFlipped) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        if (!isControlled) setInternalFlipped(false);
        onFlipChange?.(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFlipped, isControlled, onFlipChange]);

  const activeHeight = isFlipped ? backHeight : frontHeight;

  return (
    <div ref={cardRef} className={`relative ${className}`}>
      {/* Hidden measurers — same width as card, invisible */}
      <div
        ref={frontMeasureRef}
        aria-hidden
        style={{ position: 'absolute', visibility: 'hidden', width: '100%', pointerEvents: 'none', zIndex: -1 }}
      >
        {front}
      </div>
      <div
        ref={backMeasureRef}
        aria-hidden
        style={{ position: 'absolute', visibility: 'hidden', width: '100%', pointerEvents: 'none', zIndex: -1 }}
      >
        {back}
      </div>

      {/* Flip container */}
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggle()}
        className="cursor-pointer"
        style={{
          perspective: '1000px',
          height: activeHeight || 'auto',
          transition: `height ${HEIGHT_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: `transform ${FLIP_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Front face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              position: 'absolute',
              inset: 0,
              width: '100%',
            }}
          >
            {front}
          </div>

          {/* Back face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
              width: '100%',
            }}
          >
            {back}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InPlaceFlipCard;
