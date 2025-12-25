'use client';

import { useState, useRef } from 'react';
import {
  Home,
  Box,
  Settings,
  ChevronDown,
  Trash2,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Download,
  Upload,
  Sparkles,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react';
import { useRoomStore, FURNITURE_CATALOG, FurnitureType } from '@/store/roomStore';
import { FurnitureThumbnail } from './FurnitureThumbnail';
import { playAddSound } from '@/lib/sounds';
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Size presets for different furniture types
const getDefaultPresets = (type: FurnitureType) => {
  const catalog = FURNITURE_CATALOG[type];
  if (!catalog) {
    return [
      { name: 'Small', dimensions: { width: 0.8, height: 0.8, depth: 0.8 } },
      { name: 'Standard', dimensions: { width: 1.0, height: 1.0, depth: 1.0 } },
      { name: 'Large', dimensions: { width: 1.2, height: 1.2, depth: 1.2 } },
    ];
  }
  return [
    { name: 'Small', dimensions: { width: catalog.dimensions.width * 0.8, height: catalog.dimensions.height, depth: catalog.dimensions.depth * 0.8 } },
    { name: 'Standard', dimensions: catalog.dimensions },
    { name: 'Large', dimensions: { width: catalog.dimensions.width * 1.2, height: catalog.dimensions.height, depth: catalog.dimensions.depth * 1.2 } },
  ];
};

// Color palette for furniture
const COLOR_PALETTE = [
  { name: 'Oak', color: '#c4b5a0' },
  { name: 'Walnut', color: '#5c4033' },
  { name: 'White', color: '#f5f0eb' },
  { name: 'Black', color: '#2a2a2a' },
  { name: 'Gray', color: '#8b9aa3' },
  { name: 'Navy', color: '#2c3e50' },
  { name: 'Forest', color: '#2d5a4a' },
  { name: 'Burgundy', color: '#722f37' },
];

// Large furniture that can have items placed on them
const isLargeFurniture = (type: FurnitureType) => {
  const largeTypes: FurnitureType[] = [
    'bed', 'king_bed', 'twin_bed', 'bunk_bed',
    'desk', 'l_desk', 'standing_desk', 'gaming_desk',
    'bookshelf', 'tall_bookshelf', 'dresser', 'wardrobe', 'nightstand',
    'coffee_table', 'dining_table', 'side_table', 'console_table',
    'tv_stand', 'couch', 'sectional_couch', 'loveseat', 'armchair',
    'kitchen_island', 'filing_cabinet', 'storage_cube'
  ];
  return largeTypes.includes(type);
};

// Group furniture by category
const FURNITURE_CATEGORIES = {
  'Beds': ['bed', 'king_bed', 'twin_bed', 'bunk_bed'] as FurnitureType[],
  'Desks': ['desk', 'l_desk', 'standing_desk', 'gaming_desk'] as FurnitureType[],
  'Seating': ['chair', 'office_chair', 'gaming_chair', 'armchair', 'couch', 'sectional_couch', 'loveseat', 'bean_bag', 'bar_stool'] as FurnitureType[],
  'Storage': ['bookshelf', 'tall_bookshelf', 'dresser', 'wardrobe', 'nightstand', 'filing_cabinet', 'storage_cube'] as FurnitureType[],
  'Tables': ['coffee_table', 'dining_table', 'side_table', 'console_table', 'tv_stand', 'kitchen_island'] as FurnitureType[],
  'Tech': ['tv_wall', 'monitor', 'dual_monitor', 'gaming_pc'] as FurnitureType[],
  'Decor': ['plant', 'floor_lamp', 'ceiling_fan', 'rug', 'mirror', 'christmas_tree', 'picture_frame', 'vase', 'small_lamp', 'clock', 'trophy'] as FurnitureType[],
  'Books': ['book', 'book_stack', 'manga', 'gojo_manga'] as FurnitureType[],
  'Collectibles': ['kaws_figure', 'murakami_flower'] as FurnitureType[],
  'Fitness': ['treadmill', 'exercise_bike'] as FurnitureType[],
};

export function AppSidebar() {
  const {
    roomDimensions,
    setRoomDimensions,
    furniture,
    addFurniture,
    removeFurniture,
    selectedId,
    selectedType,
    setSelectedId,
    updateFurnitureRotation,
    updateFurnitureDimensions,
    updateFurnitureColor,
    updateFurniturePosition,
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
    exportRoom,
    importRoom,
    clearRoom,
    setDetailModeTarget,
    saveForUndo,
  } = useRoomStore();
  
  const [activeTab, setActiveTab] = useState<'furniture' | 'room' | 'settings'>('furniture');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedFurniture = selectedType === 'furniture' ? furniture.find(f => f.id === selectedId) : null;
  
  const handleAddFurniture = (type: FurnitureType) => {
    saveForUndo();
    const catalog = FURNITURE_CATALOG[type];
    
    // Wall-mounted items get special initial positioning
    const isWallMounted = type === 'tv_wall' || type === 'mirror' || type === 'picture_frame';
    const isCeilingMounted = type === 'ceiling_fan';
    
    let initialPosition: [number, number, number] = [0, 0, 0];
    let initialRotation = 0;
    
    if (isWallMounted) {
      // Place on the back wall at eye level
      const wallZ = -(roomDimensions.length / 2) + (catalog.dimensions.depth / 2) + 0.02;
      initialPosition = [0, 1.4, wallZ];
    } else if (isCeilingMounted) {
      // Place on ceiling
      initialPosition = [0, roomDimensions.height - 0.3, 0];
    }
    
    addFurniture({
      type,
      name: catalog.name,
      position: initialPosition,
      rotation: initialRotation,
      dimensions: { ...catalog.dimensions },
      color: catalog.defaultColor,
    });
    playAddSound();
  };
  
  const handleExport = () => {
    const json = exportRoom();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'room-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const success = importRoom(json);
        if (!success) {
          alert('Failed to import room layout. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleRotate = (delta: number) => {
    if (selectedId && selectedFurniture) {
      const newRotation = (selectedFurniture.rotation + delta + 360) % 360;
      updateFurnitureRotation(selectedId, newRotation);
    }
  };

  const handlePresetSelect = (preset: { dimensions: { width: number; height: number; depth: number } }) => {
    if (selectedId) {
      updateFurnitureDimensions(selectedId, preset.dimensions);
    }
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    if (selectedId) {
      updateFurnitureDimensions(selectedId, { [dimension]: value });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedId) {
      updateFurnitureColor(selectedId, color);
    }
  };
  
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                <Home className="size-4 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SpacedApp</span>
                <span className="truncate text-xs text-muted-foreground">Design your space</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Tab Navigation */}
        <SidebarMenu className="px-2">
          {(['furniture', 'room', 'settings'] as const).map((tab) => (
            <SidebarMenuItem key={tab}>
              <SidebarMenuButton 
                onClick={() => setActiveTab(tab)}
                isActive={activeTab === tab}
              >
                {tab === 'furniture' && <Box className="size-4" />}
                {tab === 'room' && <Grid3X3 className="size-4" />}
                {tab === 'settings' && <Settings className="size-4" />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {activeTab === 'furniture' && (
          <>
            {/* Selected Item Controls */}
            {selectedFurniture && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedFurniture.color }} />
                    {selectedFurniture.name}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => { saveForUndo(); removeFurniture(selectedId!); }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-2 space-y-4">
                  {/* Rotation Controls */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Rotation</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRotate(-45)}>
                        <RotateCcw className="w-3 h-3 mr-1" /> 45°
                      </Button>
                      <span className="w-14 text-center font-bold text-sm">{selectedFurniture.rotation}°</span>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRotate(45)}>
                        <RotateCw className="w-3 h-3 mr-1" /> 45°
                      </Button>
                    </div>
                  </div>
                  
                  {/* Height Position */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Height: {selectedFurniture.position[1].toFixed(2)}m</label>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.05"
                      value={selectedFurniture.position[1]}
                      onChange={(e) => updateFurniturePosition(selectedId!, [
                        selectedFurniture.position[0],
                        parseFloat(e.target.value),
                        selectedFurniture.position[2]
                      ])}
                      className="w-full"
                    />
                    {selectedFurniture.position[1] > 0.01 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => updateFurniturePosition(selectedId!, [
                          selectedFurniture.position[0],
                          0,
                          selectedFurniture.position[2]
                        ])}
                      >
                        <ArrowDown className="w-3 h-3 mr-1" /> Drop to Floor
                      </Button>
                    )}
                  </div>
                  
                  {/* Edit Details Button */}
                  {isLargeFurniture(selectedFurniture.type) && (
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                      onClick={() => setDetailModeTarget(selectedId)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                  )}

                  {/* Size Presets */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Size Preset</label>
                    <div className="grid grid-cols-3 gap-1">
                      {getDefaultPresets(selectedFurniture.type).map((preset) => (
                        <Button
                          key={preset.name}
                          variant={
                            selectedFurniture.dimensions.width === preset.dimensions.width &&
                            selectedFurniture.dimensions.depth === preset.dimensions.depth
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="text-xs"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Dimensions */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Custom Size</label>
                    {['width', 'depth', 'height'].map((dim) => (
                      <div key={dim} className="flex items-center gap-2">
                        <span className="text-xs w-12 text-muted-foreground capitalize">{dim}</span>
                        <input
                          type="range"
                          min={dim === 'height' ? '0.2' : '0.3'}
                          max={dim === 'height' ? '2.5' : '4'}
                          step={dim === 'height' ? '0.05' : '0.1'}
                          value={selectedFurniture.dimensions[dim as 'width' | 'height' | 'depth']}
                          onChange={(e) => handleDimensionChange(dim as 'width' | 'height' | 'depth', parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono w-12 text-right">
                          {selectedFurniture.dimensions[dim as 'width' | 'height' | 'depth'].toFixed(1)}m
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleColorChange(c.color)}
                          title={c.name}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            selectedFurniture.color === c.color
                              ? 'ring-2 ring-amber-500 ring-offset-2 scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.color }}
                        />
                      ))}
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            <SidebarSeparator />
            
            {/* Furniture Catalog by Category */}
            <SidebarGroup>
              <SidebarGroupLabel>Add Furniture</SidebarGroupLabel>
              <SidebarGroupContent>
                {Object.entries(FURNITURE_CATEGORIES).map(([category, types]) => (
                  <Collapsible key={category} defaultOpen={category === 'Beds' || category === 'Desks'}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {category}
                      </span>
                      <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {types.filter(type => FURNITURE_CATALOG[type]).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleAddFurniture(type)}
                            className="flex flex-col items-center p-3 rounded-xl text-center bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-amber-400/50 active:scale-[0.98] transition-all duration-200 group"
                          >
                            <div className="w-12 h-12 mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-1.5 shadow-inner">
                              <FurnitureThumbnail type={type} className="w-full h-full" />
                            </div>
                            <span className="text-[10px] font-semibold leading-tight line-clamp-2 text-gray-700 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                              {FURNITURE_CATALOG[type].name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            {/* Placed Items */}
            {furniture.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>
                  Placed Items ({furniture.length})
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {furniture.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setSelectedId(item.id)}
                          isActive={selectedId === item.id}
                          className="justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="truncate text-xs">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.rotation}°</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
        
        {activeTab === 'room' && (
          <SidebarGroup>
            <SidebarGroupLabel>Room Dimensions</SidebarGroupLabel>
            <SidebarGroupContent className="px-2 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Width (X)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={roomDimensions.width}
                    onChange={(e) => setRoomDimensions({ width: parseFloat(e.target.value) || 1 })}
                    min="1"
                    max="20"
                    step="0.5"
                    className="w-full px-3 py-2 rounded-md bg-sidebar-accent border border-sidebar-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Length (Z)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={roomDimensions.length}
                    onChange={(e) => setRoomDimensions({ length: parseFloat(e.target.value) || 1 })}
                    min="1"
                    max="20"
                    step="0.5"
                    className="w-full px-3 py-2 rounded-md bg-sidebar-accent border border-sidebar-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Height (Y)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={roomDimensions.height}
                    onChange={(e) => setRoomDimensions({ height: parseFloat(e.target.value) || 1 })}
                    min="2"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-2 rounded-md bg-sidebar-accent border border-sidebar-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-sidebar-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Floor Area</span>
                <span className="text-sm font-bold text-foreground">
                  {(roomDimensions.width * roomDimensions.length).toFixed(1)} m²
                </span>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {activeTab === 'settings' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Grid Settings</SidebarGroupLabel>
              <SidebarGroupContent className="px-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Show Grid</span>
                  <button
                    onClick={toggleGrid}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      showGrid 
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                        : 'bg-sidebar-accent'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      showGrid ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Grid Size</label>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-sidebar-accent border border-sidebar-border text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring cursor-pointer"
                  >
                    <option value="0.1">10 cm (Precise)</option>
                    <option value="0.25">25 cm (Standard)</option>
                    <option value="0.5">50 cm (Large)</option>
                    <option value="1">1 meter (Extra Large)</option>
                  </select>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
              <SidebarGroupLabel>Save & Load</SidebarGroupLabel>
              <SidebarGroupContent className="px-2 space-y-2">
                <Button className="w-full" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Layout
                </Button>
                
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Layout
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Clear all furniture from the room?')) {
                      clearRoom();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Room
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
              <SidebarGroupLabel>Controls</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-sidebar-accent text-[10px]">Drag</kbd>
                    <span>Move furniture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-sidebar-accent text-[10px]">Right-click</kbd>
                    <span>Orbit camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-sidebar-accent text-[10px]">Scroll</kbd>
                    <span>Zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-sidebar-accent text-[10px]">⌘Z</kbd>
                    <span>Undo</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <p className="text-[10px] text-muted-foreground">
            Items snap to grid for precise placement
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

