'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LandingPage } from '@/components/LandingPage';
import { AppSidebar } from '@/components/app-sidebar';
import { Makerspace } from '@/components/Makerspace';
import { CameraControlsUI } from '@/components/CameraControls';
import { DetailEditMode } from '@/components/DetailEditMode';
import { useRoomStore } from '@/store/roomStore';
import { useMakerspaceStore } from '@/store/makerspaceStore';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

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
  const { user, isLoading: isAuthLoading } = useUser();
  const [hasEntered, setHasEntered] = useState(false);
  const [currentView, setCurrentView] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');
  const [showMakerspace, setShowMakerspace] = useState(false);
  const { roomDimensions, undo, canUndo, detailModeTarget } = useRoomStore();
  const { selectedForPlacement, loadLibrary } = useMakerspaceStore();
  
  // Load makerspace library on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);
  
  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, canUndo]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if user hasn't entered yet
  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }
  
  // If in detail mode, ONLY show the detail editor - nothing else
  if (detailModeTarget) {
    return <DetailEditMode />;
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          
          <div className="flex-1" />
          
          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 border border-border">
              {user.picture && (
                <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-xs text-muted-foreground">{user.name || user.email}</span>
              <a 
                href="/auth/logout" 
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/auth/logout?returnTo=${encodeURIComponent(window.location.origin)}`;
                }}
              >
                Logout
              </a>
            </div>
          )}
          
          {/* Makerspace Toggle */}
          <button
            onClick={() => setShowMakerspace(!showMakerspace)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-accent border border-border ${
              showMakerspace ? 'bg-accent ring-2 ring-amber-400' : ''
            } ${selectedForPlacement ? 'ring-2 ring-green-400 animate-pulse' : ''}`}
          >
            <span className="text-lg">{showMakerspace ? '📂' : '📦'}</span>
            <span className="text-sm font-medium">Makerspace</span>
          </button>
          
          {/* View Mode */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium capitalize">{currentView}</span>
          </div>
          
          {/* Undo Button */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all border border-border ${
              canUndo 
                ? 'bg-accent hover:bg-accent/80 text-foreground' 
                : 'text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
            </svg>
            <span className="text-sm font-medium">Undo</span>
            <kbd className="px-1 py-0.5 bg-background rounded text-[10px] text-muted-foreground">⌘Z</kbd>
          </button>
        </header>
        
        <main className="flex-1 relative overflow-hidden">
          <Scene view={currentView} />
          
          {/* Camera View Controls */}
          <CameraControlsUI onViewChange={setCurrentView} currentView={currentView} />
          
          {/* Placement Mode Indicator */}
          {selectedForPlacement && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/90 text-white shadow-lg">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-sm font-medium">
                  Click anywhere on the floor to place
                </span>
                <kbd className="px-2 py-0.5 bg-white/20 rounded text-xs">ESC</kbd>
              </div>
            </div>
          )}
          
          {/* Keyboard shortcuts hint - Bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/80 backdrop-blur-sm text-background">
              <span className="text-xs">
                <kbd className="px-1.5 py-0.5 bg-background/20 rounded text-[10px] mr-1">Drag</kbd>
                Move
              </span>
              <span className="opacity-50">•</span>
              <span className="text-xs">
                <kbd className="px-1.5 py-0.5 bg-background/20 rounded text-[10px] mr-1">Right</kbd>
                Orbit
              </span>
              <span className="opacity-50">•</span>
              <span className="text-xs">
                <kbd className="px-1.5 py-0.5 bg-background/20 rounded text-[10px] mr-1">Scroll</kbd>
                Zoom
              </span>
            </div>
          </div>
        </main>
      </SidebarInset>
      
      {/* Makerspace Panel - Slide in from right */}
      <div className={`fixed top-0 right-0 h-full w-96 z-30 transition-transform duration-300 ease-out ${
        showMakerspace ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-background border-l shadow-2xl flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-lg">📦</span>
              </div>
              <div>
                <h2 className="text-base font-bold">Makerspace</h2>
                <p className="text-xs text-muted-foreground">Your 3D model library</p>
              </div>
            </div>
            <button
              onClick={() => setShowMakerspace(false)}
              className="w-8 h-8 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-20"
          onClick={() => setShowMakerspace(false)}
        />
      )}
    </SidebarProvider>
  );
}
