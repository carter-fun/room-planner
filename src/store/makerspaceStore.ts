import { create } from 'zustand';
import {
  StoredModel,
  getAllModels,
  saveModel,
  deleteModel as dbDeleteModel,
  updateModel,
  getModelBlobUrl,
} from '@/lib/indexedDb';

export interface MakerspaceItem extends StoredModel {
  blobUrl?: string; // Runtime URL for Three.js loading
}

export interface LumaJob {
  id: string;
  captureId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  name: string;
  error?: string;
  createdAt: number;
}

interface MakerspaceState {
  // Library
  items: MakerspaceItem[];
  isLoading: boolean;
  error: string | null;
  
  // Luma AI Jobs
  lumaJobs: LumaJob[];
  lumaApiKey: string | null;
  
  // Selected item for placement
  selectedForPlacement: string | null;
  
  // Actions
  loadLibrary: () => Promise<void>;
  addItem: (
    model: Omit<StoredModel, 'id' | 'fileId' | 'createdAt'>,
    fileData: ArrayBuffer
  ) => Promise<MakerspaceItem>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<StoredModel>) => Promise<void>;
  getItemBlobUrl: (id: string) => Promise<string | null>;
  
  // Luma AI
  setLumaApiKey: (key: string) => void;
  addLumaJob: (job: Omit<LumaJob, 'id' | 'createdAt'>) => string;
  updateLumaJob: (id: string, updates: Partial<LumaJob>) => void;
  removeLumaJob: (id: string) => void;
  
  // Placement
  selectForPlacement: (id: string | null) => void;
  
  // Clear
  clearError: () => void;
}

const generateId = () => `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useMakerspaceStore = create<MakerspaceState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  lumaJobs: [],
  lumaApiKey: typeof window !== 'undefined' ? localStorage.getItem('luma-api-key') : null,
  selectedForPlacement: null,
  
  loadLibrary: async () => {
    set({ isLoading: true, error: null });
    try {
      const models = await getAllModels();
      // Generate blob URLs for each model
      const itemsWithUrls: MakerspaceItem[] = await Promise.all(
        models.map(async (model) => {
          const blobUrl = await getModelBlobUrl(model);
          return { ...model, blobUrl: blobUrl || undefined };
        })
      );
      set({ items: itemsWithUrls, isLoading: false });
    } catch (error) {
      set({ 
        error: `Failed to load library: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
  },
  
  addItem: async (model, fileData) => {
    set({ isLoading: true, error: null });
    try {
      const id = generateId();
      const savedModel = await saveModel(
        { ...model, id, createdAt: Date.now() },
        fileData
      );
      const blobUrl = await getModelBlobUrl(savedModel);
      const newItem: MakerspaceItem = { ...savedModel, blobUrl: blobUrl || undefined };
      
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false,
      }));
      
      return newItem;
    } catch (error) {
      set({ 
        error: `Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
      throw error;
    }
  },
  
  removeItem: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (item?.blobUrl) {
      URL.revokeObjectURL(item.blobUrl);
    }
    
    try {
      await dbDeleteModel(id);
      set((state) => ({
        items: state.items.filter(i => i.id !== id),
        selectedForPlacement: state.selectedForPlacement === id ? null : state.selectedForPlacement,
      }));
    } catch (error) {
      set({ 
        error: `Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  },
  
  updateItem: async (id, updates) => {
    try {
      await updateModel(id, updates);
      set((state) => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
    } catch (error) {
      set({ 
        error: `Failed to update model: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  },
  
  getItemBlobUrl: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (item?.blobUrl) return item.blobUrl;
    
    const model = get().items.find(i => i.id === id);
    if (!model) return null;
    
    const blobUrl = await getModelBlobUrl(model);
    if (blobUrl) {
      set((state) => ({
        items: state.items.map(i => 
          i.id === id ? { ...i, blobUrl } : i
        ),
      }));
    }
    return blobUrl;
  },
  
  setLumaApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('luma-api-key', key);
    }
    set({ lumaApiKey: key });
  },
  
  addLumaJob: (job) => {
    const id = `job_${Date.now()}`;
    const newJob: LumaJob = { ...job, id, createdAt: Date.now() };
    set((state) => ({ lumaJobs: [newJob, ...state.lumaJobs] }));
    return id;
  },
  
  updateLumaJob: (id, updates) => {
    set((state) => ({
      lumaJobs: state.lumaJobs.map(job =>
        job.id === id ? { ...job, ...updates } : job
      ),
    }));
  },
  
  removeLumaJob: (id) => {
    set((state) => ({
      lumaJobs: state.lumaJobs.filter(job => job.id !== id),
    }));
  },
  
  selectForPlacement: (id) => {
    set({ selectedForPlacement: id });
  },
  
  clearError: () => set({ error: null }),
}));


