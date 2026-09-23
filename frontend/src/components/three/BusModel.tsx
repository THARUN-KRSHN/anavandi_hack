import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BusModelProps {
  simplified?: boolean;
}

export const BusModel: React.FC<BusModelProps> = ({ simplified = false }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle floating motion
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Lower Bus Chassis (KSRTC Red) */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.4, 0.7, 2.8]} />
        <meshStandardMaterial color="#D92D20" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Upper Cabin Roof (White) */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.38, 0.35, 2.75]} />
        <meshStandardMaterial color="#F9FAFB" roughness={0.2} />
      </mesh>

      {/* Front Windshield */}
      <mesh position={[0, 0.85, 1.38]}>
        <boxGeometry args={[1.3, 0.45, 0.05]} />
        <meshStandardMaterial color="#1E293B" roughness={0.1} transparent opacity={0.85} />
      </mesh>

      {/* Side Windows */}
      {!simplified && (
        <>
          {/* Left Windows */}
          <mesh position={[-0.71, 0.85, 0]}>
            <boxGeometry args={[0.05, 0.35, 2.2]} />
            <meshStandardMaterial color="#334155" transparent opacity={0.8} />
          </mesh>
          {/* Right Windows */}
          <mesh position={[0.71, 0.85, 0]}>
            <boxGeometry args={[0.05, 0.35, 2.2]} />
            <meshStandardMaterial color="#334155" transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {/* Destination Display Board */}
      <mesh position={[0, 1.15, 1.35]}>
        <boxGeometry args={[1.0, 0.15, 0.08]} />
        <meshStandardMaterial color="#111827" emissive="#16A34A" emissiveIntensity={0.6} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.5, 0.35, 1.41]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.5, 0.35, 1.41]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={1.2} />
      </mesh>

      {/* Wheels */}
      {/* Front Left */}
      <mesh position={[-0.68, 0.18, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      {/* Front Right */}
      <mesh position={[0.68, 0.18, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>

      {/* Rear Left */}
      <mesh position={[-0.68, 0.18, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
      {/* Rear Right */}
      <mesh position={[0.68, 0.18, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#1F2937" roughness={0.8} />
      </mesh>
    </group>
  );
};
