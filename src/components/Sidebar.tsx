'use client';

import { useState, useRef } from 'react';
import { useRoomStore, FURNITURE_CATALOG, FurnitureType } from '@/store/roomStore';
import { FurnitureThumbnail } from './FurnitureThumbnail';
import { playAddSound } from '@/lib/sounds';

// Size presets for different furniture types - simplified to use catalog defaults
const getDefaultPresets = (type: FurnitureType) => {
  const catalog = FURNITURE_CATALOG[type];
  if (!catalog) {
    // Fallback for unknown types
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

const getSizePresets = (type: FurnitureType) => {
  return getDefaultPresets(type);
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

export function Sidebar() {
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
    scannedItems,
    removeScannedItem,
    updateScannedItemRotation,
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
  const selectedScanned = selectedType === 'scanned' ? scannedItems.find(s => s.id === selectedId) : null;
  
  // Large furniture that can have items placed on them (for detail edit mode)
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
  
  const handleAddFurniture = (type: FurnitureType) => {
    saveForUndo(); // Save state for undo
    const catalog = FURNITURE_CATALOG[type];
    addFurniture({
      type,
      name: catalog.name,
      position: [0, 0, 0],
      rotation: 0,
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
    } else if (selectedId && selectedScanned) {
      const newRotation = (selectedScanned.rotation + delta + 360) % 360;
      updateScannedItemRotation(selectedId, newRotation);
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
    <div className="w-80 h-full bg-white/55 backdrop-blur-2xl flex flex-col rounded-3xl border border-white/50 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800">SpacedApp</h1>
            <p className="text-xs text-stone-400">Design your perfect space</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex p-2 gap-1 border-b border-stone-100 bg-stone-50/50">
        {(['furniture', 'room', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-white text-stone-800 shadow-md shadow-stone-200/50' 
                : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'furniture' && (
          <div className="p-4 space-y-4">
            {/* Selected Item Controls */}
            {selectedFurniture && (
              <div className="bg-gradient-to-b from-amber-50/80 to-orange-50/50 rounded-2xl p-4 space-y-4 border border-amber-200/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedFurniture.color }} />
                    <h3 className="font-bold text-stone-800">{selectedFurniture.name}</h3>
                  </div>
                  <button
                    onClick={() => { saveForUndo(); removeFurniture(selectedId!); }}
                    className="text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                
                {/* Rotation Controls */}
                <div>
                  <label className="text-label block mb-2">Rotation</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRotate(-45)}
                      className="flex-1 py-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 text-sm font-semibold transition-all hover:shadow-md"
                    >
                      ↺ 45°
                    </button>
                    <div className="w-16 text-center">
                      <span className="text-lg font-bold text-stone-800">{selectedFurniture.rotation}°</span>
                    </div>
                    <button
                      onClick={() => handleRotate(45)}
                      className="flex-1 py-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 text-sm font-semibold transition-all hover:shadow-md"
                    >
                      ↻ 45°
                    </button>
                  </div>
                </div>
                
                {/* Height Position (for small items) */}
                <div>
                  <label className="text-label block mb-2">Placement Height</label>
                  <div className="flex items-center gap-3">
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
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold text-stone-800 w-16 text-right">{selectedFurniture.position[1].toFixed(2)}m</span>
                  </div>
                  {selectedFurniture.position[1] > 0.01 && (
                    <button
                      onClick={() => updateFurniturePosition(selectedId!, [
                        selectedFurniture.position[0],
                        0,
                        selectedFurniture.position[2]
                      ])}
                      className="mt-2 w-full py-2 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white text-stone-600 transition-all"
                    >
                      ⬇️ Drop to Floor
                    </button>
                  )}
                </div>
                
                {/* Edit Details Button - for large furniture */}
                {isLargeFurniture(selectedFurniture.type) && (
                  <button
                    onClick={() => setDetailModeTarget(selectedId)}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                  >
                    <span>✨</span> Edit Details
                  </button>
                )}

                {/* Size Presets */}
                <div>
                  <label className="text-label block mb-2">Size Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {getSizePresets(selectedFurniture.type)?.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset)}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedFurniture.dimensions.width === preset.dimensions.width &&
                          selectedFurniture.dimensions.depth === preset.dimensions.depth
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                            : 'bg-white/80 hover:bg-white text-stone-600 hover:shadow-md'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Dimensions */}
                <div>
                  <label className="text-label block mb-2">Custom Size</label>
                  <div className="space-y-3 p-3 bg-white/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-500 w-12">Width</span>
                      <input
                        type="range"
                        min="0.3"
                        max="4"
                        step="0.1"
                        value={selectedFurniture.dimensions.width}
                        onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs font-semibold text-stone-800 w-12 text-right">{selectedFurniture.dimensions.width.toFixed(1)}m</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-500 w-12">Depth</span>
                      <input
                        type="range"
                        min="0.3"
                        max="4"
                        step="0.1"
                        value={selectedFurniture.dimensions.depth}
                        onChange={(e) => handleDimensionChange('depth', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs font-semibold text-stone-800 w-12 text-right">{selectedFurniture.dimensions.depth.toFixed(1)}m</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-500 w-12">Height</span>
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.05"
                        value={selectedFurniture.dimensions.height}
                        onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs font-semibold text-stone-800 w-12 text-right">{selectedFurniture.dimensions.height.toFixed(2)}m</span>
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="text-label block mb-2">Material Color</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-white/50 rounded-xl">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleColorChange(c.color)}
                        title={c.name}
                        className={`w-8 h-8 rounded-xl transition-all shadow-sm ${
                          selectedFurniture.color === c.color
                            ? 'ring-2 ring-amber-500 ring-offset-2 scale-110'
                            : 'hover:scale-110 hover:shadow-md'
                        }`}
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-stone-400 pt-3 border-t border-stone-200/50 flex justify-between">
                  <span>Position</span>
                  <span className="font-mono">({selectedFurniture.position[0].toFixed(2)}, {selectedFurniture.position[2].toFixed(2)})m</span>
                </div>
              </div>
            )}
            
            {/* Furniture Catalog with 3D Thumbnails - Square Grid Layout */}
            <div>
              <h3 className="text-label mb-3 px-1">Add Furniture</h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(FURNITURE_CATALOG) as FurnitureType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddFurniture(type)}
                    className="aspect-square flex flex-col items-center justify-center p-3 rounded-2xl text-center bg-white/60 hover:bg-white/90 border border-white/50 hover:border-amber-300/60 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 hover:scale-105 active:scale-95 group"
                  >
                    <div className="w-14 h-14 mb-2 rounded-xl overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100 group-hover:from-amber-50 group-hover:to-orange-50 transition-all duration-200 shadow-sm group-hover:shadow-md">
                      <FurnitureThumbnail type={type} className="w-full h-full" />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-500 group-hover:text-amber-700 transition-colors leading-tight text-center line-clamp-2">{FURNITURE_CATALOG[type].name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Placed Items List */}
            {furniture.length > 0 && (
              <div>
                <h3 className="text-label mb-3 px-1">
                  Placed Items <span className="text-amber-600">({furniture.length})</span>
                </h3>
                <div className="space-y-1.5">
                  {furniture.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedId === item.id
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-md'
                          : 'bg-white/70 hover:bg-white border border-transparent hover:border-stone-200'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-lg flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={`text-sm flex-1 font-medium ${selectedId === item.id ? 'text-amber-800' : 'text-stone-600'}`}>
                        {item.name}
                      </span>
                      <span className={`text-xs font-mono ${selectedId === item.id ? 'text-amber-600' : 'text-stone-400'}`}>{item.rotation}°</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'room' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-b from-green-50/80 to-emerald-50/50 rounded-2xl p-5 space-y-5 border border-green-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-stone-800">Room Dimensions</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-label block mb-2">Width (X)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={roomDimensions.width}
                      onChange={(e) => setRoomDimensions({ width: parseFloat(e.target.value) || 1 })}
                      min="1"
                      max="20"
                      step="0.5"
                      className="w-full px-4 py-3 rounded-xl bg-white/80 border border-green-200/50 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">meters</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-label block mb-2">Length (Z)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={roomDimensions.length}
                      onChange={(e) => setRoomDimensions({ length: parseFloat(e.target.value) || 1 })}
                      min="1"
                      max="20"
                      step="0.5"
                      className="w-full px-4 py-3 rounded-xl bg-white/80 border border-green-200/50 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">meters</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-label block mb-2">Height (Y)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={roomDimensions.height}
                      onChange={(e) => setRoomDimensions({ height: parseFloat(e.target.value) || 1 })}
                      min="2"
                      max="5"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-white/80 border border-green-200/50 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">meters</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-green-200/50 flex items-center justify-between">
                <span className="text-sm text-stone-500">Floor Area</span>
                <span className="text-lg font-bold text-green-700">
                  {(roomDimensions.width * roomDimensions.length).toFixed(1)} m²
                </span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100/50 rounded-2xl p-5 space-y-5 border border-stone-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-400 to-stone-500 flex items-center justify-center shadow-lg shadow-stone-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-stone-800">Grid Settings</h3>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                <span className="text-sm font-medium text-stone-600">Show Grid</span>
                <button
                  onClick={toggleGrid}
                  className={`w-14 h-8 rounded-full transition-all relative ${
                    showGrid 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-inner' 
                      : 'bg-stone-200'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                    showGrid ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div>
                <label className="text-label block mb-2">Grid Size</label>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-stone-200/50 text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="0.1">10 cm (Precise)</option>
                  <option value="0.25">25 cm (Standard)</option>
                  <option value="0.5">50 cm (Large)</option>
                  <option value="1">1 meter (Extra Large)</option>
                </select>
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-blue-50/80 to-indigo-50/50 rounded-2xl p-5 space-y-4 border border-blue-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <h3 className="font-bold text-stone-800">Save & Load</h3>
              </div>
              
              <button
                onClick={handleExport}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Layout
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 bg-white/80 hover:bg-white border border-blue-200/50 rounded-xl font-semibold text-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Import Layout
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              
              <div className="pt-2 border-t border-blue-200/30">
                <button
                  onClick={() => {
                    if (confirm('Clear all furniture from the room?')) {
                      clearRoom();
                    }
                  }}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Room
                </button>
              </div>
            </div>
            
            <div className="bg-white/60 rounded-2xl p-5 border border-stone-200/30">
              <h3 className="font-bold text-stone-800 mb-4">Controls</h3>
              <ul className="text-sm space-y-3">
                <li className="flex items-center gap-3">
                  <kbd className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-mono text-stone-600 shadow-sm">🖱️</kbd>
                  <span className="text-stone-600"><span className="font-semibold text-stone-800">Drag</span> to move furniture</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-mono text-stone-600 shadow-sm">R</kbd>
                  <span className="text-stone-600"><span className="font-semibold text-stone-800">Right-click</span> to orbit camera</span>
                </li>
                <li className="flex items-center gap-3">
                  <kbd className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-mono text-stone-600 shadow-sm">⚙️</kbd>
                  <span className="text-stone-600"><span className="font-semibold text-stone-800">Scroll</span> to zoom</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-xs text-stone-400 font-medium">
            Items snap to grid for precise placement
          </p>
        </div>
      </div>
    </div>
  );
}
