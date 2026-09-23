import React from 'react';
import { BusModel } from './BusModel';

export const DepotScene: React.FC = () => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Depot Ground Platform */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.8} />
      </mesh>

      {/* Depot Terminal Building */}
      <mesh position={[0, 0.8, -1.3]}>
        <boxGeometry args={[4.5, 1.6, 1.0]} />
        <meshStandardMaterial color="#374151" roughness={0.4} />
      </mesh>

      {/* Building Canopy Roof */}
      <mesh position={[0, 1.65, -0.5]}>
        <boxGeometry args={[5.0, 0.1, 2.4]} />
        <meshStandardMaterial color="#D92D20" roughness={0.3} />
      </mesh>

      {/* Parked Bus 1 */}
      <group position={[-1.4, 0, 0.5]} rotation={[0, 0, 0]}>
        <BusModel simplified />
      </group>

      {/* Parked Bus 2 */}
      <group position={[1.4, 0, 0.5]} rotation={[0, 0, 0]}>
        <BusModel simplified />
      </group>
    </group>
  );
};
