import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion3D } from './useReducedMotion3D';
import { WebGLFallback } from './WebGLFallback';
import { BusModel } from './BusModel';
import { RouteLine } from './RouteLine';
import { DepotScene } from './DepotScene';

interface ThreeSceneProps {
  type?: 'bus_hero' | 'route_success' | 'depot_overview';
  compact?: boolean;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  type = 'bus_hero',
  compact = false,
}) => {
  const { shouldUse3D } = useReducedMotion3D();

  // If WebGL is unavailable or reduced motion preferred, render 2D static fallback
  if (!shouldUse3D) {
    const fallbackType =
      type === 'route_success' ? 'success' : type === 'depot_overview' ? 'depot' : 'hero';
    return <WebGLFallback type={fallbackType} />;
  }

  return (
    <div className="w-full h-full min-h-[260px] relative pointer-events-none select-none rounded-3xl overflow-hidden">
      <Suspense fallback={<WebGLFallback />}>
        <Canvas
          dpr={compact ? [1, 1.25] : [1, 1.5]}
          camera={{
            position: type === 'depot_overview' ? [0, 3, 6] : [0, 1.2, 4.5],
            fov: compact ? 42 : 38,
          }}
          gl={{ antialias: false, powerPreference: 'low-power' }}
          className="w-full h-full"
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 4, 2]} intensity={1.5} />

          {type === 'bus_hero' && (
            <>
              <BusModel simplified={compact} />
              <RouteLine simplified={compact} />
            </>
          )}

          {type === 'route_success' && (
            <>
              <BusModel simplified={compact} />
              <RouteLine simplified={compact} />
            </>
          )}

          {type === 'depot_overview' && <DepotScene />}
        </Canvas>
      </Suspense>
    </div>
  );
};
