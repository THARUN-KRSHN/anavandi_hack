import React, { useEffect, useRef } from 'react';

export const DynamicDotBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Detect touch / coarse pointer devices (e.g. mobile, tablets)
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    // Tightly packed, fine halftone dots
    const isSmallScreen = window.innerWidth < 768;
    const SPACING = isSmallScreen ? 11 : 10; // Tightly packed grid (10px spacing)
    const BASE_RADIUS = isSmallScreen ? 0.85 : 0.95; // Smaller, crisp, fine dots
    const INFLUENCE_RADIUS = 95; // Localized, accurate interaction zone
    const INFLUENCE_SQ = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

    // Tracking state: accurate, responsive, no floaty wandering on desktop
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      inside: false,
      touchActive: false,
    };

    let autoTime = 0;

    // Resize handler with high DPI support
    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Desktop pointer movement: direct, accurate tracking without lag
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        mouse.touchActive = true;
      }
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      if (!mouse.active) {
        // Immediate jump on first entry to avoid flying in from offscreen
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      mouse.active = true;
      mouse.inside = true;
    };

    // Mobile touch interaction: accurate touch tracking
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.targetX = touch.clientX;
        mouse.targetY = touch.clientY;
        if (!mouse.active) {
          mouse.x = touch.clientX;
          mouse.y = touch.clientY;
        }
        mouse.active = true;
        mouse.inside = true;
        mouse.touchActive = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.touchActive = false;
      mouse.active = false;
      mouse.inside = false;
    };

    const handlePointerLeave = () => {
      mouse.inside = false;
      mouse.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // Main animation loop
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) * 0.001, 0.05);
      lastTimestamp = now;

      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const isMobile = isTouchDevice || isSmallScreen;

      if (isMobile && !mouse.touchActive) {
        // On mobile, keep the gentle ambient autonomous wave animation
        autoTime += dt * 1.6;
      } else if (mouse.inside) {
        // On desktop/laptop with mouse:
        // Highly accurate, crisp, responsive tracking (snappy lerp, no wandering)
        mouse.x += (mouse.targetX - mouse.x) * 0.75;
        mouse.y += (mouse.targetY - mouse.y) * 0.75;
      }

      // Draw all dots in one single GPU draw call for maximum 60/120fps performance
      ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
      ctx.beginPath();

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const hasPointer = mouse.active && mouse.inside;

      for (let c = 0; c <= cols; c++) {
        const baseX = c * SPACING;
        const dx = hasPointer ? baseX - mouse.x : 9999;
        const dxAbs = Math.abs(dx);

        for (let r = 0; r <= rows; r++) {
          const baseY = r * SPACING;
          let drawX = baseX;
          let drawY = baseY;
          let radius = BASE_RADIUS;

          // If within horizontal interaction slice
          if (hasPointer && dxAbs < INFLUENCE_RADIUS) {
            const dy = baseY - mouse.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < INFLUENCE_SQ) {
              const dist = Math.sqrt(distSq);
              const norm = dist / INFLUENCE_RADIUS; // 0 (cursor center) to 1 (outer edge)

              // Less dynamic and accurate: subtle gentle deflection (max 2.4px instead of 7-28px)
              const push = Math.sin(norm * Math.PI) * 2.4;
              const angle = Math.atan2(dy, dx);
              drawX += Math.cos(angle) * push;
              drawY += Math.sin(angle) * push;

              // Accurate focus: dots close to cursor are slightly crisper (radius up to 1.35px)
              if (norm < 0.25) {
                radius = BASE_RADIUS * 0.75;
              } else {
                radius = BASE_RADIUS + (1 - norm) * 0.4;
              }
            }
          } else if (isMobile && !mouse.touchActive) {
            // Gentle ambient dynamic wave for mobile
            const wave = Math.sin(baseX * 0.025 + baseY * 0.025 - autoTime) * 0.16;
            radius = BASE_RADIUS + wave;
          }

          if (radius > 0.2) {
            ctx.moveTo(drawX + radius, drawY);
            ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
          }
        }
      }

      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
