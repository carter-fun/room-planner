'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useRoomStore, FURNITURE_CATALOG, FurnitureType, BookOrientation, SPINE_COLORS } from '@/store/roomStore';
import { FurnitureModel } from './FurnitureModels';
import { DraggableFurniture } from './DraggableFurniture';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ChevronDown, Undo2, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Small items that can be placed on furniture
const SMALL_ITEMS: FurnitureType[] = [
  'book', 'book_stack', 'manga', 'gojo_manga', 'kaws_figure', 'murakami_flower',
  'picture_frame', 'vase', 'lamp_small', 'clock', 'trophy', 'plant'
];

interface DetailSceneProps {
  targetId: string;
  draggingItem: FurnitureType | null;
}

// Store camera and scene refs globally for the drop handler
let sceneCamera: THREE.Camera | null = null;
let sceneGL: THREE.WebGLRenderer | null = null;

function DetailScene({ targetId, draggingItem }: DetailSceneProps) {
  const { furniture, isDragging, setSelectedId } = useRoomStore();
  const targetFurniture = furniture.find(f => f.id === targetId);
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  
  // Click handler to deselect items
  const handleBackgroundClick = () => {
    setSelectedId(null);
  };
  
  // Store refs for drop handler
  useEffect(() => {
    sceneCamera = camera;
    sceneGL = gl;
  }, [camera, gl]);
  
  // Position camera close to the target furniture
  useEffect(() => {
    if (targetFurniture && controlsRef.current) {
      const pos = targetFurniture.position;
      const dims = targetFurniture.dimensions;
      
      // Calculate camera position based on furniture size
      const maxDim = Math.max(dims.width, dims.depth, dims.height);
      const distance = maxDim * 2;
      
      camera.position.set(
        pos[0] + distance * 0.7,
        pos[1] + dims.height + distance * 0.5,
        pos[2] + distance * 0.7
      );
      
      controlsRef.current.target.set(pos[0], pos[1] + dims.height / 2, pos[2]);
      controlsRef.current.update();
    }
  }, [targetFurniture, camera]);
  
  if (!targetFurniture) return null;
  
  // Get all items that might be on/near this furniture
  const nearbyItems = furniture.filter(f => {
    if (f.id === targetId) return false;
    const dx = Math.abs(f.position[0] - targetFurniture.position[0]);
    const dz = Math.abs(f.position[2] - targetFurniture.position[2]);
    const maxRange = Math.max(targetFurniture.dimensions.width, targetFurniture.dimensions.depth) + 0.5;
    return dx < maxRange && dz < maxRange;
  });
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <hemisphereLight color="#ffffff" groundColor="#d4e4ff" intensity={0.3} />
      
      <Environment preset="apartment" />
      
      {/* Floor reference - click to deselect */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[targetFurniture.position[0], 0, targetFurniture.position[2]]} 
        receiveShadow
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      
      <ContactShadows
        position={[targetFurniture.position[0], 0.001, targetFurniture.position[2]]}
        opacity={0.4}
        scale={5}
        blur={2}
        far={4}
      />
      
      {/* The target furniture (non-draggable in detail mode) - click to deselect */}
      <group 
        position={[targetFurniture.position[0], targetFurniture.position[1], targetFurniture.position[2]]}
        rotation={[0, (targetFurniture.rotation * Math.PI) / 180, 0]}
        onClick={(e) => { e.stopPropagation(); handleBackgroundClick(); }}
      >
        <FurnitureModel
          type={targetFurniture.type}
          dimensions={targetFurniture.dimensions}
          color={targetFurniture.color}
          isSelected={false}
          isHovered={false}
        />
        
        {/* Highlight surfaces when dragging */}
        {draggingItem && (
          <mesh position={[0, targetFurniture.dimensions.height + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[targetFurniture.dimensions.width * 0.95, targetFurniture.dimensions.depth * 0.95]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
      
      {/* Nearby items (draggable) */}
      {nearbyItems.map(item => (
        <DraggableFurniture key={item.id} item={item} />
      ))}
      
      <OrbitControls
        ref={controlsRef}
        enabled={isDragging !== true}
        enablePan={isDragging !== true}
        enableZoom={isDragging !== true}
        enableRotate={isDragging !== true}
        minDistance={0.5}
        maxDistance={5}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

// Check if a type is a book that supports orientations
const isBookType = (type: FurnitureType): boolean => {
  return ['book', 'book_stack', 'manga'].includes(type);
};

export function DetailEditMode() {
  const { 
    detailModeTarget, 
    setDetailModeTarget, 
    furniture, 
    addFurniture,
    setIsDragging,
    setSelectedId,
    selectedId,
    updateFurnitureOrientation,
    updateFurnitureSpineColor,
    updateFurniturePosition,
    saveForUndo,
    undo,
    canUndo,
  } = useRoomStore();
  
  // Get the selected item if it's a book
  const selectedItem = selectedId ? furniture.find(f => f.id === selectedId) : null;
  const isSelectedBook = selectedItem && isBookType(selectedItem.type);
  
  // Reset dragging state when entering detail mode and add safety cleanup
  useEffect(() => {
    if (detailModeTarget) {
      setIsDragging(false);
    }
    
    // Safety: reset isDragging on any pointer up to prevent stuck state
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      setIsDragging(false); // Reset when leaving detail mode
    };
  }, [detailModeTarget, setIsDragging]);
  
  const [draggingItem, setDraggingItem] = useState<FurnitureType | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const targetFurniture = furniture.find(f => f.id === detailModeTarget);
  
  // Check if target furniture is a bookshelf (for showing arrangement options)
  const isTargetBookshelf = targetFurniture && (
    targetFurniture.type === 'bookshelf' || 
    targetFurniture.type === 'tall_bookshelf' ||
    targetFurniture.type.includes('shelf')
  );
  
  // Get all book items on/near this furniture
  const getBooksOnFurniture = useCallback(() => {
    if (!targetFurniture) return [];
    return furniture.filter(f => {
      if (!isBookType(f.type)) return false;
      const dx = Math.abs(f.position[0] - targetFurniture.position[0]);
      const dz = Math.abs(f.position[2] - targetFurniture.position[2]);
      const maxRange = Math.max(targetFurniture.dimensions.width, targetFurniture.dimensions.depth) / 2 + 0.1;
      return dx < maxRange && dz < maxRange;
    });
  }, [furniture, targetFurniture]);
  
  // Arrangement preset: Shrine (center book face-out, others tightly flanking)
  // Only uses basic books (book, manga) - max 11 books
  const arrangeShrine = useCallback(() => {
    if (!targetFurniture) return;
    
    // Only get basic book types (not stacks or other items)
    const allItems = getBooksOnFurniture();
    const basicBooks = allItems.filter(f => f.type === 'book' || f.type === 'manga');
    
    // Limit to 11 books max for the shrine
    const books = basicBooks.slice(0, 11);
    if (books.length < 1) return;
    
    // Save state for undo
    saveForUndo();
    
    const centerX = targetFurniture.position[0];
    const baseY = targetFurniture.position[1] + 0.02;
    const centerZ = targetFurniture.position[2];
    
    // Center book is face-out and slightly raised
    const centerBook = books[0];
    if (centerBook) {
      const centerBookWidth = centerBook.dimensions.width * (centerBook.sizeVariant || 1);
      updateFurniturePosition(centerBook.id, [centerX, baseY + 0.01, centerZ + 0.02]); // Slightly forward
      updateFurnitureOrientation(centerBook.id, 'faceout');
      
      // Flanking books are upright and TIGHT against the center book
      const halfCenterWidth = centerBookWidth / 2;
      let leftX = centerX - halfCenterWidth - 0.008; // Start right next to center book
      let rightX = centerX + halfCenterWidth + 0.008;
      
      books.slice(1).forEach((book, i) => {
        const bookDepth = book.dimensions.depth * (book.sizeVariant || 1); // Spine width when upright
        const side = i % 2 === 0 ? -1 : 1; // Alternate left/right
        
        if (side === -1) {
          // Left side - place and move leftX further left
          updateFurniturePosition(book.id, [leftX - bookDepth / 2, baseY, centerZ]);
          leftX -= bookDepth + 0.002; // Very tight spacing
        } else {
          // Right side - place and move rightX further right
          updateFurniturePosition(book.id, [rightX + bookDepth / 2, baseY, centerZ]);
          rightX += bookDepth + 0.002;
        }
        updateFurnitureOrientation(book.id, 'upright');
      });
    }
  }, [targetFurniture, getBooksOnFurniture, updateFurniturePosition, updateFurnitureOrientation, saveForUndo]);
  
  // Arrangement preset: Row (neat vertical line)
  const arrangeRow = useCallback(() => {
    if (!targetFurniture) return;
    const books = getBooksOnFurniture();
    if (books.length < 1) return;
    
    // Save state for undo
    saveForUndo();
    
    const startX = targetFurniture.position[0] - targetFurniture.dimensions.width / 2 + 0.05;
    const baseY = targetFurniture.position[1] + 0.02;
    const centerZ = targetFurniture.position[2];
    
    let currentX = startX;
    books.forEach((book) => {
      const bookWidth = book.dimensions.depth * (book.sizeVariant || 1); // Spine width when upright
      updateFurniturePosition(book.id, [currentX + bookWidth / 2, baseY, centerZ]);
      updateFurnitureOrientation(book.id, 'upright');
      currentX += bookWidth + 0.005; // Tight spacing
    });
  }, [targetFurniture, getBooksOnFurniture, updateFurniturePosition, updateFurnitureOrientation, saveForUndo]);
  
  // Arrangement preset: Stack (horizontal pile)
  const arrangeStack = useCallback(() => {
    if (!targetFurniture) return;
    const books = getBooksOnFurniture();
    if (books.length < 1) return;
    
    // Save state for undo
    saveForUndo();
    
    const centerX = targetFurniture.position[0];
    const baseY = targetFurniture.position[1] + 0.02;
    const centerZ = targetFurniture.position[2];
    
    let currentY = baseY;
    books.forEach((book, i) => {
      const bookHeight = book.dimensions.depth * (book.sizeVariant || 1); // Thickness when flat
      const randomOffset = (Math.random() - 0.5) * 0.02;
      updateFurniturePosition(book.id, [centerX + randomOffset, currentY + bookHeight / 2, centerZ + randomOffset]);
      updateFurnitureOrientation(book.id, 'flat');
      currentY += bookHeight + 0.002;
    });
  }, [targetFurniture, getBooksOnFurniture, updateFurniturePosition, updateFurnitureOrientation, saveForUndo]);
  
  // Auto-arrange: Align all books to same Z
  const alignBooks = useCallback(() => {
    if (!targetFurniture) return;
    const books = getBooksOnFurniture();
    if (books.length < 1) return;
    
    // Save state for undo
    saveForUndo();
    
    const centerZ = targetFurniture.position[2];
    
    books.forEach((book) => {
      updateFurniturePosition(book.id, [book.position[0], book.position[1], centerZ]);
    });
  }, [targetFurniture, getBooksOnFurniture, updateFurniturePosition, saveForUndo]);
  
  // Auto-arrange: Space books evenly
  const spaceEvenly = useCallback(() => {
    if (!targetFurniture) return;
    const books = getBooksOnFurniture();
    if (books.length < 2) return;
    
    // Save state for undo
    saveForUndo();
    
    // Sort by current X position
    const sortedBooks = [...books].sort((a, b) => a.position[0] - b.position[0]);
    const minX = targetFurniture.position[0] - targetFurniture.dimensions.width / 2 + 0.05;
    const maxX = targetFurniture.position[0] + targetFurniture.dimensions.width / 2 - 0.05;
    const spacing = (maxX - minX) / (sortedBooks.length - 1);
    
    sortedBooks.forEach((book, i) => {
      updateFurniturePosition(book.id, [minX + i * spacing, book.position[1], book.position[2]]);
    });
  }, [targetFurniture, getBooksOnFurniture, updateFurniturePosition, saveForUndo]);
  
  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailModeTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDetailModeTarget]);
  
  // Handle drag start from panel
  const handleDragStart = (type: FurnitureType, e: React.DragEvent) => {
    setDraggingItem(type);
    e.dataTransfer.setData('text/plain', type);
  };
  
  // Handle drag over 3D canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreview({ x: e.clientX, y: e.clientY });
  };
  
  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreview(null);
    
    if (!draggingItem || !targetFurniture || !sceneCamera || !sceneGL) {
      setDraggingItem(null);
      return;
    }
    
    // Get drop position relative to canvas
    const rect = sceneGL.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycast to find drop position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), sceneCamera);
    
    // First, find where the ray hits a vertical plane through the furniture center
    // This gives us the Y height the user is aiming at
    const verticalPlane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), (targetFurniture.rotation * Math.PI) / 180),
      -targetFurniture.position[2]
    );
    const verticalHit = new THREE.Vector3();
    raycaster.ray.intersectPlane(verticalPlane, verticalHit);
    
    // Get the Y coordinate from where the user clicked
    const clickedY = verticalHit ? verticalHit.y : targetFurniture.position[1] + targetFurniture.dimensions.height / 2;
    
    // Create shelf surfaces for the furniture
    const surfaces: number[] = [];
    
    // Bottom shelf (floor of furniture)
    surfaces.push(targetFurniture.position[1] + 0.02); // Small offset above bottom
    
    // For bookshelves, add internal shelf surfaces
    if (targetFurniture.type.includes('bookshelf') || targetFurniture.type.includes('shelf')) {
      const shelfCount = 4;
      for (let i = 1; i <= shelfCount; i++) {
        surfaces.push(targetFurniture.position[1] + (i / shelfCount) * targetFurniture.dimensions.height);
      }
    } else {
      // For other furniture, just add top surface
      surfaces.push(targetFurniture.position[1] + targetFurniture.dimensions.height);
    }
    
    // Find the shelf closest to where user clicked (by Y coordinate)
    let bestY = surfaces[0];
    let bestDist = Math.abs(clickedY - surfaces[0]);
    
    for (const shelfY of surfaces) {
      const dist = Math.abs(clickedY - shelfY);
      if (dist < bestDist) {
        bestDist = dist;
        bestY = shelfY;
      }
    }
    
    // Get XZ position from the shelf plane
    const shelfPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -bestY);
    const dropPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(shelfPlane, dropPoint);
    
    if (dropPoint) {
      // Clamp to furniture bounds
      const halfW = targetFurniture.dimensions.width / 2 - 0.05;
      const halfD = targetFurniture.dimensions.depth / 2 - 0.05;
      
      const clampedX = Math.max(
        targetFurniture.position[0] - halfW,
        Math.min(targetFurniture.position[0] + halfW, dropPoint.x)
      );
      const clampedZ = Math.max(
        targetFurniture.position[2] - halfD,
        Math.min(targetFurniture.position[2] + halfD, dropPoint.z)
      );
      
      // Add the item
      const catalog = FURNITURE_CATALOG[draggingItem];
      if (catalog) {
        addFurniture({
          type: draggingItem,
          name: catalog.name,
          position: [clampedX, bestY, clampedZ],
          rotation: 0,
          dimensions: { ...catalog.dimensions },
          color: catalog.defaultColor,
        });
      }
    }
    
    setDraggingItem(null);
  };
  
  if (!detailModeTarget || !targetFurniture) return null;

  // Helper to get item icon
  const getItemIcon = (type: FurnitureType) => {
    const icons: Record<string, string> = {
      'book': '📕', 'book_stack': '📚', 'manga': '📖', 'gojo_manga': '👁️',
      'kaws_figure': '🤖', 'murakami_flower': '🌸', 'picture_frame': '🖼️',
      'vase': '🏺', 'lamp_small': '💡', 'clock': '🕐', 'trophy': '🏆', 'plant': '🪴'
    };
    return icons[type] || '📦';
  };
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm">✨</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Detail Editor</span>
                  <span className="truncate text-xs">{targetFurniture.name}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          {/* Book Controls - Collapsible */}
          {isSelectedBook && selectedItem && (
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Book Controls
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {[
                        { value: 'upright' as BookOrientation, icon: '📕', label: 'Upright' },
                        { value: 'flat' as BookOrientation, icon: '📖', label: 'Flat' },
                        { value: 'faceout' as BookOrientation, icon: '🖼️', label: 'Face Out' },
                      ].map(({ value, icon, label }) => (
                        <SidebarMenuItem key={value}>
                          <SidebarMenuButton
                            onClick={() => updateFurnitureOrientation(selectedItem.id, value)}
                            isActive={selectedItem.orientation === value}
                          >
                            <span>{icon}</span>
                            <span>{label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                    
                    <div className="mt-3 px-2">
                      <p className="text-xs text-muted-foreground mb-2">Spine Color</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SPINE_COLORS.slice(0, 12).map((c) => (
                          <button
                            key={c}
                            onClick={() => updateFurnitureSpineColor(selectedItem.id, c)}
                            className={`w-5 h-5 rounded transition-transform hover:scale-110 ${
                              selectedItem.spineColor === c ? 'ring-2 ring-sidebar-ring ring-offset-1' : 'border border-sidebar-border'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )}
          
          {/* Arrangements - Collapsible (only for bookshelves) */}
          {isTargetBookshelf && (
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Arrangements
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={arrangeShrine}>
                          <span>🏛️</span>
                          <span>Shrine</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={arrangeRow}>
                          <span>📚</span>
                          <span>Row</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={arrangeStack}>
                          <span>📦</span>
                          <span>Stack</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )}
          
          {/* Tools */}
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isTargetBookshelf && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={alignBooks}>
                        <AlignHorizontalDistributeCenter className="size-4" />
                        <span>Align Books</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={spaceEvenly}>
                        <AlignVerticalDistributeCenter className="size-4" />
                        <span>Space Evenly</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={undo} disabled={!canUndo}>
                    <Undo2 className="size-4" />
                    <span>Undo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarSeparator />
          
          {/* Items - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="flex-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center">
                  Drag Items
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SMALL_ITEMS.map(type => {
                      const catalog = FURNITURE_CATALOG[type];
                      if (!catalog) return null;
                      
                      const isActive = draggingItem === type;
                      
                      return (
                        <SidebarMenuItem key={type}>
                          <SidebarMenuButton
                            draggable
                            onDragStart={(e) => handleDragStart(type, e as unknown as React.DragEvent)}
                            onDragEnd={() => setDraggingItem(null)}
                            isActive={isActive}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <span className="text-lg">{getItemIcon(type)}</span>
                            <span>{catalog.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => setDetailModeTarget(null)}
                className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary-foreground/20">
                  <span>✓</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Done Editing</span>
                  <span className="truncate text-xs">Return to main view</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        {/* 3D View */}
        <div 
          ref={canvasContainerRef}
          className="h-full relative bg-[#f0f4f8]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border">
              <span className="text-sm font-medium text-foreground">
                🔍 Detail View: {targetFurniture.name}
              </span>
            </div>
            <button
              onClick={() => setDetailModeTarget(null)}
              className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg hover:bg-white transition-colors border"
            >
              <span className="text-sm font-medium text-foreground">ESC to Exit</span>
            </button>
          </div>
          
          {/* Drag preview */}
          {draggingItem && dragPreview && (
            <div 
              className="fixed pointer-events-none z-50 bg-sidebar-primary text-sidebar-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg"
              style={{ left: dragPreview.x + 10, top: dragPreview.y + 10 }}
            >
              {FURNITURE_CATALOG[draggingItem]?.name}
            </div>
          )}
          
          <Canvas
            shadows
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            dpr={[1, 2]}
            onPointerMissed={() => setSelectedId(null)}
          >
            <color attach="background" args={['#f0f4f8']} />
            <Suspense fallback={null}>
              <DetailScene 
                targetId={detailModeTarget} 
                draggingItem={draggingItem}
              />
            </Suspense>
          </Canvas>
          
          {/* Bottom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-2 py-2 shadow-lg flex items-center gap-3 border">
            <span className="text-sm text-muted-foreground pl-2">
              🖱️ Orbit: Left drag • Zoom: Scroll • Pan: Right drag
            </span>
            <button
              onClick={() => setSelectedId(null)}
              className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              ✓ Deselect
            </button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

