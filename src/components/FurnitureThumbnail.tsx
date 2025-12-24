'use client';

import { FurnitureType } from '@/store/roomStore';

interface FurnitureThumbnailProps {
  type: FurnitureType;
  className?: string;
}

// Get emoji for furniture types - reliable and fast
function getEmoji(type: FurnitureType): string {
  const emojiMap: Record<string, string> = {
    // Beds
    bed: '🛏️', king_bed: '👑', twin_bed: '🛏️', bunk_bed: '🪜',
    // Desks
    desk: '🖥️', l_desk: '📐', standing_desk: '🧍', gaming_desk: '🎮',
    // Chairs
    chair: '🪑', office_chair: '💺', gaming_chair: '🎮', armchair: '🛋️',
    // Couches
    couch: '🛋️', sectional_couch: '⬛', loveseat: '💕', bean_bag: '🫘',
    // Storage
    bookshelf: '📚', tall_bookshelf: '📖', dresser: '🗄️', wardrobe: '👔',
    nightstand: '🌙', filing_cabinet: '📁', storage_cube: '📦',
    // Tables
    coffee_table: '☕', dining_table: '🍽️', side_table: '🪑', console_table: '🎯',
    kitchen_island: '🍳',
    // Entertainment
    tv_stand: '📺', tv_wall: '📺', monitor: '🖥️', dual_monitor: '🖥️',
    gaming_pc: '💻',
    // Decor
    plant: '🌿', floor_lamp: '🪔', christmas_tree: '🎄',
    rug: '🟫', mirror: '🪞', ceiling_fan: '🌀',
    // Exercise
    treadmill: '🏃', exercise_bike: '🚴', bar_stool: '🍺',
    // Small items
    book: '📖', book_stack: '📚', manga: '📕', picture_frame: '🖼️',
    vase: '🏺', lamp_small: '💡', clock: '🕐', trophy: '🏆',
  };
  return emojiMap[type] || '📦';
}

// Get a nice gradient color based on furniture category
function getGradient(type: FurnitureType): string {
  if (type.includes('bed') || type.includes('nightstand')) {
    return 'from-blue-100 to-indigo-100';
  }
  if (type.includes('desk') || type.includes('chair') || type.includes('office')) {
    return 'from-amber-100 to-orange-100';
  }
  if (type.includes('couch') || type.includes('armchair') || type.includes('loveseat') || type.includes('bean')) {
    return 'from-purple-100 to-pink-100';
  }
  if (type.includes('bookshelf') || type.includes('book') || type.includes('manga')) {
    return 'from-emerald-100 to-teal-100';
  }
  if (type.includes('table') || type.includes('island')) {
    return 'from-yellow-100 to-amber-100';
  }
  if (type.includes('tv') || type.includes('monitor') || type.includes('gaming') || type.includes('pc')) {
    return 'from-slate-100 to-gray-200';
  }
  if (type.includes('plant') || type.includes('tree')) {
    return 'from-green-100 to-emerald-100';
  }
  if (type.includes('lamp') || type.includes('light')) {
    return 'from-yellow-100 to-orange-100';
  }
  if (type.includes('dresser') || type.includes('wardrobe') || type.includes('cabinet') || type.includes('storage')) {
    return 'from-stone-100 to-stone-200';
  }
  return 'from-stone-50 to-stone-100';
}

export function FurnitureThumbnail({ type, className = '' }: FurnitureThumbnailProps) {
  const emoji = getEmoji(type);
  const gradient = getGradient(type);
  
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br ${gradient} rounded-xl transition-all duration-200`}>
      <span className="text-2xl drop-shadow-sm">{emoji}</span>
    </div>
  );
}

