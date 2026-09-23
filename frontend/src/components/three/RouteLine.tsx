import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RouteLineProps {
  simplified?: boolean;
}

export const RouteLine: React.FC<RouteLineProps> = ({ simplified = false }) => {
  const lineRef = useRef<THREE.Line>(null);
  const nodeRef = useRef<THREE.Mesh>(null);

  // Create smooth curved path
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, -0.4, 2),
    new THREE.Vector3(-1.5, -0.3, 0.5),
    new THREE.Vector3(0, -0.2, 0),
    new THREE.Vector3(1.5, -0.3, -0.8),
    new THREE.Vector3(3, -0.4, -2),
  ]);

  const points = curve.getPoints(simplified ? 20 : 50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    if (nodeRef.current) {
      const t = (state.clock.getElapsedTime() * 0.25) % 1;
      const point = curve.getPoint(t);
      nodeRef.current.position.set(point.x, point.y + 0.1, point.z);
    }
  });

  return (
    <group>
      {/* 3D Curved Route Track */}
      {/* @ts-expect-error R3F primitive line elements */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color="#D92D20" linewidth={3} transparent opacity={0.7} />
      </line>

      {/* Moving Node Indicator */}
      <mesh ref={nodeRef} position={[-3, -0.3, 2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#16A34A" emissive="#16A34A" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
};
