'use client';

import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { FurnitureType, BookOrientation } from '@/store/roomStore';

// Ghibli/cozy aesthetic constants - matte clay-like finish
const COZY_ROUGHNESS = 0.92;
const COZY_METALNESS = 0.05;

interface FurnitureModelProps {
  type: FurnitureType;
  dimensions: { width: number; height: number; depth: number };
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  // Book-specific properties
  orientation?: BookOrientation;
  spineColor?: string;
  sizeVariant?: number;
}

// Helper to get highlight color
function getHighlightColor(color: string, isSelected: boolean, isHovered: boolean): string {
  if (isSelected) return '#007AFF';
  if (isHovered) return '#5AC8FA';
  return color;
}

// Bed model with headboard and mattress
function BedModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const frameHeight = height * 0.4;
  const mattressHeight = height * 0.3;
  const headboardHeight = height * 0.6;
  
  const frameColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, frameHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameHeight, depth]} />
        <meshStandardMaterial color={frameColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, frameHeight + mattressHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.95, mattressHeight, depth * 0.95]} />
        <meshStandardMaterial color={isSelected ? '#a0c4ff' : isHovered ? '#c0d8ff' : '#f0f0f0'} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, frameHeight + headboardHeight / 2, -depth / 2 + 0.05]} castShadow receiveShadow>
        <boxGeometry args={[width, headboardHeight, 0.1]} />
        <meshStandardMaterial color={frameColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
    </group>
  );
}

// Desk model with legs and surface
function DeskModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const topThickness = 0.04;
  const legWidth = 0.05;
  
  const deskColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  const legColor = isSelected ? '#005bb5' : isHovered ? '#4090c0' : '#4a4a4a';
  
  return (
    <group>
      {/* Desktop surface */}
      <mesh position={[0, height - topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={deskColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - legWidth), (height - topThickness) / 2, z * (depth / 2 - legWidth)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[legWidth, height - topThickness, legWidth]} />
          <meshStandardMaterial color={legColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Chair model with seat, back, and legs
function ChairModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const seatHeight = height * 0.5;
  const seatThickness = 0.05;
  const backHeight = height * 0.45;
  const legWidth = 0.04;
  
  const chairColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  const legColor = isSelected ? '#005bb5' : isHovered ? '#4090c0' : '#3a3a3a';
  
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, seatThickness, depth]} />
        <meshStandardMaterial color={chairColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, seatHeight + backHeight / 2, -depth / 2 + 0.03]} castShadow receiveShadow>
        <boxGeometry args={[width, backHeight, 0.06]} />
        <meshStandardMaterial color={chairColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - legWidth), seatHeight / 2, z * (depth / 2 - legWidth)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[legWidth, seatHeight, legWidth]} />
          <meshStandardMaterial color={legColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Couch model with cushions and armrests
function CouchModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const baseHeight = height * 0.35;
  const cushionHeight = height * 0.25;
  const backHeight = height * 0.4;
  const armWidth = 0.15;
  
  const couchColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Base */}
      <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, baseHeight, depth]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Seat cushions */}
      <mesh position={[0, baseHeight + cushionHeight / 2, depth * 0.1]} castShadow receiveShadow>
        <boxGeometry args={[width - armWidth * 2, cushionHeight, depth * 0.7]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, baseHeight + backHeight / 2, -depth / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[width - armWidth * 2, backHeight, 0.2]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Armrests */}
      {[-1, 1].map((x, i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - armWidth / 2), baseHeight + cushionHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[armWidth, cushionHeight * 1.5, depth]} />
          <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Bookshelf model with shelves
function BookshelfModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const shelfCount = 4;
  const frameThickness = 0.025;
  
  const shelfColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, height / 2, -depth / 2 + frameThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, frameThickness]} />
        <meshStandardMaterial color={shelfColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Side panels */}
      {[-1, 1].map((x, i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - frameThickness / 2), height / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[frameThickness, height, depth]} />
          <meshStandardMaterial color={shelfColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
      {/* Shelves - empty, add your own books! */}
      {Array.from({ length: shelfCount + 1 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[0, (i / shelfCount) * height, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width - frameThickness * 2, frameThickness, depth]} />
          <meshStandardMaterial color={shelfColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Book model - single book with orientation support
function BookModel({ dimensions, color, isSelected, isHovered, orientation = 'upright', spineColor, sizeVariant = 1 }: Omit<FurnitureModelProps, 'type'>) {
  // Apply size variant to dimensions
  const scaledWidth = dimensions.width * sizeVariant;
  const scaledHeight = dimensions.height * sizeVariant;
  const scaledDepth = dimensions.depth * sizeVariant;
  
  // Use spine color if provided, otherwise fall back to the item color
  const coverColor = spineColor || color;
  const bookColor = isSelected || isHovered ? getHighlightColor(coverColor, isSelected, isHovered) : coverColor;
  const pagesColor = '#f5f5dc';
  
  // Different rendering based on orientation
  if (orientation === 'flat') {
    // Book laying flat (horizontal stack style)
    return (
      <group>
        {/* Book cover */}
        <mesh position={[0, scaledDepth / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[scaledWidth, scaledDepth, scaledHeight]} />
          <meshStandardMaterial color={bookColor} />
        </mesh>
        {/* Pages (side) */}
        <mesh position={[scaledWidth * 0.45, scaledDepth / 2, 0]} castShadow>
          <boxGeometry args={[scaledWidth * 0.08, scaledDepth * 0.95, scaledHeight * 0.95]} />
          <meshStandardMaterial color={pagesColor} />
        </mesh>
      </group>
    );
  }
  
  if (orientation === 'faceout') {
    // Book displayed face-out (showing cover art)
    return (
      <group>
        {/* Book cover - facing forward */}
        <mesh position={[0, scaledHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
          <meshStandardMaterial color={bookColor} />
        </mesh>
        {/* Cover art placeholder (lighter rectangle on front) */}
        <mesh position={[0, scaledHeight / 2, scaledDepth / 2 + 0.001]}>
          <boxGeometry args={[scaledWidth * 0.85, scaledHeight * 0.9, 0.002]} />
          <meshStandardMaterial color={isSelected ? '#a0c4ff' : '#e8e8e8'} />
        </mesh>
        {/* Spine accent */}
        <mesh position={[-scaledWidth / 2 - 0.001, scaledHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.003, scaledHeight, scaledDepth]} />
          <meshStandardMaterial color={bookColor} />
        </mesh>
      </group>
    );
  }
  
  // Default: upright (standing on spine)
  return (
    <group>
      {/* Book cover - standing upright, spine visible */}
      <mesh position={[0, scaledHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[scaledDepth, scaledHeight, scaledWidth]} />
        <meshStandardMaterial color={bookColor} />
      </mesh>
      {/* Spine detail band */}
      <mesh position={[-scaledDepth / 2 - 0.001, scaledHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.003, scaledHeight * 0.6, scaledWidth * 0.9]} />
        <meshStandardMaterial color={isSelected ? '#ffffff' : '#00000033'} transparent opacity={0.3} />
      </mesh>
      {/* Pages (visible from side) */}
      <mesh position={[scaledDepth * 0.4, scaledHeight / 2, 0]} castShadow>
        <boxGeometry args={[scaledDepth * 0.12, scaledHeight * 0.95, scaledWidth * 0.92]} />
        <meshStandardMaterial color={pagesColor} />
      </mesh>
    </group>
  );
}

// Book stack model - horizontal pile with random colors
function BookStackModel({ dimensions, color, isSelected, isHovered, spineColor, sizeVariant = 1 }: Omit<FurnitureModelProps, 'type'>) {
  const scaledWidth = dimensions.width * sizeVariant;
  const scaledHeight = dimensions.height * sizeVariant;
  const scaledDepth = dimensions.depth * sizeVariant;
  
  const baseColor = spineColor || color;
  const stackColor = isSelected || isHovered ? getHighlightColor(baseColor, isSelected, isHovered) : baseColor;
  // Varied colors for stacked books
  const bookColors = ['#1a1a2e', '#e94560', '#2ecc71', '#9b59b6', '#f39c12'];
  
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const bookHeight = scaledHeight / 4.5;
        const yPos = i * bookHeight * 1.05 + bookHeight / 2;
        const randomOffset = (i % 2) * 0.01 - 0.005;
        const bookColor = i === 0 ? stackColor : bookColors[i % bookColors.length];
        return (
          <group key={i}>
            <mesh position={[randomOffset, yPos, randomOffset]} rotation={[0, i * 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[scaledWidth * (0.95 - i * 0.04), bookHeight, scaledDepth * (0.98 - i * 0.02)]} />
              <meshStandardMaterial color={bookColor} />
            </mesh>
            {/* Pages edge */}
            <mesh position={[randomOffset + scaledWidth * 0.42, yPos, randomOffset]} rotation={[0, i * 0.08, 0]}>
              <boxGeometry args={[scaledWidth * 0.06, bookHeight * 0.9, scaledDepth * 0.85]} />
              <meshStandardMaterial color="#f5f5dc" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Manga model - thin book with orientation support  
function MangaModel({ dimensions, color, isSelected, isHovered, orientation = 'upright', spineColor, sizeVariant = 1 }: Omit<FurnitureModelProps, 'type'>) {
  const scaledWidth = dimensions.width * sizeVariant;
  const scaledHeight = dimensions.height * sizeVariant;
  const scaledDepth = dimensions.depth * sizeVariant;
  
  const coverColor = spineColor || color;
  const mangaColor = isSelected || isHovered ? getHighlightColor(coverColor, isSelected, isHovered) : coverColor;
  
  if (orientation === 'flat') {
    // Manga laying flat
    return (
      <group>
        <mesh position={[0, scaledDepth / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[scaledWidth, scaledDepth, scaledHeight]} />
          <meshStandardMaterial color={mangaColor} />
        </mesh>
        {/* Cover art hint */}
        <mesh position={[0, scaledDepth / 2 + 0.001, 0]}>
          <boxGeometry args={[scaledWidth * 0.9, 0.001, scaledHeight * 0.9]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
      </group>
    );
  }
  
  if (orientation === 'faceout') {
    // Manga displayed face-out
    return (
      <group>
        <mesh position={[0, scaledHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
          <meshStandardMaterial color={mangaColor} />
        </mesh>
        {/* Cover art placeholder */}
        <mesh position={[0, scaledHeight / 2, scaledDepth / 2 + 0.001]}>
          <boxGeometry args={[scaledWidth * 0.92, scaledHeight * 0.92, 0.001]} />
          <meshStandardMaterial color="#f8f8f8" />
        </mesh>
        {/* Volume number area */}
        <mesh position={[0, scaledHeight * 0.15, scaledDepth / 2 + 0.002]}>
          <boxGeometry args={[scaledWidth * 0.3, scaledHeight * 0.1, 0.001]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    );
  }
  
  // Default: upright
  return (
    <group>
      {/* Cover - standing upright */}
      <mesh position={[0, scaledHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[scaledDepth, scaledHeight, scaledWidth]} />
        <meshStandardMaterial color={mangaColor} />
      </mesh>
      {/* Spine label area */}
      <mesh position={[-scaledDepth / 2 - 0.001, scaledHeight * 0.4, 0]}>
        <boxGeometry args={[0.002, scaledHeight * 0.5, scaledWidth * 0.85]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
      {/* Pages */}
      <mesh position={[scaledDepth * 0.4, scaledHeight / 2, 0]} castShadow>
        <boxGeometry args={[scaledDepth * 0.1, scaledHeight * 0.95, scaledWidth * 0.95]} />
        <meshStandardMaterial color="#fffef5" />
      </mesh>
    </group>
  );
}

// Gojo Death Panel - the iconic JJK manga panel
function GojoMangaModel({ dimensions, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const texture = useTexture('/covers/gojo-death.png');
  
  return (
    <group>
      {/* Manga page body - white */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* The actual panel image on front */}
      <mesh position={[0, height / 2, depth / 2 + 0.001]}>
        <planeGeometry args={[width * 0.98, height * 0.98]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      {/* Panel image on back too */}
      <mesh position={[0, height / 2, -depth / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width * 0.98, height * 0.98]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      {/* Selection highlight border */}
      {(isSelected || isHovered) && (
        <mesh position={[0, height / 2, depth / 2 + 0.002]}>
          <planeGeometry args={[width * 1.02, height * 1.02]} />
          <meshBasicMaterial color={isSelected ? '#007AFF' : '#5AC8FA'} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// KAWS Companion Figure - proper proportions with capsule ears and X eyes
function KawsFigureModel({ dimensions, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { height } = dimensions;
  
  const grey = isSelected ? '#007AFF' : isHovered ? '#5AC8FA' : '#4a4a4a';
  const darkGrey = isSelected ? '#005ACC' : isHovered ? '#4AA8DA' : '#3a3a3a';
  const lightGrey = isSelected ? '#339AFF' : isHovered ? '#7AD8FA' : '#BDBDBD';
  
  const s = height * 0.4; // Scale factor
  
  return (
    <group scale={[s, s, s]}>
      {/* ============ HEAD ============ */}
      <group position={[0, 0.32, 0]}>
        {/* Skull - wide bean shape */}
        <mesh scale={[1.3, 1, 1]} castShadow>
          <sphereGeometry args={[0.07, 64, 64]} />
          <meshStandardMaterial color={grey} roughness={0.4} />
        </mesh>
        
        {/* Left Ear - bulbous bone lobe */}
        <mesh position={[-0.085, 0.02, 0]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.025, 0.05, 8, 32]} />
          <meshStandardMaterial color={grey} roughness={0.4} />
        </mesh>
        
        {/* Right Ear - bulbous bone lobe */}
        <mesh position={[0.085, 0.02, 0]} rotation={[0, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.025, 0.05, 8, 32]} />
          <meshStandardMaterial color={grey} roughness={0.4} />
        </mesh>
        
        {/* Left X Eye */}
        <group position={[-0.03, 0.01, 0.06]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <capsuleGeometry args={[0.006, 0.025, 4, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <capsuleGeometry args={[0.006, 0.025, 4, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
        
        {/* Right X Eye */}
        <group position={[0.03, 0.01, 0.06]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <capsuleGeometry args={[0.006, 0.025, 4, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <capsuleGeometry args={[0.006, 0.025, 4, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      </group>
      
      {/* ============ BODY ============ */}
      {/* Torso - lighter grey */}
      <mesh position={[0, 0.19, 0]} castShadow>
        <capsuleGeometry args={[0.045, 0.06, 16, 32]} />
        <meshStandardMaterial color={lightGrey} roughness={0.4} />
      </mesh>
      
      {/* Shorts - darker */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <capsuleGeometry args={[0.048, 0.03, 16, 32]} />
        <meshStandardMaterial color={darkGrey} roughness={0.4} />
      </mesh>
      {/* Shorts buttons */}
      <mesh position={[-0.02, 0.11, 0.042]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color={lightGrey} roughness={0.4} />
      </mesh>
      <mesh position={[0.02, 0.11, 0.042]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color={lightGrey} roughness={0.4} />
      </mesh>
      
      {/* ============ ARMS ============ */}
      {/* Left Arm */}
      <mesh position={[-0.065, 0.18, 0]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.018, 0.06, 8, 16]} />
        <meshStandardMaterial color={grey} roughness={0.4} />
      </mesh>
      {/* Left Hand */}
      <mesh position={[-0.09, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.028, 32, 32]} />
        <meshStandardMaterial color={lightGrey} roughness={0.4} />
      </mesh>
      
      {/* Right Arm */}
      <mesh position={[0.065, 0.18, 0]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.018, 0.06, 8, 16]} />
        <meshStandardMaterial color={grey} roughness={0.4} />
      </mesh>
      {/* Right Hand */}
      <mesh position={[0.09, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.028, 32, 32]} />
        <meshStandardMaterial color={lightGrey} roughness={0.4} />
      </mesh>
      
      {/* ============ LEGS ============ */}
      {/* Left Leg */}
      <mesh position={[-0.025, 0.05, 0]} castShadow>
        <capsuleGeometry args={[0.02, 0.05, 8, 16]} />
        <meshStandardMaterial color={grey} roughness={0.4} />
      </mesh>
      {/* Left Foot */}
      <mesh position={[-0.025, 0.01, 0.01]} castShadow>
        <sphereGeometry args={[0.025, 32, 32]} />
        <meshStandardMaterial color={darkGrey} roughness={0.4} />
      </mesh>
      
      {/* Right Leg */}
      <mesh position={[0.025, 0.05, 0]} castShadow>
        <capsuleGeometry args={[0.02, 0.05, 8, 16]} />
        <meshStandardMaterial color={grey} roughness={0.4} />
      </mesh>
      {/* Right Foot */}
      <mesh position={[0.025, 0.01, 0.01]} castShadow>
        <sphereGeometry args={[0.025, 32, 32]} />
        <meshStandardMaterial color={darkGrey} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Murakami Flower Plushie - soft velvet plush with high-poly smooth geometry
function MurakamiFlowerModel({ dimensions, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  
  // Murakami-accurate petal colors
  const petalColors = [
    '#F48FB1', // Pink
    '#EC7063', // Red  
    '#F5B041', // Orange
    '#F7DC6F', // Light Yellow
    '#ABEBC6', // Light green
    '#58D68D', // Green
    '#76D7C4', // Teal
    '#5DADE2', // Blue
    '#85C1E9', // Light blue
    '#A569BD', // Purple
    '#2C3E50', // Dark navy
    '#FAD7A0', // Cream
  ];
  
  const petalCount = 12;
  const petalRadius = width * 0.22;
  const centerRadius = width * 0.32;
  const flowerRadius = width * 0.38;
  const puffHeight = height * 0.8;
  
  return (
    <group>
      {/* Petals arranged in a circle - high poly with velvet sheen */}
      {petalColors.map((color, i) => {
        const angle = (i / petalCount) * Math.PI * 2;
        const x = Math.cos(angle) * flowerRadius;
        const z = Math.sin(angle) * flowerRadius;
        return (
          <mesh 
            key={i} 
            position={[x, puffHeight / 2, z]} 
            castShadow 
            receiveShadow
          >
            <sphereGeometry args={[petalRadius, 64, 64]} />
            <meshPhysicalMaterial 
              color={isSelected ? '#007AFF' : isHovered ? '#5AC8FA' : color} 
              roughness={1}
              sheen={1}
              sheenColor="white"
              sheenRoughness={0.5}
            />
          </mesh>
        );
      })}
      
      {/* Yellow center - sunflower yellow with velvet sheen */}
      <mesh position={[0, puffHeight / 2 + 0.01, 0]} castShadow receiveShadow>
        <sphereGeometry args={[centerRadius, 64, 64]} />
        <meshPhysicalMaterial 
          color={isSelected ? '#007AFF' : isHovered ? '#5AC8FA' : '#F4D03F'} 
          roughness={1}
          sheen={1}
          sheenColor="white"
          sheenRoughness={0.5}
        />
      </mesh>
      
      {/* Mouth - extruded D-shape with thickness */}
      <mesh position={[0, puffHeight / 2 - centerRadius * 0.18, centerRadius * 0.92]}>
        <extrudeGeometry 
          args={[
            (() => {
              const shape = new THREE.Shape();
              shape.absarc(0, 0, 0.038, 0, Math.PI, true);
              shape.lineTo(0.038, 0);
              return shape;
            })(),
            { depth: 0.008, bevelEnabled: false }
          ]} 
        />
        <meshStandardMaterial color="#A93226" roughness={1} />
      </mesh>
    </group>
  );
}

// Picture Frame model
function PictureFrameModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const frameColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  const frameWidth = 0.015;
  
  return (
    <group>
      {/* Back */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth * 0.3]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Picture area */}
      <mesh position={[0, height / 2, depth * 0.16]} castShadow>
        <boxGeometry args={[width - frameWidth * 4, height - frameWidth * 4, 0.002]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      {/* Frame edges */}
      {[
        [0, height / 2 + height / 2 - frameWidth, depth * 0.2, width, frameWidth * 2, depth * 0.5],
        [0, height / 2 - height / 2 + frameWidth, depth * 0.2, width, frameWidth * 2, depth * 0.5],
        [-width / 2 + frameWidth, height / 2, depth * 0.2, frameWidth * 2, height, depth * 0.5],
        [width / 2 - frameWidth, height / 2, depth * 0.2, frameWidth * 2, height, depth * 0.5],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={frameColor} />
        </mesh>
      ))}
    </group>
  );
}

// Vase model
function VaseModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  const vaseColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Base */}
      <mesh position={[0, height * 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.3, width * 0.35, height * 0.1, 16]} />
        <meshStandardMaterial color={vaseColor} />
      </mesh>
      {/* Body */}
      <mesh position={[0, height * 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.25, width * 0.4, height * 0.6, 16]} />
        <meshStandardMaterial color={vaseColor} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, height * 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.2, width * 0.25, height * 0.25, 16]} />
        <meshStandardMaterial color={vaseColor} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, height * 0.95, 0]} castShadow>
        <torusGeometry args={[width * 0.18, 0.015, 8, 16]} />
        <meshStandardMaterial color={vaseColor} />
      </mesh>
    </group>
  );
}

// Small Lamp model
function SmallLampModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  const shadeColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Base */}
      <mesh position={[0, height * 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.3, width * 0.35, height * 0.08, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, height * 0.35, 0]} castShadow>
        <cylinderGeometry args={[width * 0.04, width * 0.04, height * 0.5, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, height * 0.75, 0]} castShadow>
        <cylinderGeometry args={[width * 0.35, width * 0.5, height * 0.4, 16, 1, true]} />
        <meshStandardMaterial color={shadeColor} side={2} transparent opacity={0.9} />
      </mesh>
      {/* Light bulb glow */}
      <mesh position={[0, height * 0.65, 0]}>
        <sphereGeometry args={[width * 0.1, 8, 8]} />
        <meshBasicMaterial color="#FFF8E7" />
      </mesh>
    </group>
  );
}

// Clock model
function ClockModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  const clockColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Clock body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width / 2, width / 2, height * 0.3, 24]} />
        <meshStandardMaterial color={clockColor} />
      </mesh>
      {/* Clock face */}
      <mesh position={[0, height / 2, height * 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[width * 0.45, 24]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Hour hand */}
      <mesh position={[0, height / 2, height * 0.17]} rotation={[Math.PI / 2, 0, 0.5]}>
        <boxGeometry args={[width * 0.04, width * 0.2, 0.01]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Minute hand */}
      <mesh position={[0, height / 2, height * 0.17]} rotation={[Math.PI / 2, 0, -0.8]}>
        <boxGeometry args={[width * 0.03, width * 0.35, 0.01]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

// Trophy model
function TrophyModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  const trophyColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Base */}
      <mesh position={[0, height * 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.8, height * 0.08, width * 0.8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, height * 0.15, 0]} castShadow>
        <cylinderGeometry args={[width * 0.2, width * 0.3, height * 0.12, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Stem */}
      <mesh position={[0, height * 0.35, 0]} castShadow>
        <cylinderGeometry args={[width * 0.08, width * 0.08, height * 0.25, 8]} />
        <meshStandardMaterial color={trophyColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cup */}
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <cylinderGeometry args={[width * 0.35, width * 0.15, height * 0.35, 16]} />
        <meshStandardMaterial color={trophyColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Handles */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.4, height * 0.6, 0]} rotation={[0, 0, side * 0.3]} castShadow>
          <torusGeometry args={[width * 0.12, 0.015, 8, 12, Math.PI]} />
          <meshStandardMaterial color={trophyColor} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// TV Stand model
function TVStandModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  
  const standColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Main cabinet */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={standColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* TV */}
      <mesh position={[0, height + 0.4, -depth * 0.2]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.9, 0.6, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, height + 0.4, -depth * 0.2 + 0.026]}>
        <boxGeometry args={[width * 0.85, 0.55, 0.001]} />
        <meshBasicMaterial color="#2a2a3a" />
      </mesh>
    </group>
  );
}

// Nightstand model
function NightstandModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  
  const standColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={standColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Drawer front */}
      <mesh position={[0, height * 0.35, depth / 2 - 0.01]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.85, height * 0.35, 0.02]} />
        <meshStandardMaterial color={standColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Drawer handle */}
      <mesh position={[0, height * 0.35, depth / 2 + 0.02]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#808080" roughness={COZY_ROUGHNESS} metalness={0.3} />
      </mesh>
    </group>
  );
}

// Wardrobe model
function WardrobeModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  
  const wardrobeColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wardrobeColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Door split line */}
      <mesh position={[0, height / 2, depth / 2 + 0.001]}>
        <boxGeometry args={[0.01, height * 0.95, 0.001]} />
        <meshBasicMaterial color="#555555" />
      </mesh>
      {/* Door handles */}
      {[-1, 1].map((x, i) => (
        <mesh key={i} position={[x * 0.08, height / 2, depth / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.15, 0.02]} />
          <meshStandardMaterial color="#808080" roughness={COZY_ROUGHNESS} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Coffee Table model
function CoffeeTableModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const topThickness = 0.04;
  const legWidth = 0.05;
  
  const tableColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Table top */}
      <mesh position={[0, height - topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={tableColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - legWidth * 1.5), (height - topThickness) / 2, z * (depth / 2 - legWidth * 1.5)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[legWidth, height - topThickness, legWidth]} />
          <meshStandardMaterial color={tableColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Dining Table model
function DiningTableModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const topThickness = 0.05;
  const legWidth = 0.08;
  
  const tableColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  
  return (
    <group>
      {/* Table top */}
      <mesh position={[0, height - topThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topThickness, depth]} />
        <meshStandardMaterial color={tableColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <mesh 
          key={i} 
          position={[x * (width / 2 - legWidth), (height - topThickness) / 2, z * (depth / 2 - legWidth)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[legWidth, height - topThickness, legWidth]} />
          <meshStandardMaterial color={tableColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// L-Shaped Desk model - properly shaped L
function LDeskModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const topThickness = 0.04;
  const legWidth = 0.06;
  const deskColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
  const legColor = isSelected ? '#005bb5' : isHovered ? '#4090c0' : '#3a3a3a';
  
  // L-shape: main section (longer) + extension (shorter side)
  const mainLength = width * 0.65;
  const extensionLength = width * 0.5;
  const mainDepth = depth * 0.45;
  const extensionDepth = depth * 0.55;

  return (
    <group>
      {/* Main desktop section - longer horizontal part */}
      <mesh position={[-width * 0.175, height - topThickness / 2, -depth * 0.275]} castShadow receiveShadow>
        <boxGeometry args={[mainLength, topThickness, mainDepth]} />
        <meshStandardMaterial color={deskColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Extension section - the L part going forward */}
      <mesh position={[width * 0.25, height - topThickness / 2, depth * 0.225]} castShadow receiveShadow>
        <boxGeometry args={[extensionLength, topThickness, extensionDepth]} />
        <meshStandardMaterial color={deskColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Legs at each corner of the L */}
      {[
        [-width * 0.5 + legWidth, -depth * 0.5 + legWidth],     // Back left
        [mainLength * 0.35, -depth * 0.5 + legWidth],           // Back right of main
        [-width * 0.5 + legWidth, -depth * 0.05],               // Front left
        [width * 0.5 - legWidth, depth * 0.5 - legWidth],       // Front right of extension
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, (height - topThickness) / 2, z]} castShadow>
          <boxGeometry args={[legWidth, height - topThickness, legWidth]} />
          <meshStandardMaterial color={legColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      ))}
    </group>
  );
}

// Gaming Chair model
function GamingChairModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const chairColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <group>
      {/* Base with wheels */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Center pole */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Seat */}
      <mesh position={[0, height * 0.35, 0]} castShadow>
        <boxGeometry args={[width * 0.9, 0.1, depth * 0.8]} />
        <meshStandardMaterial color={chairColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, height * 0.65, -depth * 0.35]} castShadow>
        <boxGeometry args={[width * 0.85, height * 0.5, 0.12]} />
        <meshStandardMaterial color={chairColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Headrest */}
      <mesh position={[0, height * 0.9, -depth * 0.35]} castShadow>
        <boxGeometry args={[width * 0.5, 0.15, 0.1]} />
        <meshStandardMaterial color={chairColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Armrests */}
      {[-1, 1].map((x, i) => (
        <mesh key={i} position={[x * width * 0.4, height * 0.45, 0]} castShadow>
          <boxGeometry args={[0.08, 0.05, depth * 0.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={COZY_ROUGHNESS} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// Monitor model
function MonitorModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;

  return (
    <group>
      {/* Screen */}
      <mesh position={[0, height * 0.6, 0]} castShadow>
        <boxGeometry args={[width, height * 0.7, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Display */}
      <mesh position={[0, height * 0.6, 0.016]}>
        <boxGeometry args={[width * 0.95, height * 0.65, 0.001]} />
        <meshBasicMaterial color={isSelected ? '#3a5a8a' : '#2a3a4a'} />
      </mesh>
      {/* Stand neck */}
      <mesh position={[0, height * 0.2, -depth * 0.2]} castShadow>
        <boxGeometry args={[0.08, height * 0.3, 0.08]} />
        <meshStandardMaterial color="#3a3a3a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Stand base */}
      <mesh position={[0, 0.02, -depth * 0.2]} castShadow>
        <boxGeometry args={[width * 0.5, 0.03, depth * 0.6]} />
        <meshStandardMaterial color="#3a3a3a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Dual Monitor model
function DualMonitorModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const monitorWidth = width * 0.48;

  return (
    <group>
      {/* Left screen */}
      <mesh position={[-width * 0.26, height * 0.6, 0]} castShadow>
        <boxGeometry args={[monitorWidth, height * 0.7, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      <mesh position={[-width * 0.26, height * 0.6, 0.016]}>
        <boxGeometry args={[monitorWidth * 0.95, height * 0.65, 0.001]} />
        <meshBasicMaterial color={isSelected ? '#3a5a8a' : '#2a3a4a'} />
      </mesh>
      {/* Right screen */}
      <mesh position={[width * 0.26, height * 0.6, 0]} castShadow>
        <boxGeometry args={[monitorWidth, height * 0.7, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      <mesh position={[width * 0.26, height * 0.6, 0.016]}>
        <boxGeometry args={[monitorWidth * 0.95, height * 0.65, 0.001]} />
        <meshBasicMaterial color={isSelected ? '#3a5a8a' : '#1a2a3a'} />
      </mesh>
      {/* Mount arm */}
      <mesh position={[0, height * 0.35, -depth * 0.3]} castShadow>
        <boxGeometry args={[width * 0.6, 0.05, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, height * 0.15, -depth * 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, height * 0.3, 8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.02, -depth * 0.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Wall TV model
function TVWallModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;

  return (
    <group>
      {/* TV Frame */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, height / 2, 0.026]}>
        <boxGeometry args={[width * 0.96, height * 0.94, 0.001]} />
        <meshBasicMaterial color={isSelected ? '#2a4a6a' : '#1a2a3a'} />
      </mesh>
    </group>
  );
}

// Gaming PC model
function GamingPCModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const pcColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <group>
      {/* Main case */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={pcColor} roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Glass panel */}
      <mesh position={[width / 2 - 0.005, height / 2, 0]}>
        <boxGeometry args={[0.01, height * 0.8, depth * 0.8]} />
        <meshStandardMaterial color="#1a3a5a" transparent opacity={0.5} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* RGB strip */}
      <mesh position={[width / 2 - 0.01, height * 0.7, 0]}>
        <boxGeometry args={[0.005, 0.02, depth * 0.7]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </group>
  );
}

// Plant model
function PlantModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const potColor = isSelected ? '#8b5a2b' : '#6b4423';

  return (
    <group>
      {/* Pot */}
      <mesh position={[0, height * 0.15, 0]} castShadow>
        <cylinderGeometry args={[width * 0.35, width * 0.3, height * 0.3, 16]} />
        <meshStandardMaterial color={potColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, height * 0.28, 0]}>
        <cylinderGeometry args={[width * 0.32, width * 0.32, 0.05, 16]} />
        <meshStandardMaterial color="#3d2817" roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Leaves/Foliage */}
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <sphereGeometry args={[width * 0.45, 8, 8]} />
        <meshStandardMaterial color={isSelected ? '#32cd32' : '#228b22'} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
    </group>
  );
}

// Floor Lamp model
function FloorLampModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  const lampColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[width * 0.4, width * 0.45, 0.05, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, height * 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, height * 0.85, 8]} />
        <meshStandardMaterial color="#5a5a5a" roughness={COZY_ROUGHNESS} metalness={0.1} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, height * 0.88, 0]} castShadow>
        <cylinderGeometry args={[width * 0.15, width * 0.35, height * 0.2, 16]} />
        <meshStandardMaterial color={lampColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
    </group>
  );
}

// Dresser model
function DresserModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const dresserColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={dresserColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Drawers */}
      {[0.2, 0.5, 0.8].map((y, i) => (
        <group key={i}>
          <mesh position={[0, height * y, depth / 2 - 0.01]} castShadow>
            <boxGeometry args={[width * 0.9, height * 0.25, 0.02]} />
            <meshStandardMaterial color={dresserColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
          </mesh>
          {/* Handles */}
          {[-0.2, 0.2].map((x, j) => (
            <mesh key={j} position={[x * width, height * y, depth / 2 + 0.02]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#808080" roughness={COZY_ROUGHNESS} metalness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Rug model
function RugModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, depth } = dimensions;
  const rugColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <mesh position={[0, 0.01, 0]} receiveShadow>
      <boxGeometry args={[width, 0.02, depth]} />
      <meshStandardMaterial color={rugColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
    </mesh>
  );
}

// Christmas Tree model - Using simple pyramids stacked
function ChristmasTreeModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height } = dimensions;
  // Always use green for tree, regardless of color prop
  const greenColor = isSelected ? '#2ecc40' : isHovered ? '#3ddc3d' : '#1a7a1a';
  const trunkColor = '#5D4037';
  const starColor = '#FFD700';
  
  // Trunk dimensions
  const trunkH = height * 0.12;
  const trunkR = width * 0.08;
  
  // Tree layer heights
  const layer1H = height * 0.35;
  const layer2H = height * 0.30;
  const layer3H = height * 0.28;
  
  return (
    <group>
      {/* Brown trunk cylinder */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkR, trunkR * 1.3, trunkH, 12]} />
        <meshStandardMaterial color={trunkColor} />
      </mesh>
      
      {/* Layer 1 - Bottom (largest) - using cylinder with 0 top radius = cone */}
      <mesh position={[0, trunkH + layer1H / 2, 0]} castShadow>
        <cylinderGeometry args={[0, width * 0.5, layer1H, 12]} />
        <meshStandardMaterial color={greenColor} />
      </mesh>
      
      {/* Layer 2 - Middle */}
      <mesh position={[0, trunkH + layer1H * 0.6 + layer2H / 2, 0]} castShadow>
        <cylinderGeometry args={[0, width * 0.4, layer2H, 12]} />
        <meshStandardMaterial color={greenColor} />
      </mesh>
      
      {/* Layer 3 - Top (smallest) */}
      <mesh position={[0, trunkH + layer1H * 0.6 + layer2H * 0.7 + layer3H / 2, 0]} castShadow>
        <cylinderGeometry args={[0, width * 0.28, layer3H, 12]} />
        <meshStandardMaterial color={greenColor} />
      </mesh>
      
      {/* Gold star on top */}
      <mesh position={[0, height * 0.95, 0]}>
        <octahedronGeometry args={[width * 0.08]} />
        <meshStandardMaterial color={starColor} emissive={starColor} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Red ornaments */}
      {[[0.15, 0.35, 0.1], [-0.12, 0.45, -0.08], [0.08, 0.55, 0.12], [-0.1, 0.3, 0.1]].map(([x, y, z], i) => (
        <mesh key={i} position={[x * width, trunkH + y * height, z * width]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      ))}
    </group>
  );
}

// Sectional Couch model
function SectionalCouchModel({ dimensions, color, isSelected, isHovered }: Omit<FurnitureModelProps, 'type'>) {
  const { width, height, depth } = dimensions;
  const couchColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;

  return (
    <group>
      {/* Main section */}
      <mesh position={[-width * 0.2, height * 0.25, -depth * 0.25]} castShadow>
        <boxGeometry args={[width * 0.6, height * 0.5, depth * 0.5]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* L section */}
      <mesh position={[width * 0.3, height * 0.25, depth * 0.15]} castShadow>
        <boxGeometry args={[width * 0.4, height * 0.5, depth * 0.7]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      {/* Back cushions */}
      <mesh position={[-width * 0.2, height * 0.6, -depth * 0.45]} castShadow>
        <boxGeometry args={[width * 0.55, height * 0.35, 0.15]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
      <mesh position={[width * 0.45, height * 0.6, depth * 0.15]} castShadow>
        <boxGeometry args={[0.15, height * 0.35, depth * 0.6]} />
        <meshStandardMaterial color={couchColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
      </mesh>
    </group>
  );
}

// Main FurnitureModel component that renders the appropriate model
export function FurnitureModel({ type, dimensions, color, isSelected, isHovered, orientation, spineColor, sizeVariant }: FurnitureModelProps) {
  const props = { dimensions, color, isSelected, isHovered };
  const bookProps = { ...props, orientation, spineColor, sizeVariant };

  switch (type) {
    // Beds
    case 'bed':
    case 'king_bed':
    case 'twin_bed':
      return <BedModel {...props} />;
    case 'bunk_bed':
      return <BedModel {...props} />; // TODO: proper bunk bed
    
    // Desks
    case 'desk':
    case 'standing_desk':
    case 'gaming_desk':
      return <DeskModel {...props} />;
    case 'l_desk':
      return <LDeskModel {...props} />;
    
    // Seating
    case 'chair':
    case 'office_chair':
      return <ChairModel {...props} />;
    case 'gaming_chair':
      return <GamingChairModel {...props} />;
    case 'armchair':
    case 'loveseat':
      return <CouchModel {...props} />;
    case 'couch':
      return <CouchModel {...props} />;
    case 'sectional_couch':
      return <SectionalCouchModel {...props} />;
    case 'bean_bag':
      return (
        <mesh castShadow position={[0, dimensions.height / 2, 0]}>
          <sphereGeometry args={[dimensions.width / 2, 16, 16]} />
          <meshStandardMaterial color={isSelected ? '#ff6b6b' : color} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      );
    
    // Storage
    case 'bookshelf':
    case 'tall_bookshelf':
      return <BookshelfModel {...props} />;
    case 'dresser':
      return <DresserModel {...props} />;
    case 'wardrobe':
      return <WardrobeModel {...props} />;
    case 'nightstand':
      return <NightstandModel {...props} />;
    case 'filing_cabinet':
    case 'storage_cube':
      return <NightstandModel {...props} />;
    
    // Tables
    case 'coffee_table':
    case 'side_table':
    case 'console_table':
      return <CoffeeTableModel {...props} />;
    case 'dining_table':
    case 'kitchen_island':
      return <DiningTableModel {...props} />;
    
    // Entertainment
    case 'tv_stand':
      return <TVStandModel {...props} />;
    case 'tv_wall':
      return <TVWallModel {...props} />;
    case 'monitor':
      return <MonitorModel {...props} />;
    case 'dual_monitor':
      return <DualMonitorModel {...props} />;
    case 'gaming_pc':
      return <GamingPCModel {...props} />;
    
    // Decor
    case 'plant':
      return <PlantModel {...props} />;
    case 'floor_lamp':
      return <FloorLampModel {...props} />;
    case 'christmas_tree':
      return <ChristmasTreeModel {...props} />;
    
    // Books & Small Items (with orientation and spine color support)
    case 'book':
      return <BookModel {...bookProps} />;
    case 'book_stack':
      return <BookStackModel {...bookProps} />;
    case 'manga':
      return <MangaModel {...bookProps} />;
    case 'gojo_manga':
      return <GojoMangaModel {...props} />;
    case 'kaws_figure':
      return <KawsFigureModel {...props} />;
    case 'murakami_flower':
      return <MurakamiFlowerModel {...props} />;
    case 'picture_frame':
      return <PictureFrameModel {...props} />;
    case 'vase':
      return <VaseModel {...props} />;
    case 'lamp_small':
      return <SmallLampModel {...props} />;
    case 'clock':
      return <ClockModel {...props} />;
    case 'trophy':
      return <TrophyModel {...props} />;
    
    case 'rug':
      return <RugModel {...props} />;
    case 'mirror':
      return (
        <mesh position={[0, dimensions.height / 2, 0]} castShadow>
          <boxGeometry args={[dimensions.width, dimensions.height, 0.03]} />
          <meshStandardMaterial color={isSelected ? '#e0e0e0' : '#c0c0c0'} roughness={0.3} metalness={0.7} />
        </mesh>
      );
    case 'ceiling_fan':
      // Ceiling fan - designed to hang from ceiling
      // Position y=0 is the CEILING MOUNT point, fan hangs DOWN
      const cfWidth = dimensions.width;
      const cfHeight = dimensions.height;
      const bladeLength = cfWidth * 0.45;
      const metalColor = isSelected ? '#888' : '#666';
      const bladeColor = isSelected ? '#a08060' : '#5D4037';
      return (
        <group>
          {/* Ceiling mount plate (at top) */}
          <mesh position={[0, cfHeight - 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
            <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Down rod */}
          <mesh position={[0, cfHeight * 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, cfHeight * 0.5, 8]} />
            <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Motor housing */}
          <mesh position={[0, cfHeight * 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.18, 16]} />
            <meshStandardMaterial color={isSelected ? '#888' : '#555'} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Blade holder disc */}
          <mesh position={[0, cfHeight * 0.25, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.025, 16]} />
            <meshStandardMaterial color="#444" roughness={COZY_ROUGHNESS} metalness={0.1} />
          </mesh>
          {/* 5 Fan blades - extending outward horizontally */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            return (
              <mesh 
                key={i} 
                position={[
                  Math.cos(angle) * bladeLength * 0.55,
                  cfHeight * 0.23,
                  Math.sin(angle) * bladeLength * 0.55
                ]}
                rotation={[0, -angle, 0]}
                castShadow
              >
                <boxGeometry args={[bladeLength, 0.015, 0.1]} />
                <meshStandardMaterial color={bladeColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
              </mesh>
            );
          })}
          {/* Light fixture bowl */}
          <mesh position={[0, cfHeight * 0.12, 0]} castShadow>
            <sphereGeometry args={[0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#fffef0" />
          </mesh>
        </group>
      );
    
    // Exercise
    case 'treadmill':
    case 'exercise_bike':
      const exerciseColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
      return (
        <group>
          <mesh position={[0, dimensions.height * 0.1, 0]} castShadow>
            <boxGeometry args={[dimensions.width, 0.15, dimensions.depth]} />
            <meshStandardMaterial color={exerciseColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
          </mesh>
          <mesh position={[0, dimensions.height * 0.6, -dimensions.depth * 0.35]} castShadow>
            <boxGeometry args={[dimensions.width * 0.8, dimensions.height * 0.8, 0.1]} />
            <meshStandardMaterial color={exerciseColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
          </mesh>
        </group>
      );
    
    // Bar stool
    case 'bar_stool':
      return <ChairModel {...props} />;
    
    default:
      // Fallback to a simple box
      const boxColor = isSelected || isHovered ? getHighlightColor(color, isSelected, isHovered) : color;
      return (
        <mesh castShadow receiveShadow position={[0, dimensions.height / 2, 0]}>
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={boxColor} roughness={COZY_ROUGHNESS} metalness={COZY_METALNESS} />
        </mesh>
      );
  }
}
