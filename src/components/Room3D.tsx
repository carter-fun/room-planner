'use client';

import * as THREE from 'three';
import { useRoomStore } from '@/store/roomStore';
import { Grid } from '@react-three/drei';

export function Room3D() {
  const { roomDimensions, showGrid, gridSize } = useRoomStore();
  const { width, length, height } = roomDimensions;
  
  const wallThickness = 0.08;
  
  // Warm, inviting color palette inspired by real interiors
  const floorColor = '#d4c8b8';        // Warm light wood
  const backWallColor = '#f5f0e8';     // Warm white
  const sideWallColor = '#f0ebe3';     // Slightly warmer for depth
  const baseboardColor = '#c4b8a8';    // Warm wood trim
  const cornerColor = '#e8e2d8';       // Soft accent
  
  return (
    <group>
      {/* Floor with subtle wood-like appearance */}
      {/* receiveShadow removed - ContactShadows handles shadows independently */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial 
          color={floorColor}
          roughness={0.8}
          metalness={0}
        />
      </mesh>
      
      {/* Grid overlay - subtle */}
      {showGrid && (
        <Grid
          position={[0, 0.003, 0]}
          args={[width, length]}
          cellSize={gridSize}
          cellThickness={0.4}
          cellColor="#c4b8a8"
          sectionSize={1}
          sectionThickness={0.8}
          sectionColor="#b8a898"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}
      
      {/* Back wall (negative Z) */}
      <mesh 
        position={[0, height / 2, -length / 2]}
        receiveShadow
      >
        <boxGeometry args={[width + wallThickness * 2, height, wallThickness]} />
        <meshStandardMaterial 
          color={backWallColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Left wall (negative X) */}
      <mesh 
        position={[-width / 2, height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[wallThickness, height, length]} />
        <meshStandardMaterial 
          color={sideWallColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Right wall (positive X) */}
      <mesh 
        position={[width / 2, height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[wallThickness, height, length]} />
        <meshStandardMaterial 
          color={sideWallColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Front corner posts - for visual anchoring */}
      <mesh position={[-width / 2, height / 2, length / 2]}>
        <boxGeometry args={[wallThickness * 1.5, height, wallThickness * 1.5]} />
        <meshStandardMaterial color={cornerColor} roughness={0.85} />
      </mesh>
      
      <mesh position={[width / 2, height / 2, length / 2]}>
        <boxGeometry args={[wallThickness * 1.5, height, wallThickness * 1.5]} />
        <meshStandardMaterial color={cornerColor} roughness={0.85} />
      </mesh>
      
      {/* Baseboards - adds realism */}
      {/* Back baseboard */}
      <mesh position={[0, 0.04, -length / 2 + wallThickness / 2 + 0.02]}>
        <boxGeometry args={[width, 0.08, 0.025]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.7} />
      </mesh>
      
      {/* Left baseboard */}
      <mesh position={[-width / 2 + wallThickness / 2 + 0.02, 0.04, 0]}>
        <boxGeometry args={[0.025, 0.08, length]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.7} />
      </mesh>
      
      {/* Right baseboard */}
      <mesh position={[width / 2 - wallThickness / 2 - 0.02, 0.04, 0]}>
        <boxGeometry args={[0.025, 0.08, length]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.7} />
      </mesh>
      
      {/* Crown molding - top of walls */}
      {/* Back crown */}
      <mesh position={[0, height - 0.03, -length / 2 + wallThickness / 2 + 0.015]}>
        <boxGeometry args={[width + wallThickness, 0.06, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      
      {/* Left crown */}
      <mesh position={[-width / 2 + wallThickness / 2 + 0.015, height - 0.03, 0]}>
        <boxGeometry args={[0.02, 0.06, length]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      
      {/* Right crown */}
      <mesh position={[width / 2 - wallThickness / 2 - 0.015, height - 0.03, 0]}>
        <boxGeometry args={[0.02, 0.06, length]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      
      {/* Subtle floor edge shadow catcher */}
      <mesh position={[0, 0.001, length / 2]} receiveShadow>
        <boxGeometry args={[width + wallThickness * 2, 0.002, 0.1]} />
        <meshStandardMaterial color="#c8bfb0" roughness={1} />
      </mesh>
    </group>
  );
}
