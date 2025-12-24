'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';
import { useRoomStore } from '@/store/roomStore';
import { useMakerspaceStore, MakerspaceItem } from '@/store/makerspaceStore';

interface ScannedModelProps {
  item: MakerspaceItem;
  position: [number, number, number];
  rotation: number;
  onPositionChange: (position: [number, number, number]) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export function ScannedModel({
  item,
  position,
  rotation,
  onPositionChange,
  isSelected,
  onSelect,
}: ScannedModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { gridSize, roomDimensions, setIsDragging: setGlobalDragging } = useRoomStore();
  const { camera, gl } = useThree();
  
  // Load the GLB model
  const { scene } = useGLTF(item.blobUrl || '');
  
  // Clone and normalize the scene
  const normalizedScene = useMemo(() => {
    if (!scene) return null;
    
    const clone = scene.clone();
    
    // Get bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    
    // Scale to match stored dimensions
    const scaleX = item.dimensions.width / size.x;
    const scaleY = item.dimensions.height / size.y;
    const scaleZ = item.dimensions.depth / size.z;
    
    clone.scale.set(scaleX, scaleY, scaleZ);
    
    // Center horizontally, bottom at y=0
    clone.position.sub(center.multiply(new THREE.Vector3(scaleX, scaleY, scaleZ)));
    clone.position.y = 0;
    
    // Enable shadows
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return clone;
  }, [scene, item.dimensions]);
  
  // Raycaster for floor intersection
  const raycaster = useRef(new THREE.Raycaster());
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  // Snap position to grid
  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / gridSize) * gridSize;
  }, [gridSize]);
  
  // Clamp position within room bounds
  const clampPosition = useCallback((x: number, z: number): [number, number] => {
    const halfWidth = item.dimensions.width / 2;
    const halfDepth = item.dimensions.depth / 2;
    const roomHalfWidth = roomDimensions.width / 2;
    const roomHalfLength = roomDimensions.length / 2;
    
    const clampedX = Math.max(-roomHalfWidth + halfWidth, 
                              Math.min(roomHalfWidth - halfWidth, x));
    const clampedZ = Math.max(-roomHalfLength + halfDepth, 
                              Math.min(roomHalfLength - halfDepth, z));
    
    return [clampedX, clampedZ];
  }, [item.dimensions, roomDimensions]);
  
  // Drag handler
  const bind = useDrag(
    ({ active, first, event }) => {
      if (first) {
        setIsDragging(true);
        setGlobalDragging(true); // Disable camera controls
        onSelect();
      }
      
      if (!active) {
        setIsDragging(false);
        setGlobalDragging(false); // Re-enable camera controls
        return;
      }
      
      // Get mouse position in normalized device coordinates
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      
      const mouseX = ((event as PointerEvent).clientX - rect.left) / rect.width * 2 - 1;
      const mouseY = -((event as PointerEvent).clientY - rect.top) / rect.height * 2 + 1;
      
      // Create a ray from camera through mouse position
      raycaster.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      
      // Find intersection with floor plane
      const intersectPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(floorPlane.current, intersectPoint);
      
      if (intersectPoint) {
        let newX = snapToGrid(intersectPoint.x);
        let newZ = snapToGrid(intersectPoint.z);
        [newX, newZ] = clampPosition(newX, newZ);
        
        onPositionChange([newX, 0, newZ]);
      }
    },
    { 
      pointer: { capture: false },
      filterTaps: true,
    }
  );
  
  // Handle click for selection
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isDragging) {
      onSelect();
    }
  }, [isDragging, onSelect]);
  
  if (!normalizedScene || !item.blobUrl) {
    return null;
  }
  
  // Selection/hover color
  const emissiveColor = isSelected ? '#007AFF' : isHovered ? '#5AC8FA' : '#000000';
  const emissiveIntensity = isSelected ? 0.15 : isHovered ? 0.08 : 0;
  
  // Apply emissive to all meshes
  useEffect(() => {
    if (normalizedScene) {
      normalizedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive.set(emissiveColor);
            mat.emissiveIntensity = emissiveIntensity;
          }
        }
      });
    }
  }, [normalizedScene, emissiveColor, emissiveIntensity]);
  
  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
      {...(bind() as any)}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
      onPointerOut={() => setIsHovered(false)}
    >
      <primitive object={normalizedScene} />
      
      {/* Selection outline box */}
      {isSelected && (
        <lineSegments position={[0, item.dimensions.height / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(
            item.dimensions.width + 0.02,
            item.dimensions.height + 0.02,
            item.dimensions.depth + 0.02
          )]} />
          <lineBasicMaterial color="#007AFF" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}

// Preload hook for GLTF
ScannedModel.preload = (url: string) => {
  useGLTF.preload(url);
};

