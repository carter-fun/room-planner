# 🏠 Room Planner

A beautiful 3D room planner built with Next.js and Three.js. Design your perfect space by dragging and dropping furniture in an interactive 3D environment.

![Room Planner](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-r170-black?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## ✨ Features

- **3D Room Visualization** - See your room layout in real-time 3D
- **Drag & Drop Furniture** - Intuitively place and arrange furniture
- **60+ Furniture Items** - Beds, desks, chairs, tables, storage, decor & more
- **Collision Detection** - Items can't overlap, with visual feedback
- **Grid Snapping** - Precise placement with adjustable grid sizes
- **Rotation Controls** - Rotate furniture to any angle
- **Detail Edit Mode** - Place small items on top of furniture (books on shelves, etc.)
- **Custom Dimensions** - Resize any furniture piece
- **Color Customization** - Choose from a curated material palette
- **Satisfying Sound Effects** - Subtle audio feedback when placing items
- **Save & Load** - Export/import your room layouts as JSON
- **Responsive Camera** - Orbit, pan, and zoom to view from any angle

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repo
git clone https://github.com/carter-fun/room-planner.git
cd room-planner

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 Controls

| Action | Control |
|--------|---------|
| **Move furniture** | Click and drag |
| **Select item** | Click on it |
| **Rotate camera** | Right-click and drag |
| **Zoom** | Scroll wheel |
| **Delete item** | Select + Delete/Backspace key |

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **3D Engine**: [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Gestures**: [@use-gesture/react](https://use-gesture.netlify.app/)
- **Audio**: Web Audio API (procedural sounds)

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── Room3D.tsx       # Main 3D scene
│   ├── DraggableFurniture.tsx
│   ├── FurnitureModels.tsx
│   ├── Sidebar.tsx      # UI controls
│   └── ...
├── store/               # Zustand stores
│   └── roomStore.ts     # Room & furniture state
└── lib/                 # Utilities
    └── sounds.ts        # Audio effects
```

## 📄 License

MIT

---

Made with ❤️ and Three.js
