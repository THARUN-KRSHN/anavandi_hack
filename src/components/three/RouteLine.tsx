import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RouteLineProps {
  simplified?: boolean;
}

export const RouteLine: React.FC<RouteLineProps> = ({ simplified = false }) => {
  const lineRef = useRef<THREE.Line>(null);
  const nodeRef = useRef<THREE.Mesh>(null);

  // Create smooth curved transit route path along the ground plane
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.5, 0.02, 2.2),
    new THREE.Vector3(-1.8, 0.02, 1.6),
    new THREE.Vector3(0.2, 0.02, 0.8),
    new THREE.Vector3(1.8, 0.02, -0.6),
    new THREE.Vector3(3.5, 0.02, -2.2),
  ]);

  const points = curve.getPoints(simplified ? 24 : 60);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    if (nodeRef.current) {
      const t = (state.clock.getElapsedTime() * 0.22) % 1;
      const point = curve.getPoint(t);
      nodeRef.current.position.set(point.x, point.y + 0.06, point.z);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Curved Route Track */}
      {/* @ts-expect-error R3F primitive line elements */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color="#D92D20" linewidth={3} transparent opacity={0.65} />
      </line>

      {/* Moving Transit Node Indicator */}
      <mesh ref={nodeRef} position={[-3.5, 0.08, 2.2]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#16A34A"
          emissive="#16A34A"
          emissiveIntensity={2.0}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};
