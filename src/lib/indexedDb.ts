// IndexedDB wrapper for storing 3D model files

const DB_NAME = 'room-planner-makerspace';
const DB_VERSION = 1;
const MODELS_STORE = 'models';
const FILES_STORE = 'files';

export interface StoredModel {
  id: string;
  name: string;
  type: 'item' | 'room';
  createdAt: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  thumbnail?: string; // Base64 data URL
  fileId: string; // Reference to the file in FILES_STORE
  source: 'upload' | 'luma' | 'polycam' | 'scan' | 'meshy';
  originalFileName?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for model metadata
      if (!db.objectStoreNames.contains(MODELS_STORE)) {
        const modelsStore = db.createObjectStore(MODELS_STORE, { keyPath: 'id' });
        modelsStore.createIndex('type', 'type', { unique: false });
        modelsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      // Store for actual file blobs
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      }
    };
  });
  
  return dbPromise;
}

// Save a model file and its metadata
export async function saveModel(
  model: Omit<StoredModel, 'fileId'>,
  fileData: ArrayBuffer
): Promise<StoredModel> {
  const db = await openDB();
  const fileId = `file_${model.id}`;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MODELS_STORE, FILES_STORE], 'readwrite');
    
    transaction.onerror = () => reject(transaction.error);
    
    // Save the file blob
    const filesStore = transaction.objectStore(FILES_STORE);
    filesStore.put({ id: fileId, data: fileData });
    
    // Save the model metadata
    const modelsStore = transaction.objectStore(MODELS_STORE);
    const fullModel: StoredModel = { ...model, fileId };
    modelsStore.put(fullModel);
    
    transaction.oncomplete = () => resolve(fullModel);
  });
}

// Get all models
export async function getAllModels(): Promise<StoredModel[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE, 'readonly');
    const store = transaction.objectStore(MODELS_STORE);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get models by type
export async function getModelsByType(type: 'item' | 'room'): Promise<StoredModel[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE, 'readonly');
    const store = transaction.objectStore(MODELS_STORE);
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get a single model by ID
export async function getModel(id: string): Promise<StoredModel | undefined> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE, 'readonly');
    const store = transaction.objectStore(MODELS_STORE);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get file data for a model
export async function getModelFile(fileId: string): Promise<ArrayBuffer | undefined> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILES_STORE, 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(fileId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.data);
  });
}

// Delete a model and its file
export async function deleteModel(id: string): Promise<void> {
  const db = await openDB();
  const model = await getModel(id);
  if (!model) return;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MODELS_STORE, FILES_STORE], 'readwrite');
    
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
    
    transaction.objectStore(MODELS_STORE).delete(id);
    transaction.objectStore(FILES_STORE).delete(model.fileId);
  });
}

// Update model metadata (not the file)
export async function updateModel(
  id: string,
  updates: Partial<Omit<StoredModel, 'id' | 'fileId'>>
): Promise<StoredModel | undefined> {
  const db = await openDB();
  const existing = await getModel(id);
  if (!existing) return undefined;
  
  const updated = { ...existing, ...updates };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MODELS_STORE, 'readwrite');
    const store = transaction.objectStore(MODELS_STORE);
    const request = store.put(updated);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

// Clear all data (for debugging/reset)
export async function clearAllData(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MODELS_STORE, FILES_STORE], 'readwrite');
    
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
    
    transaction.objectStore(MODELS_STORE).clear();
    transaction.objectStore(FILES_STORE).clear();
  });
}

// Create a blob URL for a stored model file
export async function getModelBlobUrl(model: StoredModel): Promise<string | null> {
  const fileData = await getModelFile(model.fileId);
  if (!fileData) return null;
  
  const blob = new Blob([fileData], { type: 'model/gltf-binary' });
  return URL.createObjectURL(blob);
}

