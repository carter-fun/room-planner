'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Makerspace } from '@/components/Makerspace';
import { CameraControlsUI } from '@/components/CameraControls';
import { DetailEditMode } from '@/components/DetailEditMode';
import { useRoomStore } from '@/store/roomStore';
import { useMakerspaceStore } from '@/store/makerspaceStore';

// Dynamic import for the 3D Scene to prevent SSR issues
const Scene = dynamic(() => import('@/components/Scene').then(mod => ({ default: mod.Scene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-stone-50 to-green-50/30">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-3 border-amber-200 rounded-full" />
          <div className="absolute inset-0 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-stone-500 text-sm font-medium">Loading 3D Scene...</p>
        <p className="text-stone-400 text-xs mt-1">Preparing your workspace</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [currentView, setCurrentView] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');
  const [showMakerspace, setShowMakerspace] = useState(false);
  const { roomDimensions } = useRoomStore();
  const { selectedForPlacement, loadLibrary } = useMakerspaceStore();
  
  // Load makerspace library on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);
  
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30">
      {/* Sidebar - Floating glass panel with more depth */}
      <div className="absolute top-6 left-6 z-20 h-[calc(100vh-3rem)]">
        <Sidebar />
      </div>
      
      {/* 3D Canvas Container */}
      <div className="flex-1 relative">
        <Scene view={currentView} />
        
        {/* Camera View Controls */}
        <CameraControlsUI onViewChange={setCurrentView} currentView={currentView} />
        
        {/* Room Info - Top Left - Floating card */}
        <div className="absolute top-5 left-5 card-elevated px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Room Size</p>
              <p className="text-base text-stone-800 font-semibold">
                {roomDimensions.width} × {roomDimensions.length} × {roomDimensions.height}m
              </p>
            </div>
          </div>
        </div>
        
        {/* View Indicator - Top Right */}
        <div className="absolute top-5 right-5 flex items-center gap-3">
          {/* Makerspace Toggle */}
          <button
            onClick={() => setShowMakerspace(!showMakerspace)}
            className={`card-elevated px-4 py-3 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              showMakerspace ? 'ring-2 ring-amber-400 ring-offset-2' : ''
            } ${selectedForPlacement ? 'ring-2 ring-green-400 ring-offset-2 animate-pulse-soft' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              showMakerspace 
                ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                : 'bg-gradient-to-br from-stone-100 to-stone-200'
            }`}>
              <span className="text-lg">{showMakerspace ? '📂' : '📦'}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-stone-700">Makerspace</p>
              <p className="text-xs text-stone-400">3D Library</p>
            </div>
          </button>
          
          {/* View Mode */}
          <div className="card-elevated px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            <div>
              <p className="text-sm font-semibold text-stone-700 capitalize">{currentView}</p>
              <p className="text-xs text-stone-400">View Mode</p>
            </div>
          </div>
        </div>
        
        {/* Placement Mode Indicator */}
        {selectedForPlacement && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 animate-float">
            <div className="card-elevated px-6 py-3 flex items-center gap-3 border-2 border-green-400/50">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-stone-700">
                Click anywhere on the floor to place
              </span>
              <kbd className="px-2 py-1 bg-stone-100 rounded text-xs text-stone-500 font-mono">ESC</kbd>
              <span className="text-xs text-stone-400">to cancel</span>
            </div>
          </div>
        )}
        
        {/* Keyboard shortcuts hint - Bottom center */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/70 backdrop-blur-sm">
            <span className="text-stone-300 text-xs">
              <kbd className="px-1.5 py-0.5 bg-stone-700 rounded text-[10px] mr-1">Drag</kbd>
              Move
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300 text-xs">
              <kbd className="px-1.5 py-0.5 bg-stone-700 rounded text-[10px] mr-1">Right</kbd>
              Orbit
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300 text-xs">
              <kbd className="px-1.5 py-0.5 bg-stone-700 rounded text-[10px] mr-1">Scroll</kbd>
              Zoom
            </span>
          </div>
        </div>
      </div>
      
      {/* Makerspace Panel - Slide in from right */}
      <div className={`fixed top-0 right-0 h-full w-96 z-30 transition-transform duration-300 ease-out ${
        showMakerspace ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-white/95 backdrop-blur-xl border-l border-stone-200/50 shadow-2xl shadow-stone-900/10 flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-800">Makerspace</h2>
                <p className="text-xs text-stone-400">Your 3D model library</p>
              </div>
            </div>
            <button
              onClick={() => setShowMakerspace(false)}
              className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Makerspace />
          </div>
        </div>
      </div>
      
      {/* Overlay when Makerspace is open */}
      {showMakerspace && (
        <div 
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-20"
          onClick={() => setShowMakerspace(false)}
        />
      )}
      
      {/* Detail Edit Mode Overlay */}
      <DetailEditMode />
    </main>
  );
}
