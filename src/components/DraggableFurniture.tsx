'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { FurnitureModel } from './FurnitureModels';
import { FurnitureItem, useRoomStore } from '@/store/roomStore';
import { playPlaceSound } from '@/lib/sounds';

interface DraggableFurnitureProps {
  item: FurnitureItem;
}

export function DraggableFurniture({ item }: DraggableFurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasCollision, setHasCollision] = useState(false);
  
  // Velocity tracking for bouncy drag effect
  const velocityRef = useRef({ x: 0, z: 0 });
  const lastPosRef = useRef({ x: item.position[0], z: item.position[2] });
  const tiltRef = useRef({ x: 0, z: 0 });
  
  const { 
    selectedId, 
    setSelectedId, 
    updateFurniturePosition, 
    removeFurniture,
    gridSize,
    roomDimensions,
    furniture,
    setIsDragging: setGlobalDragging,
    detailModeTarget,
  } = useRoomStore();
  
  // Check if we're in detail edit mode
  const isInDetailMode = detailModeTarget !== null;
  const targetFurniture = isInDetailMode ? furniture.find(f => f.id === detailModeTarget) : null;
  
  const isSelected = selectedId === item.id;
  const { camera, gl } = useThree();
  
  // Raycaster for floor intersection
  const raycaster = useRef(new THREE.Raycaster());
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  // Keyboard handler for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        removeFurniture(item.id);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, item.id, removeFurniture]);
  
  // Check if this is a small item (books, etc.) that can be placed close together
  const isSmallItem = useCallback((type: string): boolean => {
    const smallTypes = ['book', 'book_stack', 'manga', 'gojo_manga', 'kaws_figure', 'murakami_flower', 'picture_frame', 'vase', 'lamp_small', 'clock', 'trophy', 'plant'];
    return smallTypes.includes(type);
  }, []);
  
  // Snap position to grid - much finer for small items
  const snapToGrid = useCallback((value: number) => {
    // Small items get ultra-fine snapping (basically free movement)
    const isSmall = isSmallItem(item.type);
    const fineGrid = isSmall ? 0.005 : gridSize / 4; // 5mm for small items, ~2.5cm for large
    return Math.round(value / fineGrid) * fineGrid;
  }, [gridSize, item.type, isSmallItem]);
  
  // Clamp position within room bounds
  const clampPosition = useCallback((x: number, z: number): [number, number] => {
    const halfWidth = item.dimensions.width / 2;
    const halfDepth = item.dimensions.depth / 2;
    const roomHalfWidth = roomDimensions.width / 2;
    const roomHalfLength = roomDimensions.length / 2;
    
    // Account for rotation
    const rotation = (item.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    const effectiveHalfWidth = halfWidth * cos + halfDepth * sin;
    const effectiveHalfDepth = halfWidth * sin + halfDepth * cos;
    
    const clampedX = Math.max(-roomHalfWidth + effectiveHalfWidth, 
                              Math.min(roomHalfWidth - effectiveHalfWidth, x));
    const clampedZ = Math.max(-roomHalfLength + effectiveHalfDepth, 
                              Math.min(roomHalfLength - effectiveHalfDepth, z));
    
    return [clampedX, clampedZ];
  }, [item.dimensions, item.rotation, roomDimensions]);

  // Check collision with other furniture (with smaller padding) - now includes Y check
  const checkCollision = useCallback((x: number, y: number, z: number): boolean => {
    const rotation = (item.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    
    // Small items can get MUCH closer to each other (like books on a shelf)
    const isMyItemSmall = isSmallItem(item.type);
    const shrink = isMyItemSmall ? 0.5 : 0.95; // Small items use 50% collision box
    
    const effectiveWidth = (item.dimensions.width * cos + item.dimensions.depth * sin) * shrink;
    const effectiveDepth = (item.dimensions.width * sin + item.dimensions.depth * cos) * shrink;
    
    const myBox = {
      minX: x - effectiveWidth / 2,
      maxX: x + effectiveWidth / 2,
      minY: y,
      maxY: y + item.dimensions.height * shrink,
      minZ: z - effectiveDepth / 2,
      maxZ: z + effectiveDepth / 2,
    };
    
    for (const other of furniture) {
      // Skip self
      if (other.id === item.id) continue;
      
      // In detail mode, skip the target furniture (we're placing items ON it)
      if (isInDetailMode && other.id === detailModeTarget) continue;
      
      // If BOTH items are small, allow them to get very close (almost touching)
      const isOtherSmall = isSmallItem(other.type);
      const bothSmall = isMyItemSmall && isOtherSmall;
      
      // If both are small items, skip collision entirely - let them touch
      if (bothSmall) continue;
      
      const otherShrink = isOtherSmall ? 0.5 : 0.95;
      const otherRotation = (other.rotation * Math.PI) / 180;
      const otherCos = Math.abs(Math.cos(otherRotation));
      const otherSin = Math.abs(Math.sin(otherRotation));
      const otherEffectiveWidth = (other.dimensions.width * otherCos + other.dimensions.depth * otherSin) * otherShrink;
      const otherEffectiveDepth = (other.dimensions.width * otherSin + other.dimensions.depth * otherCos) * otherShrink;
      
      const otherBox = {
        minX: other.position[0] - otherEffectiveWidth / 2,
        maxX: other.position[0] + otherEffectiveWidth / 2,
        minY: other.position[1],
        maxY: other.position[1] + other.dimensions.height * otherShrink,
        minZ: other.position[2] - otherEffectiveDepth / 2,
        maxZ: other.position[2] + otherEffectiveDepth / 2,
      };
      
      // Full 3D AABB collision check - includes Y axis now
      if (myBox.minX < otherBox.maxX &&
          myBox.maxX > otherBox.minX &&
          myBox.minY < otherBox.maxY &&
          myBox.maxY > otherBox.minY &&
          myBox.minZ < otherBox.maxZ &&
          myBox.maxZ > otherBox.minZ) {
        return true;
      }
    }
    
    return false;
  }, [item.id, item.type, item.dimensions, item.rotation, furniture, isInDetailMode, detailModeTarget, isSmallItem]);
  
  // Find position on a horizontal plane at given Y height
  const findPositionAtHeight = useCallback((mouseX: number, mouseY: number, yHeight: number): { x: number; z: number } | null => {
    raycaster.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yHeight);
    const intersectPoint = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(plane, intersectPoint);
    
    if (!intersectPoint) return null;
    
    return { x: intersectPoint.x, z: intersectPoint.z };
  }, [camera]);
  
  // Animate tilt based on velocity - the "bouncy" effect
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Clamp delta to prevent huge jumps
    const dt = Math.min(delta, 0.1);
    
    if (isDragging) {
      // Calculate velocity from position change
      const currentX = item.position[0];
      const currentZ = item.position[2];
      
      velocityRef.current.x = (currentX - lastPosRef.current.x) / dt;
      velocityRef.current.z = (currentZ - lastPosRef.current.z) / dt;
      
      lastPosRef.current.x = currentX;
      lastPosRef.current.z = currentZ;
      
      // Clamp velocity for reasonable tilt
      const maxVel = 5;
      velocityRef.current.x = THREE.MathUtils.clamp(velocityRef.current.x, -maxVel, maxVel);
      velocityRef.current.z = THREE.MathUtils.clamp(velocityRef.current.z, -maxVel, maxVel);
      
      // Target tilt based on velocity (reversed so it tilts "into" the movement)
      const tiltAmount = 0.06;
      const targetTiltZ = -velocityRef.current.x * tiltAmount;
      const targetTiltX = velocityRef.current.z * tiltAmount;
      
      // Smoothly lerp to target tilt
      tiltRef.current.z = THREE.MathUtils.lerp(tiltRef.current.z, targetTiltZ, 0.15);
      tiltRef.current.x = THREE.MathUtils.lerp(tiltRef.current.x, targetTiltX, 0.15);
    } else {
      // Spring back to zero when not dragging
      tiltRef.current.z = THREE.MathUtils.lerp(tiltRef.current.z, 0, 0.12);
      tiltRef.current.x = THREE.MathUtils.lerp(tiltRef.current.x, 0, 0.12);
      
      // Reset velocity
      velocityRef.current.x = 0;
      velocityRef.current.z = 0;
    }
    
    // Apply tilt rotation (combined with the item's Y rotation)
    const yRotation = (item.rotation * Math.PI) / 180;
    groupRef.current.rotation.set(tiltRef.current.x, yRotation, tiltRef.current.z);
  });

  // Drag handler - handles both normal mode and detail edit mode
  const bind = useDrag(
    ({ active, first, memo, event }) => {
      if (first) {
        setIsDragging(true);
        setGlobalDragging(true); // Disable camera controls
        setSelectedId(item.id);
        // Store the starting position to revert to if placement is invalid
        return { startPos: [...item.position] as [number, number, number] };
      }
      
      if (!active) {
        // On drop - check if we can place here
        const collision = checkCollision(item.position[0], item.position[1], item.position[2]);
        
        if (collision && memo?.startPos) {
          // Can't place here - revert to starting position
          updateFurniturePosition(item.id, memo.startPos);
        } else {
          // Successfully placed! Play the pop sound
          playPlaceSound();
        }
        
        setIsDragging(false);
        setGlobalDragging(false); // Re-enable camera controls
        setHasCollision(false);
        return memo;
      }
      
      // Get mouse position in normalized device coordinates
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      
      const mouseX = ((event as PointerEvent).clientX - rect.left) / rect.width * 2 - 1;
      const mouseY = -((event as PointerEvent).clientY - rect.top) / rect.height * 2 + 1;
      
      // Keep the current Y position
      const currentY = item.position[1];
      
      // Find position on a plane at the item's current Y height
      const pos = findPositionAtHeight(mouseX, mouseY, currentY);
      
      if (pos) {
        let newX = snapToGrid(pos.x);
        let newZ = snapToGrid(pos.z);
        
        // In detail mode, constrain to target furniture bounds
        if (isInDetailMode && targetFurniture) {
          const halfW = targetFurniture.dimensions.width / 2 - item.dimensions.width / 2 - 0.02;
          const halfD = targetFurniture.dimensions.depth / 2 - item.dimensions.depth / 2 - 0.02;
          
          newX = Math.max(
            targetFurniture.position[0] - halfW,
            Math.min(targetFurniture.position[0] + halfW, newX)
          );
          newZ = Math.max(
            targetFurniture.position[2] - halfD,
            Math.min(targetFurniture.position[2] + halfD, newZ)
          );
        } else {
          // Normal mode - clamp within room bounds
          [newX, newZ] = clampPosition(newX, newZ);
        }
        
        // Move the item
        updateFurniturePosition(item.id, [newX, currentY, newZ]);
        
        // Check collision for visual feedback only
        const collision = checkCollision(newX, currentY, newZ);
        setHasCollision(collision);
      }
      
      return memo;
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
      setSelectedId(item.id);
    }
  }, [isDragging, item.id, setSelectedId]);
  
// Use actual Y position from item
  const yPosition = item.position[1];

  return (
    <group
      ref={groupRef}
      position={[item.position[0], yPosition, item.position[2]]}
      {...(bind() as any)}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
      onPointerOut={() => setIsHovered(false)}
      onPointerMissed={() => { if (isSelected) setSelectedId(null); }}
    >
      {/* Collision indicator - red translucent overlay */}
      {hasCollision && isDragging && (
        <mesh position={[0, item.dimensions.height / 2, 0]}>
          <boxGeometry args={[
            item.dimensions.width * 1.05, 
            item.dimensions.height * 1.05, 
            item.dimensions.depth * 1.05
          ]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      )}
      
      {/* The furniture model with architectural sketch outline when selected */}
      <group>
        <FurnitureModel
          type={item.type}
          dimensions={item.dimensions}
          color={hasCollision && isDragging ? '#ff6666' : item.color}
          isSelected={isSelected}
          isHovered={isHovered}
          orientation={item.orientation}
          spineColor={item.spineColor}
          sizeVariant={item.sizeVariant}
        />
        
        {/* Architectural sketch outline for selected items */}
        {isSelected && (
          <mesh position={[0, item.dimensions.height / 2, 0]}>
            <boxGeometry args={[
              item.dimensions.width,
              item.dimensions.height,
              item.dimensions.depth
            ]} />
            <meshBasicMaterial visible={false} />
            <Outlines 
              thickness={0.015}
              color="#1a1a2e"
              opacity={0.85}
              transparent
            />
          </mesh>
        )}
      </group>
      
      {/* Height indicator when placed on something */}
      {yPosition > 0.01 && isSelected && (
        <group position={[item.dimensions.width / 2 + 0.1, item.dimensions.height / 2, 0]}>
          <mesh>
            <planeGeometry args={[0.3, 0.15]} />
            <meshBasicMaterial color="#007AFF" transparent opacity={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

