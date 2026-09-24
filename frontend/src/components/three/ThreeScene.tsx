import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
    <div className="w-full h-full min-h-[260px] relative pointer-events-auto select-none rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing">
      <Suspense fallback={<WebGLFallback />}>
        <Canvas
          dpr={compact ? [1, 1.25] : [1, 1.5]}
          camera={{
            // 3/4 perspective matching KSRTC Fast Passenger hero view with comfortable margins
            position: type === 'depot_overview' ? [0, 3, 6] : [4.5, 2.2, 4.8],
            fov: compact ? 42 : 36,
          }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          className="w-full h-full"
        >
          {/* Natural Outdoor Transit Lighting */}
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 8, 5]} intensity={1.7} />
          <directionalLight position={[-4, 4, -3]} intensity={0.6} color="#E0F2FE" />
          <pointLight position={[1, 1.2, 3]} intensity={0.7} color="#FEF08A" />

          {/* Interactive Smooth Orbit Controls (Centered on bus core, zoom disabled to protect page scroll) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            target={[0, 0.25, 0]}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={true}
            autoRotateSpeed={0.5}
            dampingFactor={0.05}
          />

          {type === 'bus_hero' && (
            <group position={[0, -0.32, 0]} scale={0.70}>
              <BusModel simplified={compact} />
              <RouteLine simplified={compact} />
            </group>
          )}

          {type === 'route_success' && (
            <group position={[0, -0.32, 0]} scale={0.70}>
              <BusModel simplified={compact} />
              <RouteLine simplified={compact} />
            </group>
          )}

          {type === 'depot_overview' && <DepotScene />}
        </Canvas>
      </Suspense>
    </div>
  );
};
