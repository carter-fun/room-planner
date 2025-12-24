'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Room3D } from './Room3D';
import { DraggableFurniture } from './DraggableFurniture';
import { ScannedModel } from './ScannedModel';
import { useRoomStore } from '@/store/roomStore';
import { useMakerspaceStore } from '@/store/makerspaceStore';

interface CameraControllerProps {
  view: 'perspective' | 'top' | 'front' | 'side';
}

function CameraController({ view }: CameraControllerProps) {
  const { camera } = useThree();
  const { roomDimensions, isDragging } = useRoomStore();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    const maxDim = Math.max(roomDimensions.width, roomDimensions.length);
    
    let targetPosition: THREE.Vector3;
    let lookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    
    switch (view) {
      case 'top':
        targetPosition = new THREE.Vector3(0, maxDim * 1.8, 0.01);
        lookAt = new THREE.Vector3(0, 0, 0);
        break;
      case 'front':
        targetPosition = new THREE.Vector3(0, roomDimensions.height * 0.6, maxDim * 1.5);
        lookAt = new THREE.Vector3(0, roomDimensions.height * 0.3, 0);
        break;
      case 'side':
        targetPosition = new THREE.Vector3(maxDim * 1.5, roomDimensions.height * 0.6, 0);
        lookAt = new THREE.Vector3(0, roomDimensions.height * 0.3, 0);
        break;
      case 'perspective':
      default:
        targetPosition = new THREE.Vector3(maxDim, maxDim * 0.8, maxDim);
        lookAt = new THREE.Vector3(0, 0, 0);
        break;
    }
    
    camera.position.copy(targetPosition);
    camera.lookAt(lookAt);
    
    if (controlsRef.current) {
      controlsRef.current.target.copy(lookAt);
      controlsRef.current.update();
    }
  }, [view, roomDimensions, camera]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      enablePan={!isDragging}
      enableZoom={!isDragging}
      enableRotate={!isDragging && view !== 'top'}
      minPolarAngle={0}
      maxPolarAngle={view === 'top' ? 0.1 : Math.PI / 2 - 0.1}
      minDistance={1}
      maxDistance={25}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

// Post-processing effects - Ghibli cozy aesthetic
function PostEffects() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={4}>
      {/* N8AO - Ambient occlusion for depth in corners and crevices */}
      <N8AO
        intensity={1.5}
        aoRadius={2}
        distanceFalloff={1}
        color="#1a1a1a"
      />
      {/* Subtle bloom for a soft, dreamy glow */}
      <Bloom 
        intensity={0.15}
        luminanceThreshold={1}
        levels={3}
        mipmapBlur
      />
    </EffectComposer>
  );
}

interface SceneContentProps {
  view: 'perspective' | 'top' | 'front' | 'side';
}

function SceneContent({ view }: SceneContentProps) {
  const { 
    furniture, 
    scannedItems,
    selectedId,
    selectedType,
    setSelectedId, 
    roomDimensions,
    updateScannedItemPosition,
    addScannedItem,
  } = useRoomStore();
  const { selectedForPlacement, selectForPlacement, items: makerspaceItems } = useMakerspaceStore();
  const maxDim = Math.max(roomDimensions.width, roomDimensions.length);
  
  // Create a hash of furniture positions to force ContactShadows to remount when items move
  // This ensures shadows clear properly instead of accumulating
  const shadowKey = useMemo(() => {
    const furniturePos = furniture.map(f => 
      `${f.id}:${Math.round(f.position[0] * 100)}/${Math.round(f.position[1] * 100)}/${Math.round(f.position[2] * 100)}`
    ).join('|');
    const scannedPos = scannedItems.map(s => 
      `${s.id}:${Math.round(s.position[0] * 100)}/${Math.round(s.position[1] * 100)}/${Math.round(s.position[2] * 100)}`
    ).join('|');
    return `${furniturePos}|${scannedPos}`;
  }, [furniture, scannedItems]);
  
  const initialPosition: [number, number, number] = view === 'perspective' 
    ? [maxDim, maxDim * 0.8, maxDim]
    : view === 'top'
    ? [0, maxDim * 1.8, 0.01]
    : view === 'front'
    ? [0, roomDimensions.height * 0.6, maxDim * 1.5]
    : [maxDim * 1.5, roomDimensions.height * 0.6, 0];
  
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera 
        makeDefault 
        position={initialPosition}
        fov={45}
        near={0.1}
        far={100}
      />
      
      {/* Lighting - Professional studio setup */}
      {/* Key light - warm main light */}
      {/* Note: castShadow disabled - ContactShadows handles real-time shadows with frames={Infinity} */}
      <directionalLight
        position={[8, 12, 8]}
        intensity={2}
        color="#fff8f0"
      />
      
      {/* Fill light - cooler blue from opposite side */}
      <directionalLight
        position={[-8, 8, -8]}
        intensity={0.8}
        color="#e0eaff"
      />
      
      {/* Rim light - for depth separation */}
      <directionalLight
        position={[0, 5, -10]}
        intensity={0.5}
        color="#ffeedd"
      />
      
      {/* Ambient - low for more contrast */}
      <ambientLight intensity={0.3} color="#f5f0ff" />
      
      {/* Hemisphere for natural sky/ground bounce */}
      <hemisphereLight
        color="#b8d4ff"
        groundColor="#8b7355"
        intensity={0.4}
      />
      
      {/* Environment for realistic reflections */}
      <Environment preset="apartment" background={false} />
      
      {/* The room */}
      <Room3D />
      
      {/* Furniture items */}
      {furniture.map((item) => (
        <DraggableFurniture key={item.id} item={item} />
      ))}
      
      {/* Scanned items from Makerspace */}
      {scannedItems.map((item) => {
        const makerspaceItem = makerspaceItems.find(m => m.id === item.makerspaceItemId);
        if (!makerspaceItem?.blobUrl) return null;
        
        return (
          <ScannedModel
            key={item.id}
            item={{ ...makerspaceItem, blobUrl: makerspaceItem.blobUrl }}
            position={item.position}
            rotation={item.rotation}
            onPositionChange={(pos) => updateScannedItemPosition(item.id, pos)}
            isSelected={selectedId === item.id && selectedType === 'scanned'}
            onSelect={() => setSelectedId(item.id, 'scanned')}
          />
        );
      })}
      
      {/* Contact shadows - Ghibli style: soft blue-tinted shadows */}
      {/* Key changes when furniture moves, forcing complete remount to clear old shadows */}
      <ContactShadows
        key={`contact-shadows-${shadowKey}`}
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={60}
        blur={3}
        far={1.5}
        resolution={1024}
        color="#3d5a80"
        frames={Infinity}
      />
      
      {/* Camera Controller with OrbitControls */}
      <CameraController view={view} />
      
      {/* Click on floor to place selected makerspace item or deselect */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          
          if (selectedForPlacement) {
            const item = makerspaceItems.find(m => m.id === selectedForPlacement);
            if (item && item.blobUrl) {
              const point = e.point;
              addScannedItem({
                makerspaceItemId: item.id,
                name: item.name,
                position: [point.x, 0, point.z],
                rotation: 0,
                dimensions: item.dimensions,
                blobUrl: item.blobUrl,
              });
              selectForPlacement(null);
            }
            return;
          }
          
          setSelectedId(null);
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Post-processing effects */}
      <PostEffects />
    </>
  );
}

interface SceneProps {
  view?: 'perspective' | 'top' | 'front' | 'side';
}

export function Scene({ view = 'perspective' }: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        gl={{ 
          antialias: true, 
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          // ACES Filmic Tone Mapping - compresses highlights for soft, cozy look
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // Ensure tone mapping is applied after context creation
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.9;
        }}
        fallback={<div className="w-full h-full bg-stone-100 flex items-center justify-center">Loading...</div>}
      >
        {/* Ghibli cozy background - warm pastel cream */}
        <color attach="background" args={['#faf8f3']} />
        <fog attach="fog" args={['#faf8f3', 20, 50]} />
        <Suspense fallback={null}>
          <SceneContent view={view} />
        </Suspense>
      </Canvas>
    </div>
  );
}
