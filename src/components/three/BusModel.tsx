import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BusModelProps {
  simplified?: boolean;
}

export const BusModel: React.FC<BusModelProps> = ({ simplified = false }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate dynamic canvas textures for destination board and license plates
  const { destinationTexture, frontPlateTexture, rearPlateTexture } = useMemo(() => {
    // 1. Destination Board Texture ("KSRTC - BUS SAHAYI")
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 512;
    destCanvas.height = 128;
    const destCtx = destCanvas.getContext('2d')!;
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, 512, 128);
    // Red border
    destCtx.strokeStyle = '#BA181B';
    destCtx.lineWidth = 10;
    destCtx.strokeRect(5, 5, 502, 118);
    // Bold KSRTC header
    destCtx.fillStyle = '#BA181B';
    destCtx.font = '900 58px system-ui, -apple-system, sans-serif';
    destCtx.textAlign = 'center';
    destCtx.textBaseline = 'middle';
    destCtx.fillText('KSRTC', 256, 42);
    // Sub-text: FAST PASSENGER • BUS SAHAYI
    destCtx.fillStyle = '#171717';
    destCtx.font = '700 24px system-ui, -apple-system, sans-serif';
    destCtx.fillText('FAST PASSENGER • BUS SAHAYI', 256, 92);
    const destTex = new THREE.CanvasTexture(destCanvas);

    // 2. Kerala Registration Front Plate ("KL 15 A 2026")
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 256;
    plateCanvas.height = 64;
    const plateCtx = plateCanvas.getContext('2d')!;
    plateCtx.fillStyle = '#FBBF24';
    plateCtx.fillRect(0, 0, 256, 64);
    plateCtx.strokeStyle = '#171717';
    plateCtx.lineWidth = 6;
    plateCtx.strokeRect(3, 3, 250, 58);
    plateCtx.fillStyle = '#171717';
    plateCtx.font = '900 32px monospace';
    plateCtx.textAlign = 'center';
    plateCtx.textBaseline = 'middle';
    plateCtx.fillText('KL 15 A 2026', 128, 33);
    const plateTex = new THREE.CanvasTexture(plateCanvas);

    // 3. Rear Plate
    const rearTex = plateTex.clone();
    rearTex.needsUpdate = true;

    return {
      destinationTexture: destTex,
      frontPlateTexture: plateTex,
      rearPlateTexture: rearTex,
    };
  }, []);

  // Subtle floating motion & gentle idle suspension vibration
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle floating suspension motion
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.025;
      // Subtle idle rocking
      groupRef.current.rotation.z = Math.sin(t * 1.8) * 0.005;
    }
  });

  // Colors based on KSRTC Fast Passenger livery
  const KSRTC_RED = '#BA181B';
  const KSRTC_YELLOW = '#F5BE23';
  const KSRTC_CREAM = '#F8D260';
  const DARK_GLASS = '#0F172A';
  const RUBBER_BLACK = '#1E242B';
  const CHROME_METAL = '#E2E8F0';
  const STEEL_RIM = '#374151';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ========================================================
          1. CONTACT SHADOW UNDER BUS
      ======================================================== */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 4.8]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* ========================================================
          2. LOWER CHASSIS & RED BODY (KSRTC VIBRANT RED)
      ======================================================== */}
      {/* Main Red Lower Body */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[1.5, 0.58, 4.3]} />
        <meshStandardMaterial color={KSRTC_RED} roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Lower Front Nose Taper / Bevel */}
      <mesh position={[0, 0.42, 2.17]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[1.49, 0.42, 0.16]} />
        <meshStandardMaterial color={KSRTC_RED} roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Signature KSRTC Yellow Swoosh on flanks */}
      {!simplified && (
        <>
          {/* Left Swoosh */}
          <mesh position={[-0.755, 0.62, 0.1]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.01, 0.32, 2.4]} />
            <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[-0.755, 0.48, -0.6]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.01, 0.22, 1.4]} />
            <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} metalness={0.1} />
          </mesh>

          {/* Right Swoosh */}
          <mesh position={[0.755, 0.62, 0.1]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.01, 0.32, 2.4]} />
            <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0.755, 0.48, -0.6]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.01, 0.22, 1.4]} />
            <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} metalness={0.1} />
          </mesh>
        </>
      )}

      {/* Heavy-duty Front Bumper */}
      <mesh position={[0, 0.2, 2.22]}>
        <boxGeometry args={[1.54, 0.18, 0.16]} />
        <meshStandardMaterial color={KSRTC_RED} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Front Bumper Silver / White Step Accent Bar */}
      <mesh position={[0, 0.2, 2.3]}>
        <boxGeometry args={[1.5, 0.04, 0.02]} />
        <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Front Registration Plate ("KL 15 A 2026") */}
      <mesh position={[0, 0.18, 2.32]}>
        <planeGeometry args={[0.42, 0.11]} />
        <meshBasicMaterial map={frontPlateTexture} transparent={false} />
      </mesh>

      {/* Rear Bumper */}
      <mesh position={[0, 0.2, -2.2]}>
        <boxGeometry args={[1.54, 0.18, 0.16]} />
        <meshStandardMaterial color={KSRTC_RED} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Rear Registration Plate */}
      <mesh position={[0, 0.2, -2.29]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.42, 0.11]} />
        <meshBasicMaterial map={rearPlateTexture} transparent={false} />
      </mesh>

      {/* Rear Mudflaps */}
      {!simplified && (
        <>
          <mesh position={[-0.56, 0.1, -1.6]}>
            <boxGeometry args={[0.28, 0.18, 0.02]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.9} />
          </mesh>
          <mesh position={[0.56, 0.1, -1.6]}>
            <boxGeometry args={[0.28, 0.18, 0.02]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.9} />
          </mesh>
        </>
      )}

      {/* ========================================================
          3. UPPER CABIN & ROOF (KSRTC SUN YELLOW)
      ======================================================== */}
      {/* Upper Passenger Cabin Shell */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[1.48, 0.58, 4.28]} />
        <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.28} metalness={0.1} />
      </mesh>

      {/* Curved Roof Crown */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[1.44, 0.1, 4.26]} />
        <meshStandardMaterial color={KSRTC_CREAM} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.44, 0]}>
        <boxGeometry args={[1.32, 0.06, 4.15]} />
        <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Roof Ventilation Cowls */}
      {!simplified && (
        <>
          <mesh position={[0, 1.49, 0.6]}>
            <boxGeometry args={[0.35, 0.05, 0.4]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.49, -1.4]}>
            <boxGeometry args={[0.35, 0.05, 0.4]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Roof Luggage Carrier (Tubular Metal Rails) */}
      {!simplified && (
        <group position={[0, 1.5, -0.4]}>
          {/* Left Rail */}
          <mesh position={[-0.56, 0.06, 0]}>
            <boxGeometry args={[0.03, 0.1, 2.2]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Right Rail */}
          <mesh position={[0.56, 0.06, 0]}>
            <boxGeometry args={[0.03, 0.1, 2.2]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Front Cross Rail */}
          <mesh position={[0, 0.06, 1.1]}>
            <boxGeometry args={[1.15, 0.1, 0.03]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Back Cross Rail */}
          <mesh position={[0, 0.06, -1.1]}>
            <boxGeometry args={[1.15, 0.1, 0.03]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Slat cross bars */}
          {[-0.7, -0.35, 0, 0.35, 0.7].map((zPos, idx) => (
            <mesh key={idx} position={[0, 0.02, zPos]}>
              <boxGeometry args={[1.1, 0.02, 0.04]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Rear Ladder connecting to luggage carrier */}
      {!simplified && (
        <group position={[0.42, 0.85, -2.18]}>
          <mesh position={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 1.15, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 1.15, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {[-0.45, -0.25, -0.05, 0.15, 0.35, 0.5].map((yPos, i) => (
            <mesh key={i} position={[0, yPos, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* ========================================================
          4. FRONT FASCIA & ICONIC DETAILS (MATCHING IMAGE)
      ======================================================== */}
      {/* Front Destination Display Board (Prominent KSRTC Lightbox) */}
      <group position={[0, 1.28, 2.16]}>
        {/* Box Shell */}
        <mesh>
          <boxGeometry args={[1.12, 0.24, 0.1]} />
          <meshStandardMaterial color={KSRTC_YELLOW} roughness={0.3} />
        </mesh>
        {/* Lighted Face with Destination Texture */}
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[1.06, 0.2]} />
          <meshBasicMaterial map={destinationTexture} />
        </mesh>
        {/* Curved Sun Brow / Rain Visor over destination box */}
        <mesh position={[0, 0.14, 0.06]}>
          <boxGeometry args={[1.18, 0.04, 0.14]} />
          <meshStandardMaterial color={KSRTC_CREAM} roughness={0.25} />
        </mesh>
      </group>

      {/* Split Front Windshield (Dual Glass Panes + Center Pillar) */}
      <group position={[0, 0.94, 2.16]}>
        {/* Left Windshield Pane */}
        <mesh position={[-0.35, 0, 0]}>
          <planeGeometry args={[0.66, 0.42]} />
          <meshStandardMaterial
            color={DARK_GLASS}
            roughness={0.08}
            metalness={0.4}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Right Windshield Pane */}
        <mesh position={[0.35, 0, 0]}>
          <planeGeometry args={[0.66, 0.42]} />
          <meshStandardMaterial
            color={DARK_GLASS}
            roughness={0.08}
            metalness={0.4}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Center Vertical Divider Pillar */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.06, 0.44, 0.04]} />
          <meshStandardMaterial color={RUBBER_BLACK} roughness={0.7} />
        </mesh>
        {/* Windshield Rubber Beading Frame */}
        <mesh position={[0, -0.22, 0.01]}>
          <boxGeometry args={[1.42, 0.03, 0.03]} />
          <meshStandardMaterial color={RUBBER_BLACK} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.22, 0.01]}>
          <boxGeometry args={[1.42, 0.03, 0.03]} />
          <meshStandardMaterial color={RUBBER_BLACK} roughness={0.7} />
        </mesh>

        {/* Windshield Wiper Blades */}
        {!simplified && (
          <>
            <mesh position={[-0.32, -0.15, 0.02]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.26, 0.015, 0.01]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
            <mesh position={[0.38, -0.15, 0.02]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.26, 0.015, 0.01]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
          </>
        )}
      </group>

      {/* Front Radiator Grille & Central Emblem */}
      <group position={[0, 0.48, 2.22]}>
        {/* Grille Black Backing */}
        <mesh>
          <boxGeometry args={[0.72, 0.28, 0.04]} />
          <meshStandardMaterial color="#111827" roughness={0.9} />
        </mesh>
        {/* Silver Horizontal Grille Slats */}
        {[-0.09, -0.03, 0.03, 0.09].map((yPos, i) => (
          <mesh key={i} position={[0, yPos, 0.025]}>
            <boxGeometry args={[0.68, 0.018, 0.02]} />
            <meshStandardMaterial color={CHROME_METAL} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* Center KSRTC Emblem Badge */}
        <mesh position={[0, 0.01, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
          <meshStandardMaterial color={CHROME_METAL} metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Dual Round Headlights on each side (Classic KSRTC Double Barrel) */}
      {/* Left Headlight Cluster */}
      <group position={[-0.54, 0.46, 2.22]}>
        {/* Outer Round Headlight */}
        <mesh position={[-0.07, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          <meshStandardMaterial color={CHROME_METAL} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.07, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.01, 16]} />
          <meshStandardMaterial
            color="#FFFBEB"
            emissive="#FEF08A"
            emissiveIntensity={1.4}
            roughness={0.1}
          />
        </mesh>

        {/* Inner Round Headlight */}
        <mesh position={[0.07, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color={CHROME_METAL} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.07, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.01, 16]} />
          <meshStandardMaterial
            color="#FFFBEB"
            emissive="#FEF08A"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>

        {/* Amber Round Indicator */}
        <mesh position={[-0.07, -0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Right Headlight Cluster */}
      <group position={[0.54, 0.46, 2.22]}>
        {/* Inner Round Headlight */}
        <mesh position={[-0.07, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color={CHROME_METAL} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.07, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.01, 16]} />
          <meshStandardMaterial
            color="#FFFBEB"
            emissive="#FEF08A"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>

        {/* Outer Round Headlight */}
        <mesh position={[0.07, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
          <meshStandardMaterial color={CHROME_METAL} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.07, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.01, 16]} />
          <meshStandardMaterial
            color="#FFFBEB"
            emissive="#FEF08A"
            emissiveIntensity={1.4}
            roughness={0.1}
          />
        </mesh>

        {/* Amber Round Indicator */}
        <mesh position={[0.07, -0.09, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Side Mirrors on Forward Tubular Stalks */}
      {!simplified && (
        <>
          {/* Left Mirror */}
          <group position={[-0.82, 0.96, 2.0]}>
            {/* Top Arm */}
            <mesh position={[0.04, 0.06, 0.06]} rotation={[0, 0.3, 0.2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
            {/* Bottom Arm */}
            <mesh position={[0.04, -0.06, 0.06]} rotation={[0, 0.3, -0.2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
            {/* Mirror Housing */}
            <mesh position={[-0.02, 0, 0.14]}>
              <boxGeometry args={[0.04, 0.26, 0.1]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
            {/* Mirror Reflective Face */}
            <mesh position={[-0.041, 0, 0.14]}>
              <planeGeometry args={[0.08, 0.24]} />
              <meshStandardMaterial color={CHROME_METAL} metalness={0.95} roughness={0.05} />
            </mesh>
          </group>

          {/* Right Mirror */}
          <group position={[0.82, 0.96, 2.0]}>
            {/* Top Arm */}
            <mesh position={[-0.04, 0.06, 0.06]} rotation={[0, -0.3, -0.2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
            {/* Bottom Arm */}
            <mesh position={[-0.04, -0.06, 0.06]} rotation={[0, -0.3, 0.2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
            {/* Mirror Housing */}
            <mesh position={[0.02, 0, 0.14]}>
              <boxGeometry args={[0.04, 0.26, 0.1]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
            {/* Mirror Reflective Face */}
            <mesh position={[0.041, 0, 0.14]}>
              <planeGeometry args={[0.08, 0.24]} />
              <meshStandardMaterial color={CHROME_METAL} metalness={0.95} roughness={0.05} />
            </mesh>
          </group>
        </>
      )}

      {/* ========================================================
          5. SIDE WINDOWS (ROW OF 7 PASSENGER WINDOWS)
      ======================================================== */}
      {/* Left Side Windows */}
      <group position={[-0.75, 1.05, 0]}>
        {[-1.6, -1.1, -0.6, -0.1, 0.4, 0.9, 1.4].map((zPos, idx) => (
          <group key={`left-win-${idx}`} position={[0, 0, zPos]}>
            {/* Aluminum Window Frame */}
            <mesh position={[-0.005, 0, 0]}>
              <boxGeometry args={[0.02, 0.38, 0.44]} />
              <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Glass Pane */}
            <mesh position={[-0.01, 0, 0]}>
              <boxGeometry args={[0.01, 0.32, 0.4]} />
              <meshStandardMaterial
                color={DARK_GLASS}
                roughness={0.1}
                metalness={0.3}
                transparent
                opacity={0.82}
              />
            </mesh>
            {/* Horizontal Frame Divider Bar */}
            <mesh position={[-0.016, 0, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.4]} />
              <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Side Windows */}
      <group position={[0.75, 1.05, 0]}>
        {[-1.6, -1.1, -0.6, -0.1, 0.4, 0.9, 1.4].map((zPos, idx) => (
          <group key={`right-win-${idx}`} position={[0, 0, zPos]}>
            {/* Aluminum Window Frame */}
            <mesh position={[0.005, 0, 0]}>
              <boxGeometry args={[0.02, 0.38, 0.44]} />
              <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Glass Pane */}
            <mesh position={[0.01, 0, 0]}>
              <boxGeometry args={[0.01, 0.32, 0.4]} />
              <meshStandardMaterial
                color={DARK_GLASS}
                roughness={0.1}
                metalness={0.3}
                transparent
                opacity={0.82}
              />
            </mesh>
            {/* Horizontal Frame Divider Bar */}
            <mesh position={[0.016, 0, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.4]} />
              <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================
          6. REAR DETAILS
      ======================================================== */}
      {/* Rear Window */}
      <mesh position={[0, 1.05, -2.15]}>
        <boxGeometry args={[1.15, 0.4, 0.04]} />
        <meshStandardMaterial
          color={DARK_GLASS}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Rear Window Rubber Beading */}
      <mesh position={[0, 1.05, -2.14]}>
        <boxGeometry args={[1.2, 0.44, 0.02]} />
        <meshStandardMaterial color={RUBBER_BLACK} roughness={0.8} />
      </mesh>

      {/* Triple Vertical Tail Light Clusters (Brake, Indicator, Reverse) */}
      {/* Left Tail Lamp */}
      <group position={[-0.58, 0.52, -2.16]}>
        {/* Red Brake Light */}
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#DC2626" emissive="#EF4444" emissiveIntensity={0.8} />
        </mesh>
        {/* Amber Indicator */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.6} />
        </mesh>
        {/* White Reverse Lamp */}
        <mesh position={[0, -0.09, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#F8FAFC" emissive="#F8FAFC" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Right Tail Lamp */}
      <group position={[0.58, 0.52, -2.16]}>
        {/* Red Brake Light */}
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#DC2626" emissive="#EF4444" emissiveIntensity={0.8} />
        </mesh>
        {/* Amber Indicator */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.6} />
        </mesh>
        {/* White Reverse Lamp */}
        <mesh position={[0, -0.09, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#F8FAFC" emissive="#F8FAFC" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ========================================================
          7. WHEELS & RUNNING GEAR (FRONT SINGLES + REAR DUALS)
      ======================================================== */}
      <group>
        {/* Front Left Wheel */}
        <group position={[-0.74, 0.24, 1.25]} rotation={[0, 0, Math.PI / 2]}>
          {/* Black Rubber Tire */}
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.16, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Steel Rim */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.17, 24]} />
            <meshStandardMaterial color={STEEL_RIM} roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Chrome Axle Hub */}
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        {/* Front Right Wheel */}
        <group position={[0.74, 0.24, 1.25]} rotation={[0, 0, -Math.PI / 2]}>
          {/* Black Rubber Tire */}
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.16, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Steel Rim */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.17, 24]} />
            <meshStandardMaterial color={STEEL_RIM} roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Chrome Axle Hub */}
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        {/* Rear Left Dual Wheels (Paired Commercial Bus Tires) */}
        <group position={[-0.72, 0.24, -1.25]} rotation={[0, 0, Math.PI / 2]}>
          {/* Outer Tire */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Inner Tire */}
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Heavy Rim & Hub */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.18, 24]} />
            <meshStandardMaterial color={STEEL_RIM} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>

        {/* Rear Right Dual Wheels (Paired Commercial Bus Tires) */}
        <group position={[0.72, 0.24, -1.25]} rotation={[0, 0, -Math.PI / 2]}>
          {/* Outer Tire */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Inner Tire */}
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 24]} />
            <meshStandardMaterial color={RUBBER_BLACK} roughness={0.85} />
          </mesh>
          {/* Heavy Rim & Hub */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.18, 24]} />
            <meshStandardMaterial color={STEEL_RIM} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
            <meshStandardMaterial color={CHROME_METAL} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
