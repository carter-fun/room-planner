import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface NormalizedModel {
  scene: THREE.Group;
  dimensions: ModelDimensions;
  originalScale: number;
}

// Load a GLB/GLTF file from an ArrayBuffer
export function loadGLBFromArrayBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      buffer,
      '',
      (gltf) => resolve(gltf.scene),
      (error) => reject(error)
    );
  });
}

// Load a GLB/GLTF file from a URL
export function loadGLBFromUrl(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });
}

// Calculate bounding box dimensions of a 3D object
export function getObjectDimensions(object: THREE.Object3D): ModelDimensions {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  
  return {
    width: size.x,
    height: size.y,
    depth: size.z,
  };
}

// Normalize a model to fit within a 1x1x1 box and center it
export function normalizeModel(scene: THREE.Group, targetSize: number = 1): NormalizedModel {
  // Clone to avoid modifying original
  const clone = scene.clone();
  
  // Get original dimensions
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  
  // Calculate scale to fit in target size
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  
  // Apply scale
  clone.scale.multiplyScalar(scale);
  
  // Center the model at origin, with bottom at y=0
  clone.position.sub(center.multiplyScalar(scale));
  clone.position.y += (size.y * scale) / 2;
  
  // Update matrices
  clone.updateMatrixWorld(true);
  
  return {
    scene: clone,
    dimensions: {
      width: size.x * scale,
      height: size.y * scale,
      depth: size.z * scale,
    },
    originalScale: scale,
  };
}

// Scale a model to specific real-world dimensions (in meters)
export function scaleModelToSize(
  scene: THREE.Group,
  targetDimensions: Partial<ModelDimensions>
): THREE.Group {
  const clone = scene.clone();
  const currentDims = getObjectDimensions(clone);
  
  // Calculate scale factors
  let scaleX = 1, scaleY = 1, scaleZ = 1;
  
  if (targetDimensions.width) {
    scaleX = targetDimensions.width / currentDims.width;
  }
  if (targetDimensions.height) {
    scaleY = targetDimensions.height / currentDims.height;
  }
  if (targetDimensions.depth) {
    scaleZ = targetDimensions.depth / currentDims.depth;
  }
  
  // If only one dimension specified, use uniform scale
  if (Object.keys(targetDimensions).length === 1) {
    const scale = scaleX !== 1 ? scaleX : scaleY !== 1 ? scaleY : scaleZ;
    clone.scale.multiplyScalar(scale);
  } else {
    clone.scale.set(
      clone.scale.x * scaleX,
      clone.scale.y * scaleY,
      clone.scale.z * scaleZ
    );
  }
  
  return clone;
}

// Generate a thumbnail for a 3D model
export async function generateModelThumbnail(
  scene: THREE.Group,
  width: number = 128,
  height: number = 128
): Promise<string> {
  // Create an offscreen renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    preserveDrawingBuffer: true 
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  
  // Create scene and camera
  const thumbnailScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  
  // Normalize and add model
  const { scene: normalizedScene, dimensions } = normalizeModel(scene, 1);
  thumbnailScene.add(normalizedScene);
  
  // Position camera to see the whole model
  const maxDim = Math.max(dimensions.width, dimensions.height, dimensions.depth);
  camera.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5);
  camera.lookAt(0, dimensions.height / 2, 0);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  thumbnailScene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  thumbnailScene.add(directionalLight);
  
  // Render
  renderer.render(thumbnailScene, camera);
  
  // Get data URL
  const dataUrl = renderer.domElement.toDataURL('image/png');
  
  // Cleanup
  renderer.dispose();
  
  return dataUrl;
}

// Detect if a model is likely a room scan (has floor-like geometry)
export function detectRoomScan(scene: THREE.Group): boolean {
  let hasLargeHorizontalSurface = false;
  let hasVerticalSurfaces = false;
  
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      if (geometry.boundingBox === null) {
        geometry.computeBoundingBox();
      }
      
      const box = geometry.boundingBox!;
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Check for floor-like surface (wide and shallow)
      if (size.x > 2 && size.z > 2 && size.y < 0.5) {
        hasLargeHorizontalSurface = true;
      }
      
      // Check for wall-like surfaces (tall and thin)
      if ((size.y > 1.5 && size.x < 0.3) || (size.y > 1.5 && size.z < 0.3)) {
        hasVerticalSurfaces = true;
      }
    }
  });
  
  return hasLargeHorizontalSurface && hasVerticalSurfaces;
}

// Extract room dimensions from a scanned room model
export function extractRoomDimensions(scene: THREE.Group): ModelDimensions | null {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  
  // Room should be at least 1.5m in each horizontal direction
  if (size.x < 1.5 || size.z < 1.5) {
    return null;
  }
  
  return {
    width: size.x,
    height: size.y,
    depth: size.z,
  };
}

// Validate that a file is a valid GLB/GLTF
export function validateGLBFile(file: File): boolean {
  const validExtensions = ['.glb', '.gltf'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}

// Convert File to ArrayBuffer
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}


