'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMakerspaceStore, MakerspaceItem } from '@/store/makerspaceStore';
import { useRoomStore, FURNITURE_CATALOG, FurnitureType } from '@/store/roomStore';
import {
  validateGLBFile,
  fileToArrayBuffer,
  loadGLBFromArrayBuffer,
  normalizeModel,
  generateModelThumbnail,
  detectRoomScan,
  extractRoomDimensions,
} from '@/lib/modelUtils';
import type { DetectedItem, RoomAnalysis } from '@/app/api/analyze-room/route';

type TabType = 'library' | 'experiment' | 'settings';

export function Makerspace() {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Experiment state
  const [experimentImage, setExperimentImage] = useState<string | null>(null);
  const [experimentAnalysis, setExperimentAnalysis] = useState<RoomAnalysis | null>(null);
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [experimentError, setExperimentError] = useState<string | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [selectedDetectedItems, setSelectedDetectedItems] = useState<Set<number>>(new Set());
  
  // Load OpenAI API key from localStorage on mount (avoids SSR issues)
  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setOpenaiApiKey(savedKey);
    }
  }, []);
  
  
  const {
    items,
    isLoading,
    error,
    loadLibrary,
    addItem,
    removeItem,
    selectForPlacement,
    selectedForPlacement,
    clearError,
  } = useMakerspaceStore();
  
  const { setRoomDimensions, addFurniture } = useRoomStore();
  
  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);
  
  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const glbFiles = files.filter(validateGLBFile);
    
    if (glbFiles.length === 0) {
      alert('Please drop GLB or GLTF files');
      return;
    }
    
    for (const file of glbFiles) {
      await processGLBFile(file);
    }
  }, []);
  
  // Process a GLB file
  const processGLBFile = async (file: File) => {
    setUploadProgress(`Processing ${file.name}...`);
    
    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const scene = await loadGLBFromArrayBuffer(arrayBuffer);
      const { dimensions } = normalizeModel(scene, 1);
      
      // Detect if it's a room scan
      const isRoom = detectRoomScan(scene);
      
      // Generate thumbnail
      let thumbnail: string | undefined;
      try {
        thumbnail = await generateModelThumbnail(scene);
      } catch (e) {
        console.warn('Failed to generate thumbnail:', e);
      }
      
      // Save to library
      await addItem(
        {
          name: file.name.replace(/\.(glb|gltf)$/i, ''),
          type: isRoom ? 'room' : 'item',
          dimensions,
          thumbnail,
          source: 'upload',
          originalFileName: file.name,
        },
        arrayBuffer
      );
      
      setUploadProgress(null);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(null);
    }
  };
  
  // Handle file input change
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      if (validateGLBFile(file)) {
        await processGLBFile(file);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Place item in room
  const handlePlaceItem = (item: MakerspaceItem) => {
    selectForPlacement(item.id);
  };
  
  // Apply room dimensions from scan
  const handleApplyRoomDimensions = (item: MakerspaceItem) => {
    if (item.type === 'room') {
      setRoomDimensions({
        width: item.dimensions.width,
        length: item.dimensions.depth,
        height: item.dimensions.height,
      });
    }
  };

  // Experiment: Photo upload and analysis
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setExperimentImage(base64);
      setExperimentAnalysis(null);
      setExperimentError(null);
      setSelectedDetectedItems(new Set());
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!experimentImage || !openaiApiKey) return;
    
    setExperimentLoading(true);
    setExperimentError(null);
    
    try {
      const response = await fetch('/api/analyze-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: experimentImage,
          apiKey: openaiApiKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }
      
      setExperimentAnalysis(data);
      // Select all items by default
      setSelectedDetectedItems(new Set(data.items.map((_: DetectedItem, i: number) => i)));
    } catch (err) {
      setExperimentError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExperimentLoading(false);
    }
  };

  const handleSaveOpenAIKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openai-api-key', openaiApiKey);
    }
    alert('OpenAI API key saved!');
  };

  const toggleDetectedItem = (index: number) => {
    setSelectedDetectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Map detected item types to actual FurnitureTypes
  const mapDetectedTypeToFurnitureType = (detectedType: string, name: string): FurnitureType => {
    const typeLower = detectedType.toLowerCase();
    const nameLower = name.toLowerCase();
    
    // Check name for specific keywords first
    if (nameLower.includes('king') && nameLower.includes('bed')) return 'king_bed';
    if (nameLower.includes('twin') && nameLower.includes('bed')) return 'twin_bed';
    if (nameLower.includes('bunk') && nameLower.includes('bed')) return 'bunk_bed';
    if (nameLower.includes('gaming') && nameLower.includes('desk')) return 'gaming_desk';
    if (nameLower.includes('l-shaped') || nameLower.includes('l shaped')) return 'l_desk';
    if (nameLower.includes('standing') && nameLower.includes('desk')) return 'standing_desk';
    if (nameLower.includes('gaming') && nameLower.includes('chair')) return 'gaming_chair';
    if (nameLower.includes('office') && nameLower.includes('chair')) return 'office_chair';
    if (nameLower.includes('sectional')) return 'sectional_couch';
    if (nameLower.includes('loveseat')) return 'loveseat';
    if (nameLower.includes('armchair')) return 'armchair';
    if (nameLower.includes('bean bag')) return 'bean_bag';
    if (nameLower.includes('floor lamp') || nameLower.includes('standing lamp')) return 'floor_lamp';
    if (nameLower.includes('lamp')) return 'lamp_small';
    if (nameLower.includes('ceiling fan')) return 'ceiling_fan';
    if (nameLower.includes('tv') && (nameLower.includes('wall') || nameLower.includes('mounted'))) return 'tv_wall';
    if (nameLower.includes('monitor') && nameLower.includes('dual')) return 'dual_monitor';
    if (nameLower.includes('monitor')) return 'monitor';
    if (nameLower.includes('pc') || nameLower.includes('computer') || nameLower.includes('tower')) return 'gaming_pc';
    if (nameLower.includes('plant') || nameLower.includes('potted')) return 'plant';
    if (nameLower.includes('rug') || nameLower.includes('carpet')) return 'rug';
    if (nameLower.includes('mirror')) return 'mirror';
    if (nameLower.includes('christmas tree')) return 'christmas_tree';
    if (nameLower.includes('bar stool')) return 'bar_stool';
    if (nameLower.includes('filing cabinet')) return 'filing_cabinet';
    if (nameLower.includes('storage cube')) return 'storage_cube';
    if (nameLower.includes('tall bookshelf') || nameLower.includes('tall shelf')) return 'tall_bookshelf';
    if (nameLower.includes('side table') || nameLower.includes('end table')) return 'side_table';
    if (nameLower.includes('console table')) return 'console_table';
    if (nameLower.includes('vase')) return 'vase';
    if (nameLower.includes('clock')) return 'clock';
    if (nameLower.includes('trophy')) return 'trophy';
    
    // Map by detected type
    const typeMap: Record<string, FurnitureType> = {
      'bed': 'bed',
      'king_bed': 'king_bed',
      'twin_bed': 'twin_bed',
      'bunk_bed': 'bunk_bed',
      'desk': 'desk',
      'l_desk': 'l_desk',
      'standing_desk': 'standing_desk',
      'gaming_desk': 'gaming_desk',
      'chair': 'chair',
      'office_chair': 'office_chair',
      'gaming_chair': 'gaming_chair',
      'armchair': 'armchair',
      'couch': 'couch',
      'sofa': 'couch',
      'sectional_couch': 'sectional_couch',
      'loveseat': 'loveseat',
      'bean_bag': 'bean_bag',
      'bookshelf': 'bookshelf',
      'tall_bookshelf': 'tall_bookshelf',
      'shelf': 'bookshelf',
      'dresser': 'dresser',
      'wardrobe': 'wardrobe',
      'closet': 'wardrobe',
      'nightstand': 'nightstand',
      'filing_cabinet': 'filing_cabinet',
      'storage_cube': 'storage_cube',
      'coffee_table': 'coffee_table',
      'dining_table': 'dining_table',
      'side_table': 'side_table',
      'console_table': 'console_table',
      'tv_stand': 'tv_stand',
      'entertainment_center': 'tv_stand',
      'tv_wall': 'tv_wall',
      'tv': 'tv_wall',
      'monitor': 'monitor',
      'dual_monitor': 'dual_monitor',
      'gaming_pc': 'gaming_pc',
      'computer': 'gaming_pc',
      'plant': 'plant',
      'floor_lamp': 'floor_lamp',
      'lamp': 'floor_lamp',
      'ceiling_fan': 'ceiling_fan',
      'fan': 'ceiling_fan',
      'rug': 'rug',
      'carpet': 'rug',
      'mirror': 'mirror',
      'christmas_tree': 'christmas_tree',
      'bar_stool': 'bar_stool',
      'stool': 'bar_stool',
    };
    
    return typeMap[typeLower] || 'coffee_table';
  };

  const handleAddDetectedToRoom = () => {
    if (!experimentAnalysis) return;
    
    // Apply room dimensions if detected
    if (experimentAnalysis.roomDimensions) {
      setRoomDimensions({
        width: experimentAnalysis.roomDimensions.width,
        length: experimentAnalysis.roomDimensions.length,
        height: experimentAnalysis.roomDimensions.height,
      });
    }
    
    // Get room dimensions (use detected or current)
    const roomWidth = experimentAnalysis.roomDimensions?.width || 5;
    const roomLength = experimentAnalysis.roomDimensions?.length || 4;
    
    // Add selected furniture items
    experimentAnalysis.items.forEach((item, index) => {
      if (!selectedDetectedItems.has(index)) return;
      
      // Map detected type to our furniture types using smart mapping
      const furnitureType: FurnitureType = mapDetectedTypeToFurnitureType(item.type, item.name);
      const catalog = FURNITURE_CATALOG[furnitureType];
      
      // Place items in a neat grid pattern for easy arrangement
      // User can then drag them to correct positions
      const itemsPerRow = 3;
      const spacing = 2.5; // meters between items
      const startX = -roomWidth / 3;
      const startZ = -roomLength / 3;
      
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      let posX = startX + (col * spacing);
      let posZ = startZ + (row * spacing);
      
      // Keep inside room bounds
      const maxX = (roomWidth / 2) - 1;
      const maxZ = (roomLength / 2) - 1;
      posX = Math.max(-maxX, Math.min(maxX, posX));
      posZ = Math.max(-maxZ, Math.min(maxZ, posZ));
      
      addFurniture({
        type: furnitureType,
        name: item.name,
        position: [posX, 0, posZ],
        rotation: 0,
        dimensions: item.dimensions,
        color: item.color || catalog?.defaultColor || '#808080',
      });
    });
    
    // Clear experiment state
    setExperimentImage(null);
    setExperimentAnalysis(null);
    setSelectedDetectedItems(new Set());
    
    alert(`✅ Added ${selectedDetectedItems.size} items with correct sizes!\n\n👆 Now DRAG each item to its correct position in the room.`);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex p-2 gap-1 border-b border-white/20 flex-wrap">
        {([
          { id: 'library' as const, label: 'Library' },
          { id: 'experiment' as const, label: '📷 Photo AI' },
          { id: 'settings' as const, label: '⚙️' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-1.5 text-xs font-medium rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-white/80 text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-8 text-gray-400">Loading library...</div>
            )}
            
            {!isLoading && items.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 mb-2">Your Makerspace is empty</p>
                <p className="text-gray-400 text-sm">Upload 3D models or scan items with Luma AI</p>
              </div>
            )}
            
            {/* Selected for placement indicator */}
            {selectedForPlacement && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm">
                <span className="font-medium">Ready to place!</span> Click in the room to add the model.
                <button 
                  onClick={() => selectForPlacement(null)}
                  className="ml-2 underline"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white/60 backdrop-blur-xl rounded-xl border overflow-hidden transition-all ${
                    selectedForPlacement === item.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-white/50 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 relative">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                        {item.type === 'room' ? '🏠' : '📦'}
                      </div>
                    )}
                    {/* Type badge */}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full ${
                      item.type === 'room'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="p-2">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400">
                      {item.dimensions.width.toFixed(1)} × {item.dimensions.depth.toFixed(1)} × {item.dimensions.height.toFixed(1)}m
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-1 mt-2">
                      {item.type === 'item' ? (
                        <button
                          onClick={() => handlePlaceItem(item)}
                          className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition-colors"
                        >
                          Place
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyRoomDimensions(item)}
                          className="flex-1 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg font-medium transition-colors"
                        >
                          Apply Size
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs rounded-lg transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo AI Tab */}
        {activeTab === 'experiment' && (
          <div className="space-y-4">
            {/* Photo Upload */}
            {!experimentImage && (
              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-300 hover:border-cyan-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-cyan-50/50"
              >
                <div className="text-5xl mb-3">📸</div>
                <p className="text-gray-700 font-medium">Upload a Photo</p>
                <p className="text-gray-400 text-sm mt-1">
                  Convert your furniture to actual 3D models!
                </p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Uploaded Image Preview */}
            {experimentImage && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-white/50 shadow-sm">
                  <img
                    src={experimentImage}
                    alt="Room to analyze"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => {
                      setExperimentImage(null);
                      setExperimentAnalysis(null);
                      setExperimentError(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Action Buttons */}
                {!experimentAnalysis && !experimentLoading && (
                  <div className="space-y-2">
                    {/* Analyze with AI */}
                    <button
                      onClick={() => {
                        if (!openaiApiKey) {
                          setExperimentError('Enter your OpenAI API key in Settings (⚙️) first!');
                          return;
                        }
                        handleAnalyzePhoto();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                    >
                      <span>🧠</span> Analyze Photo (detect furniture + dimensions)
                    </button>

                    {/* OpenAI key input if not set */}
                    {!openaiApiKey && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                        <p className="text-purple-700 text-xs mb-2">Enter OpenAI API key (get at platform.openai.com):</p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={openaiApiKey}
                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm border border-purple-200"
                          />
                          <button
                            onClick={handleSaveOpenAIKey}
                            disabled={!openaiApiKey}
                            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading */}
                {experimentLoading && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-purple-700">Analyzing room with AI...</span>
                    </div>
                    <p className="text-xs text-purple-500 mt-2">This may take 10-30 seconds</p>
                  </div>
                )}

                {/* Error */}
                {experimentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {experimentError}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {experimentAnalysis && (
              <div className="space-y-4">
                {/* Room Dimensions */}
                {experimentAnalysis.roomDimensions && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <span>🏠</span> Detected Room Size
                    </h4>
                    <p className="text-blue-700 text-sm mb-3">
                      {experimentAnalysis.roomDimensions.width.toFixed(1)} × {experimentAnalysis.roomDimensions.length.toFixed(1)} × {experimentAnalysis.roomDimensions.height.toFixed(1)}m
                    </p>
                    <button
                      onClick={() => {
                        if (experimentAnalysis.roomDimensions) {
                          setRoomDimensions({
                            width: experimentAnalysis.roomDimensions.width,
                            length: experimentAnalysis.roomDimensions.length,
                            height: experimentAnalysis.roomDimensions.height,
                          });
                          alert(`Room resized to ${experimentAnalysis.roomDimensions.width.toFixed(1)}m × ${experimentAnalysis.roomDimensions.length.toFixed(1)}m × ${experimentAnalysis.roomDimensions.height.toFixed(1)}m`);
                        }
                      }}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📐</span> Apply Room Size
                    </button>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
                  <p className="text-gray-600 text-sm italic">{experimentAnalysis.description}</p>
                </div>

                {/* Detected Items */}
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <span>🪑</span> Detected Furniture ({experimentAnalysis.items.length})
                  </h4>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {experimentAnalysis.items.map((item, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedDetectedItems.has(index)
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDetectedItems.has(index)}
                          onChange={() => toggleDetectedItem(index)}
                          className="w-4 h-4 text-green-500 rounded"
                        />
                        <div
                          className="w-5 h-5 rounded-md flex-shrink-0 border border-gray-300"
                          style={{ backgroundColor: item.color || '#808080' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.dimensions.width.toFixed(1)} × {item.dimensions.depth.toFixed(1)} × {item.dimensions.height.toFixed(1)}m
                            <span className="ml-2 text-gray-400">({Math.round(item.confidence * 100)}% confident)</span>
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'other' 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {item.type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Add to Room Button */}
                <button
                  onClick={handleAddDetectedToRoom}
                  disabled={selectedDetectedItems.size === 0}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <span>✨</span> Add {selectedDetectedItems.size} Items to Room
                </button>
              </div>
            )}

            {/* How it works */}
            {!experimentImage && (
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
                <h4 className="font-medium text-gray-800 mb-2">🎨 How It Works</h4>
                <ol className="text-sm text-gray-500 space-y-2">
                  <li>1. 📸 Upload a photo of your furniture</li>
                  <li>2. 🎨 AI converts it to a real 3D model (2-5 min)</li>
                  <li>3. 📦 Model saves to your Makerspace library</li>
                  <li>4. ✨ Place YOUR furniture in the 3D room!</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3 border-t border-gray-200 pt-3">
                  💡 Photos of single items work best. Get free API key at{' '}
                  <a href="https://meshy.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">meshy.ai</a>
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* OpenAI API Key (for Photo AI) */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-3">🧠 OpenAI API Key</h4>
              <div className="space-y-2">
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-gray-800"
                />
                <button
                  onClick={handleSaveOpenAIKey}
                  disabled={!openaiApiKey}
                  className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                >
                  Save OpenAI Key
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Required for Photo AI furniture detection. Get your key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 underline"
                >
                  platform.openai.com
                </a>
              </p>
            </div>
            
            {/* Library Stats */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-3">Library Stats</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {items.filter(i => i.type === 'item').length}
                  </div>
                  <div className="text-xs text-gray-500">Items</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {items.filter(i => i.type === 'room').length}
                  </div>
                  <div className="text-xs text-gray-500">Rooms</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

