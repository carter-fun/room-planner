'use client';

import { useRoomStore } from '@/store/roomStore';

interface CameraControlsProps {
  onViewChange: (view: 'perspective' | 'top' | 'front' | 'side') => void;
  currentView: 'perspective' | 'top' | 'front' | 'side';
}

export function CameraControlsUI({ onViewChange, currentView }: CameraControlsProps) {
  const views = [
    { id: 'perspective' as const, label: '3D', icon: '◇' },
    { id: 'top' as const, label: 'Top', icon: '⬡' },
    { id: 'front' as const, label: 'Front', icon: '□' },
    { id: 'side' as const, label: 'Side', icon: '▭' },
  ];
  
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 glass rounded-2xl">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            currentView === view.id
              ? 'bg-white/90 text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          <span className="text-xs opacity-60">{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  );
}

export function useCameraPosition(view: 'perspective' | 'top' | 'front' | 'side') {
  const { roomDimensions } = useRoomStore();
  const maxDim = Math.max(roomDimensions.width, roomDimensions.length);
  
  switch (view) {
    case 'top':
      return {
        position: [0, maxDim * 1.5, 0.01] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
      };
    case 'front':
      return {
        position: [0, roomDimensions.height / 2, maxDim * 1.5] as [number, number, number],
        target: [0, roomDimensions.height / 2, 0] as [number, number, number],
      };
    case 'side':
      return {
        position: [maxDim * 1.5, roomDimensions.height / 2, 0] as [number, number, number],
        target: [0, roomDimensions.height / 2, 0] as [number, number, number],
      };
    case 'perspective':
    default:
      return {
        position: [maxDim, maxDim * 0.8, maxDim] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
      };
  }
}
