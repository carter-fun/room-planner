import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FurnitureType =
  // Beds
  | 'bed'
  | 'king_bed'
  | 'twin_bed'
  | 'bunk_bed'
  // Desks & Work
  | 'desk'
  | 'l_desk'
  | 'standing_desk'
  | 'gaming_desk'
  // Seating
  | 'chair'
  | 'office_chair'
  | 'gaming_chair'
  | 'armchair'
  | 'couch'
  | 'sectional_couch'
  | 'loveseat'
  | 'bean_bag'
  // Storage
  | 'bookshelf'
  | 'tall_bookshelf'
  | 'dresser'
  | 'wardrobe'
  | 'nightstand'
  | 'filing_cabinet'
  | 'storage_cube'
  // Tables
  | 'coffee_table'
  | 'dining_table'
  | 'side_table'
  | 'console_table'
  // Entertainment
  | 'tv_stand'
  | 'tv_wall'
  | 'monitor'
  | 'dual_monitor'
  | 'gaming_pc'
  // Decor & Other
  | 'plant'
  | 'floor_lamp'
  | 'ceiling_fan'
  | 'rug'
  | 'mirror'
  | 'christmas_tree'
  // Books & Small Items
  | 'book'
  | 'book_stack'
  | 'manga'
  | 'gojo_manga'
  | 'picture_frame'
  | 'vase'
  | 'lamp_small'
  | 'clock'
  | 'trophy'
  // Kitchen/Dining
  | 'bar_stool'
  | 'kitchen_island'
  // Exercise
  | 'treadmill'
  | 'exercise_bike';

// Book orientations for organizing
export type BookOrientation = 'upright' | 'flat' | 'faceout';

// Curated palette of book spine colors
export const SPINE_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', // Dark blues
  '#e94560', '#ff6b6b', '#ffa502', // Reds/oranges
  '#2ecc71', '#27ae60', '#1abc9c', // Greens
  '#9b59b6', '#8e44ad', '#6c5ce7', // Purples
  '#f39c12', '#e74c3c', '#ecf0f1', // Accents
  '#2d3436', '#636e72', '#b2bec3', // Grays
  '#fdcb6e', '#e17055', '#00b894', // Bright
];

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  name: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in degrees
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
  // Book-specific properties
  orientation?: BookOrientation; // For books: upright, flat, or face-out
  spineColor?: string; // Random color for book spines
  sizeVariant?: number; // Scale multiplier (0.85-1.15) for realistic variety
}

// Placed scanned models from Makerspace
export interface PlacedScannedItem {
  id: string;
  makerspaceItemId: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  blobUrl: string;
}

export interface RoomDimensions {
  width: number;  // X-axis (meters)
  length: number; // Z-axis (meters)
  height: number; // Y-axis (meters)
}

interface RoomState {
  // Room configuration
  roomDimensions: RoomDimensions;
  setRoomDimensions: (dimensions: Partial<RoomDimensions>) => void;
  
  // Furniture management
  furniture: FurnitureItem[];
  addFurniture: (item: Omit<FurnitureItem, 'id'>) => void;
  removeFurniture: (id: string) => void;
  updateFurniturePosition: (id: string, position: [number, number, number]) => void;
  updateFurnitureRotation: (id: string, rotation: number) => void;
  updateFurnitureDimensions: (id: string, dimensions: Partial<FurnitureItem['dimensions']>) => void;
  updateFurnitureColor: (id: string, color: string) => void;
  updateFurnitureOrientation: (id: string, orientation: BookOrientation) => void;
  updateFurnitureSpineColor: (id: string, spineColor: string) => void;
  
  // Scanned items from Makerspace
  scannedItems: PlacedScannedItem[];
  addScannedItem: (item: Omit<PlacedScannedItem, 'id'>) => void;
  removeScannedItem: (id: string) => void;
  updateScannedItemPosition: (id: string, position: [number, number, number]) => void;
  updateScannedItemRotation: (id: string, rotation: number) => void;
  
  // Selection
  selectedId: string | null;
  selectedType: 'furniture' | 'scanned' | null;
  setSelectedId: (id: string | null, type?: 'furniture' | 'scanned') => void;
  
  // Dragging state (to disable camera controls)
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  
  // Detail edit mode (for close-up furniture editing)
  detailModeTarget: string | null;
  setDetailModeTarget: (id: string | null) => void;
  
  // Undo functionality
  undoStack: FurnitureItem[][];
  saveForUndo: () => void;
  undo: () => void;
  canUndo: boolean;
  
  // Grid settings
  gridSize: number;
  setGridSize: (size: number) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  
  // Export/Import
  exportRoom: () => string;
  importRoom: (json: string) => boolean;
  clearRoom: () => void;
}

// Furniture catalog with default dimensions (in meters) - Modern Apple-style colors
export const FURNITURE_CATALOG: Record<FurnitureType, {
  name: string;
  dimensions: { width: number; height: number; depth: number };
  defaultColor: string;
  category: string;
}> = {
  // BEDS
  bed: { name: 'Queen Bed', dimensions: { width: 1.6, height: 0.5, depth: 2.0 }, defaultColor: '#c4b5a0', category: 'Beds' },
  king_bed: { name: 'King Bed', dimensions: { width: 2.0, height: 0.55, depth: 2.1 }, defaultColor: '#8b7355', category: 'Beds' },
  twin_bed: { name: 'Twin Bed', dimensions: { width: 1.0, height: 0.45, depth: 2.0 }, defaultColor: '#a08060', category: 'Beds' },
  bunk_bed: { name: 'Bunk Bed', dimensions: { width: 1.0, height: 1.7, depth: 2.0 }, defaultColor: '#5c4033', category: 'Beds' },
  
  // DESKS & WORK
  desk: { name: 'Desk', dimensions: { width: 1.2, height: 0.75, depth: 0.6 }, defaultColor: '#d4c4b0', category: 'Desks' },
  l_desk: { name: 'L-Shaped Desk', dimensions: { width: 1.8, height: 0.75, depth: 1.5 }, defaultColor: '#3a3a3a', category: 'Desks' },
  standing_desk: { name: 'Standing Desk', dimensions: { width: 1.5, height: 1.1, depth: 0.7 }, defaultColor: '#2a2a2a', category: 'Desks' },
  gaming_desk: { name: 'Gaming Desk', dimensions: { width: 1.6, height: 0.75, depth: 0.8 }, defaultColor: '#1a1a1a', category: 'Desks' },
  
  // SEATING
  chair: { name: 'Chair', dimensions: { width: 0.5, height: 0.9, depth: 0.5 }, defaultColor: '#5a5a5a', category: 'Seating' },
  office_chair: { name: 'Office Chair', dimensions: { width: 0.65, height: 1.2, depth: 0.65 }, defaultColor: '#2c2c2c', category: 'Seating' },
  gaming_chair: { name: 'Gaming Chair', dimensions: { width: 0.7, height: 1.35, depth: 0.7 }, defaultColor: '#1a1a2e', category: 'Seating' },
  armchair: { name: 'Armchair', dimensions: { width: 0.9, height: 1.0, depth: 0.85 }, defaultColor: '#6b5b4f', category: 'Seating' },
  couch: { name: 'Couch', dimensions: { width: 2.2, height: 0.85, depth: 0.95 }, defaultColor: '#8b9aa3', category: 'Seating' },
  sectional_couch: { name: 'Sectional Couch', dimensions: { width: 3.0, height: 0.85, depth: 2.0 }, defaultColor: '#5a6a73', category: 'Seating' },
  loveseat: { name: 'Loveseat', dimensions: { width: 1.5, height: 0.85, depth: 0.9 }, defaultColor: '#7a8a93', category: 'Seating' },
  bean_bag: { name: 'Bean Bag', dimensions: { width: 0.9, height: 0.7, depth: 0.9 }, defaultColor: '#e74c3c', category: 'Seating' },
  
  // STORAGE
  bookshelf: { name: 'Bookshelf', dimensions: { width: 0.8, height: 1.2, depth: 0.3 }, defaultColor: '#8b5a2b', category: 'Storage' },
  tall_bookshelf: { name: 'Tall Bookshelf', dimensions: { width: 0.9, height: 2.0, depth: 0.35 }, defaultColor: '#654321', category: 'Storage' },
  dresser: { name: 'Dresser', dimensions: { width: 1.3, height: 0.9, depth: 0.5 }, defaultColor: '#5c4033', category: 'Storage' },
  wardrobe: { name: 'Wardrobe', dimensions: { width: 1.5, height: 2.0, depth: 0.6 }, defaultColor: '#f5f0eb', category: 'Storage' },
  nightstand: { name: 'Nightstand', dimensions: { width: 0.5, height: 0.55, depth: 0.45 }, defaultColor: '#d0c4b8', category: 'Storage' },
  filing_cabinet: { name: 'Filing Cabinet', dimensions: { width: 0.4, height: 0.7, depth: 0.6 }, defaultColor: '#4a4a4a', category: 'Storage' },
  storage_cube: { name: 'Storage Cube', dimensions: { width: 0.4, height: 0.4, depth: 0.4 }, defaultColor: '#f0f0f0', category: 'Storage' },
  
  // TABLES
  coffee_table: { name: 'Coffee Table', dimensions: { width: 1.2, height: 0.45, depth: 0.6 }, defaultColor: '#b8a898', category: 'Tables' },
  dining_table: { name: 'Dining Table', dimensions: { width: 1.6, height: 0.75, depth: 0.9 }, defaultColor: '#c8baa8', category: 'Tables' },
  side_table: { name: 'Side Table', dimensions: { width: 0.5, height: 0.6, depth: 0.5 }, defaultColor: '#a09080', category: 'Tables' },
  console_table: { name: 'Console Table', dimensions: { width: 1.2, height: 0.8, depth: 0.35 }, defaultColor: '#8a7a6a', category: 'Tables' },
  
  // ENTERTAINMENT
  tv_stand: { name: 'TV Stand', dimensions: { width: 1.8, height: 0.5, depth: 0.45 }, defaultColor: '#2a2a2a', category: 'Entertainment' },
  tv_wall: { name: 'Wall TV', dimensions: { width: 1.5, height: 0.85, depth: 0.08 }, defaultColor: '#0a0a0a', category: 'Entertainment' },
  monitor: { name: 'Monitor', dimensions: { width: 0.6, height: 0.45, depth: 0.2 }, defaultColor: '#1a1a1a', category: 'Entertainment' },
  dual_monitor: { name: 'Dual Monitors', dimensions: { width: 1.2, height: 0.45, depth: 0.2 }, defaultColor: '#1a1a1a', category: 'Entertainment' },
  gaming_pc: { name: 'Gaming PC', dimensions: { width: 0.25, height: 0.5, depth: 0.5 }, defaultColor: '#0f0f0f', category: 'Entertainment' },
  
  // DECOR & OTHER
  plant: { name: 'Plant', dimensions: { width: 0.4, height: 1.0, depth: 0.4 }, defaultColor: '#228b22', category: 'Decor' },
  floor_lamp: { name: 'Floor Lamp', dimensions: { width: 0.35, height: 1.7, depth: 0.35 }, defaultColor: '#f5f5dc', category: 'Decor' },
  ceiling_fan: { name: 'Ceiling Fan', dimensions: { width: 1.2, height: 0.5, depth: 1.2 }, defaultColor: '#8b4513', category: 'Decor' },
  rug: { name: 'Rug', dimensions: { width: 2.5, height: 0.02, depth: 1.8 }, defaultColor: '#8b7355', category: 'Decor' },
  mirror: { name: 'Mirror', dimensions: { width: 0.8, height: 1.5, depth: 0.05 }, defaultColor: '#c0c0c0', category: 'Decor' },
  christmas_tree: { name: 'Christmas Tree', dimensions: { width: 1.2, height: 2.2, depth: 1.2 }, defaultColor: '#228b22', category: 'Decor' },
  
  // BOOKS & SMALL ITEMS (for shelf organization)
  book: { name: 'Book', dimensions: { width: 0.15, height: 0.22, depth: 0.03 }, defaultColor: '#8B4513', category: 'Small Items' },
  book_stack: { name: 'Book Stack', dimensions: { width: 0.2, height: 0.15, depth: 0.15 }, defaultColor: '#654321', category: 'Small Items' },
  manga: { name: 'Manga', dimensions: { width: 0.11, height: 0.17, depth: 0.02 }, defaultColor: '#f0f0f0', category: 'Small Items' },
  gojo_manga: { name: 'Gojo Panel', dimensions: { width: 0.15, height: 0.21, depth: 0.02 }, defaultColor: '#ffffff', category: 'Small Items' },
  picture_frame: { name: 'Picture Frame', dimensions: { width: 0.2, height: 0.25, depth: 0.03 }, defaultColor: '#8B4513', category: 'Small Items' },
  vase: { name: 'Vase', dimensions: { width: 0.12, height: 0.25, depth: 0.12 }, defaultColor: '#4a90a4', category: 'Small Items' },
  lamp_small: { name: 'Small Lamp', dimensions: { width: 0.15, height: 0.3, depth: 0.15 }, defaultColor: '#f5deb3', category: 'Small Items' },
  clock: { name: 'Clock', dimensions: { width: 0.15, height: 0.15, depth: 0.05 }, defaultColor: '#2a2a2a', category: 'Small Items' },
  trophy: { name: 'Trophy', dimensions: { width: 0.1, height: 0.25, depth: 0.1 }, defaultColor: '#FFD700', category: 'Small Items' },
  
  // KITCHEN/DINING
  bar_stool: { name: 'Bar Stool', dimensions: { width: 0.4, height: 0.75, depth: 0.4 }, defaultColor: '#3a3a3a', category: 'Dining' },
  kitchen_island: { name: 'Kitchen Island', dimensions: { width: 1.5, height: 0.9, depth: 0.8 }, defaultColor: '#f0f0f0', category: 'Dining' },
  
  // EXERCISE
  treadmill: { name: 'Treadmill', dimensions: { width: 0.8, height: 1.4, depth: 1.8 }, defaultColor: '#2a2a2a', category: 'Exercise' },
  exercise_bike: { name: 'Exercise Bike', dimensions: { width: 0.6, height: 1.2, depth: 1.2 }, defaultColor: '#1a1a1a', category: 'Exercise' },
};

const generateId = () => `furniture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to get random spine color
const getRandomSpineColor = () => SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)];

// Helper to get random size variant (0.85 to 1.15)
const getRandomSizeVariant = () => 0.85 + Math.random() * 0.3;

// Check if a type is a book/small item that supports orientations
const isBookType = (type: FurnitureType): boolean => {
  return ['book', 'book_stack', 'manga'].includes(type);
};

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      // Default room: 5m x 4m x 2.8m
      roomDimensions: { width: 5, length: 4, height: 2.8 },
      
      setRoomDimensions: (dimensions) => 
        set((state) => ({
          roomDimensions: { ...state.roomDimensions, ...dimensions }
        })),
      
      furniture: [],
      
      addFurniture: (item) => 
        set((state) => {
          const newItem: FurnitureItem = {
            ...item,
            id: generateId(),
          };
          
          // Auto-assign book properties for book types
          if (isBookType(item.type)) {
            newItem.orientation = newItem.orientation || 'upright';
            newItem.spineColor = newItem.spineColor || getRandomSpineColor();
            newItem.sizeVariant = newItem.sizeVariant || getRandomSizeVariant();
          }
          
          return { furniture: [...state.furniture, newItem] };
        }),
      
      removeFurniture: (id) =>
        set((state) => ({
          furniture: state.furniture.filter((f) => f.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId
        })),
      
      updateFurniturePosition: (id, position) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, position } : f
          )
        })),
      
      updateFurnitureRotation: (id, rotation) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, rotation } : f
          )
        })),
      
      updateFurnitureDimensions: (id, dimensions) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, dimensions: { ...f.dimensions, ...dimensions } } : f
          )
        })),
      
      updateFurnitureColor: (id, color) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, color } : f
          )
        })),
      
      updateFurnitureOrientation: (id, orientation) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, orientation } : f
          )
        })),
      
      updateFurnitureSpineColor: (id, spineColor) =>
        set((state) => ({
          furniture: state.furniture.map((f) =>
            f.id === id ? { ...f, spineColor } : f
          )
        })),
      
      // Scanned items
      scannedItems: [],
      
      addScannedItem: (item) =>
        set((state) => ({
          scannedItems: [...state.scannedItems, { ...item, id: generateId() }]
        })),
      
      removeScannedItem: (id) =>
        set((state) => ({
          scannedItems: state.scannedItems.filter((s) => s.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          selectedType: state.selectedId === id ? null : state.selectedType,
        })),
      
      updateScannedItemPosition: (id, position) =>
        set((state) => ({
          scannedItems: state.scannedItems.map((s) =>
            s.id === id ? { ...s, position } : s
          )
        })),
      
      updateScannedItemRotation: (id, rotation) =>
        set((state) => ({
          scannedItems: state.scannedItems.map((s) =>
            s.id === id ? { ...s, rotation } : s
          )
        })),
      
      selectedId: null,
      selectedType: null,
      setSelectedId: (id, type = 'furniture') => set({ selectedId: id, selectedType: id ? type : null }),
      
      // Dragging state
      isDragging: false,
      setIsDragging: (dragging) => set({ isDragging: dragging }),
      
      // Detail edit mode
      detailModeTarget: null,
      setDetailModeTarget: (id) => set({ detailModeTarget: id }),
      
      // Undo functionality - stores up to 20 previous states
      undoStack: [],
      canUndo: false,
      
      saveForUndo: () => set((state) => {
        // Deep clone the current furniture state
        const snapshot = JSON.parse(JSON.stringify(state.furniture));
        const newStack = [...state.undoStack, snapshot].slice(-20); // Keep last 20 states
        return { undoStack: newStack, canUndo: true };
      }),
      
      undo: () => set((state) => {
        if (state.undoStack.length === 0) return state;
        const newStack = [...state.undoStack];
        const previousState = newStack.pop();
        return { 
          furniture: previousState || state.furniture,
          undoStack: newStack,
          canUndo: newStack.length > 0,
        };
      }),
      
      gridSize: 0.1, // 10cm grid (smoother movement)
      setGridSize: (size) => set({ gridSize: size }),
      
      showGrid: true,
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      
      exportRoom: () => {
        const state = get();
        return JSON.stringify({
          roomDimensions: state.roomDimensions,
          furniture: state.furniture,
          scannedItems: state.scannedItems,
          gridSize: state.gridSize,
        }, null, 2);
      },
      
      importRoom: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            roomDimensions: data.roomDimensions,
            furniture: data.furniture,
            scannedItems: data.scannedItems || [],
            gridSize: data.gridSize || 0.25,
            selectedId: null,
            selectedType: null,
          });
          return true;
        } catch {
          return false;
        }
      },
      
      clearRoom: () => set({ furniture: [], scannedItems: [], selectedId: null, selectedType: null }),
    }),
    {
      name: 'room-planner-storage',
    }
  )
);

