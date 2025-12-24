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
import { processVideoToGlb, validateLumaApiKey } from '@/lib/lumaApi';
import type { DetectedItem, RoomAnalysis } from '@/app/api/analyze-room/route';

type TabType = 'library' | 'upload' | 'luma' | 'experiment' | 'settings';

export function Makerspace() {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [lumaProgress, setLumaProgress] = useState<{ stage: string; progress: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Experiment state
  const [experimentImage, setExperimentImage] = useState<string | null>(null);
  const [experimentAnalysis, setExperimentAnalysis] = useState<RoomAnalysis | null>(null);
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [experimentError, setExperimentError] = useState<string | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem('openai-api-key') || '' : ''
  );
  const [selectedDetectedItems, setSelectedDetectedItems] = useState<Set<number>>(new Set());
  
  // Image-to-3D state (Meshy)
  const [meshyApiKey, setMeshyApiKey] = useState<string>(() => 
    typeof window !== 'undefined' ? localStorage.getItem('meshy-api-key') || '' : ''
  );
  const [conversionJobs, setConversionJobs] = useState<Array<{
    id: string;
    taskId: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    thumbnail?: string;
    error?: string;
  }>>([]);
  const [isConverting, setIsConverting] = useState(false);
  
  const {
    items,
    isLoading,
    error,
    loadLibrary,
    addItem,
    removeItem,
    selectForPlacement,
    selectedForPlacement,
    lumaApiKey,
    setLumaApiKey,
    lumaJobs,
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
  
  // Handle video upload for Luma AI
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lumaApiKey) return;
    
    const title = file.name.replace(/\.[^/.]+$/, '');
    
    try {
      setLumaProgress({ stage: 'Starting...', progress: 0 });
      
      const glbData = await processVideoToGlb(
        lumaApiKey,
        file,
        title,
        (stage, progress) => setLumaProgress({ stage, progress })
      );
      
      // Load and process the GLB
      const scene = await loadGLBFromArrayBuffer(glbData);
      const { dimensions } = normalizeModel(scene, 1);
      const isRoom = detectRoomScan(scene);
      
      let thumbnail: string | undefined;
      try {
        thumbnail = await generateModelThumbnail(scene);
      } catch (e) {
        console.warn('Failed to generate thumbnail:', e);
      }
      
      await addItem(
        {
          name: title,
          type: isRoom ? 'room' : 'item',
          dimensions,
          thumbnail,
          source: 'luma',
        },
        glbData
      );
      
      setLumaProgress(null);
    } catch (error) {
      console.error('Luma AI error:', error);
      alert(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLumaProgress(null);
    }
    
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
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
  
  // Validate and save Luma API key
  const [apiKeyInput, setApiKeyInput] = useState(lumaApiKey || '');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  
  const handleSaveApiKey = async () => {
    setIsValidatingKey(true);
    const isValid = await validateLumaApiKey(apiKeyInput);
    setIsValidatingKey(false);
    
    if (isValid) {
      setLumaApiKey(apiKeyInput);
      alert('API key saved successfully!');
    } else {
      alert('Invalid API key. Please check and try again.');
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

  const handleSaveMeshyKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('meshy-api-key', meshyApiKey);
    }
    alert('Meshy API key saved!');
  };

  // Convert image to 3D model using Meshy
  const handleConvertTo3D = async () => {
    if (!experimentImage) {
      setExperimentError('Please upload an image first');
      return;
    }
    
    if (!meshyApiKey || meshyApiKey.trim().length < 10) {
      setExperimentError('Please enter a valid Meshy API key (get free at meshy.ai)');
      return;
    }

    setIsConverting(true);
    setExperimentError(null);

    try {
      console.log('Starting 3D conversion with key:', meshyApiKey.substring(0, 8) + '...');
      
      // Start conversion task
      const response = await fetch('/api/image-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: experimentImage,
          apiKey: meshyApiKey.trim(),
          name: 'Scanned Furniture',
        }),
      });

      const data = await response.json();
      console.log('API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `Failed (${response.status}): ${JSON.stringify(data)}`);
      }

      // Add to jobs list
      const jobId = `job_${Date.now()}`;
      setConversionJobs(prev => [...prev, {
        id: jobId,
        taskId: data.taskId,
        name: data.name || 'Scanned Object',
        status: 'pending',
        progress: 0,
        thumbnail: experimentImage,
      }]);

      // Start polling for status
      pollConversionStatus(jobId, data.taskId);

      // Clear the image (job is running)
      setExperimentImage(null);
      
    } catch (err) {
      setExperimentError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  // Poll for conversion status
  const pollConversionStatus = async (jobId: string, taskId: string) => {
    const maxAttempts = 120; // 10 minutes max
    const interval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, interval));

      try {
        const response = await fetch(
          `/api/image-to-3d?taskId=${taskId}&apiKey=${encodeURIComponent(meshyApiKey)}`
        );
        const data = await response.json();

        if (!response.ok) {
          setConversionJobs(prev => prev.map(j => 
            j.id === jobId ? { ...j, status: 'failed', error: data.error } : j
          ));
          return;
        }

        // Update job status
        setConversionJobs(prev => prev.map(j => 
          j.id === jobId ? { 
            ...j, 
            status: data.status, 
            progress: data.progress || 0,
          } : j
        ));

        if (data.status === 'completed' && data.modelUrl) {
          // Download the GLB and add to Makerspace
          await downloadAndAddModel(jobId, data.modelUrl, data.thumbnailUrl);
          return;
        }

        if (data.status === 'failed') {
          setConversionJobs(prev => prev.map(j => 
            j.id === jobId ? { ...j, error: data.error || 'Conversion failed' } : j
          ));
          return;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }

    // Timeout
    setConversionJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'failed', error: 'Timeout - conversion took too long' } : j
    ));
  };

  // Download GLB and add to Makerspace library
  const downloadAndAddModel = async (jobId: string, modelUrl: string, thumbnailUrl?: string) => {
    try {
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error('Failed to download model');

      const arrayBuffer = await response.arrayBuffer();
      const scene = await loadGLBFromArrayBuffer(arrayBuffer);
      const { dimensions } = normalizeModel(scene, 1);

      // Generate thumbnail if not provided
      let thumbnail = thumbnailUrl;
      if (!thumbnail) {
        try {
          thumbnail = await generateModelThumbnail(scene);
        } catch (e) {
          console.warn('Failed to generate thumbnail');
        }
      }

      // Get job info
      const job = conversionJobs.find(j => j.id === jobId);

      // Add to Makerspace library
      await addItem(
        {
          name: job?.name || 'Scanned Object',
          type: 'item',
          dimensions,
          thumbnail,
          source: 'scan',
        },
        arrayBuffer
      );

      // Remove from jobs list
      setConversionJobs(prev => prev.filter(j => j.id !== jobId));

    } catch (err) {
      console.error('Download error:', err);
      setConversionJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'failed', error: 'Failed to download model' } : j
      ));
    }
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
      
      // Map detected type to our furniture types
      const furnitureType: FurnitureType = item.type === 'other' ? 'coffee_table' : item.type;
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
          { id: 'upload' as const, label: 'Upload' },
          { id: 'experiment' as const, label: '🧪 Photo AI' },
          { id: 'luma' as const, label: 'Luma' },
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
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-white/50'
              }`}
            >
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-700 font-medium">
                {isDragging ? 'Drop files here' : 'Drag & drop GLB/GLTF files'}
              </p>
              <p className="text-gray-400 text-sm mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Progress */}
            {uploadProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-700">{uploadProgress}</span>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-2">Supported Formats</h4>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• <strong>GLB</strong> - Binary glTF (recommended)</li>
                <li>• <strong>GLTF</strong> - JSON-based 3D format</li>
              </ul>
              <p className="text-xs text-gray-400 mt-3">
                Tip: Export from Polycam, Blender, or any 3D software as GLB for best results.
              </p>
            </div>
          </div>
        )}
        
        {/* Luma AI Tab */}
        {activeTab === 'luma' && (
          <div className="space-y-4">
            {!lumaApiKey ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-700 text-sm mb-2">
                  <strong>API Key Required</strong>
                </p>
                <p className="text-yellow-600 text-sm">
                  Go to Settings tab to add your Luma AI API key.
                </p>
              </div>
            ) : (
              <>
                {/* Video Upload */}
                <div
                  onClick={() => !lumaProgress && videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    lumaProgress
                      ? 'border-blue-300 bg-blue-50 cursor-wait'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer'
                  }`}
                >
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="text-gray-700 font-medium">
                    {lumaProgress ? lumaProgress.stage : 'Upload a video to convert to 3D'}
                  </p>
                  {lumaProgress ? (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${lumaProgress.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {Math.round(lumaProgress.progress)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">
                      Walk around an object or room while recording
                    </p>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={!!lumaProgress}
                    className="hidden"
                  />
                </div>
                
                {/* Instructions */}
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
                  <h4 className="font-medium text-gray-800 mb-2">How to Scan</h4>
                  <ol className="text-sm text-gray-500 space-y-2">
                    <li>1. Record a video walking around the object (30-60 seconds)</li>
                    <li>2. Keep the object centered and well-lit</li>
                    <li>3. Move slowly and avoid motion blur</li>
                    <li>4. Upload and wait for Luma AI to process</li>
                  </ol>
                  <p className="text-xs text-gray-400 mt-3">
                    Processing typically takes 5-15 minutes depending on video length.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Experiment Tab - Photo to Room */}
        {activeTab === 'experiment' && (
          <div className="space-y-4">

            {/* Active Conversion Jobs */}
            {conversionJobs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Converting to 3D...</h4>
                {conversionJobs.map(job => (
                  <div key={job.id} className="bg-white/60 backdrop-blur-xl rounded-xl p-3 border border-white/50">
                    <div className="flex items-center gap-3">
                      {job.thumbnail && (
                        <img src={job.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{job.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {job.status === 'failed' ? (
                            <span className="text-xs text-red-500">{job.error || 'Failed'}</span>
                          ) : (
                            <>
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{job.progress}%</span>
                            </>
                          )}
                        </div>
                      </div>
                      {job.status === 'failed' && (
                        <button
                          onClick={() => setConversionJobs(prev => prev.filter(j => j.id !== job.id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                {!experimentAnalysis && !experimentLoading && !isConverting && (
                  <div className="space-y-2">
                    {/* Convert to 3D - Main feature */}
                    <button
                      onClick={() => {
                        if (!meshyApiKey) {
                          setExperimentError('Add your Meshy API key first! Go to Settings (⚙️) or enter it below.');
                          return;
                        }
                        handleConvertTo3D();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
                    >
                      <span>🎨</span> Convert to 3D Model
                    </button>

                    {/* Meshy key input if not set */}
                    {!meshyApiKey && (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                        <p className="text-cyan-700 text-xs mb-2">Enter Meshy API key (free at meshy.ai):</p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={meshyApiKey}
                            onChange={(e) => setMeshyApiKey(e.target.value)}
                            placeholder="msy_..."
                            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm border border-cyan-200"
                          />
                          <button
                            onClick={handleSaveMeshyKey}
                            disabled={!meshyApiKey}
                            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Analyze with AI - Always show */}
                    <button
                      onClick={() => {
                        if (!openaiApiKey) {
                          setExperimentError('Enter your OpenAI API key below first!');
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

                {/* Converting */}
                {isConverting && (
                  <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-cyan-700">Starting 3D conversion...</span>
                    </div>
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
            {/* Meshy API Key (for Image to 3D) */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-3">🎨 Meshy API Key (Image → 3D)</h4>
              <div className="space-y-2">
                <input
                  type="password"
                  value={meshyApiKey}
                  onChange={(e) => setMeshyApiKey(e.target.value)}
                  placeholder="msy_..."
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-gray-800"
                />
                <button
                  onClick={handleSaveMeshyKey}
                  disabled={!meshyApiKey}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                >
                  Save Meshy Key
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Get FREE API key from{' '}
                <a
                  href="https://www.meshy.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 underline"
                >
                  meshy.ai
                </a>
                {' '}(200 free credits/month)
              </p>
            </div>

            {/* OpenAI API Key (for Photo AI) */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-3">🧠 OpenAI API Key (Analysis only)</h4>
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
                Optional - for detecting furniture types/dimensions only
              </p>
            </div>

            {/* Luma API Key */}
            <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/50">
              <h4 className="font-medium text-gray-800 mb-3">Luma AI API Key</h4>
              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your Luma API key"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-gray-800"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isValidatingKey || !apiKeyInput}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                >
                  {isValidatingKey ? 'Validating...' : 'Save API Key'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Get your API key from{' '}
                <a
                  href="https://lumalabs.ai/dashboard/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  lumalabs.ai
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

