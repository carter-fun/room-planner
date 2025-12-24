// Luma AI API integration for video-to-3D conversion
// Documentation: https://docs.lumalabs.ai/

const LUMA_API_BASE = 'https://webapp.engineeringlumalabs.com/api/v3';

export interface LumaCapture {
  slug: string;
  title: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  latestRun?: {
    status: string;
    progress: number;
    artifacts?: Array<{
      type: string;
      url: string;
    }>;
  };
}

export interface LumaUploadResponse {
  signedUrls: {
    source: string;
  };
  capture: {
    slug: string;
  };
}

export class LumaApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'LumaApiError';
  }
}

// Create a new capture and get upload URL
export async function createLumaCapture(
  apiKey: string,
  title: string
): Promise<LumaUploadResponse> {
  const response = await fetch(`${LUMA_API_BASE}/captures`, {
    method: 'POST',
    headers: {
      'Authorization': `luma-api-key=${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new LumaApiError(
      `Failed to create capture: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

// Upload video file to Luma
export async function uploadVideoToLuma(
  signedUrl: string,
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new LumaApiError(`Upload failed: ${xhr.statusText}`, xhr.status));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new LumaApiError('Upload failed: Network error'));
    });
    
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', videoFile.type);
    xhr.send(videoFile);
  });
}

// Trigger processing of uploaded capture
export async function triggerLumaProcessing(
  apiKey: string,
  captureSlug: string
): Promise<void> {
  const response = await fetch(
    `${LUMA_API_BASE}/captures/${captureSlug}/trigger`,
    {
      method: 'POST',
      headers: {
        'Authorization': `luma-api-key=${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new LumaApiError(
      `Failed to trigger processing: ${response.statusText}`,
      response.status
    );
  }
}

// Get capture status
export async function getLumaCaptureStatus(
  apiKey: string,
  captureSlug: string
): Promise<LumaCapture> {
  const response = await fetch(
    `${LUMA_API_BASE}/captures/${captureSlug}`,
    {
      headers: {
        'Authorization': `luma-api-key=${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new LumaApiError(
      `Failed to get capture status: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

// Poll for completion and get GLB URL
export async function pollLumaCompletion(
  apiKey: string,
  captureSlug: string,
  onProgress?: (status: string, progress: number) => void,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const capture = await getLumaCaptureStatus(apiKey, captureSlug);
    
    if (onProgress) {
      onProgress(capture.status, capture.latestRun?.progress || 0);
    }
    
    if (capture.status === 'completed' || capture.latestRun?.status === 'completed') {
      // Find GLB artifact
      const glbArtifact = capture.latestRun?.artifacts?.find(
        (a) => a.type === 'mesh_glb' || a.url?.endsWith('.glb')
      );
      
      if (glbArtifact?.url) {
        return glbArtifact.url;
      }
      
      throw new LumaApiError('No GLB artifact found in completed capture');
    }
    
    if (capture.status === 'failed' || capture.latestRun?.status === 'failed') {
      throw new LumaApiError('Capture processing failed');
    }
    
    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  
  throw new LumaApiError('Polling timeout: Capture did not complete in time');
}

// Download GLB file from Luma
export async function downloadLumaGlb(glbUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(glbUrl);
  
  if (!response.ok) {
    throw new LumaApiError(`Failed to download GLB: ${response.statusText}`, response.status);
  }
  
  return response.arrayBuffer();
}

// Full pipeline: Upload video and get GLB
export async function processVideoToGlb(
  apiKey: string,
  videoFile: File,
  title: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<ArrayBuffer> {
  // Step 1: Create capture
  onProgress?.('Creating capture...', 0);
  const { signedUrls, capture } = await createLumaCapture(apiKey, title);
  
  // Step 2: Upload video
  onProgress?.('Uploading video...', 10);
  await uploadVideoToLuma(signedUrls.source, videoFile, (p) => {
    onProgress?.('Uploading video...', 10 + (p * 0.3));
  });
  
  // Step 3: Trigger processing
  onProgress?.('Starting processing...', 40);
  await triggerLumaProcessing(apiKey, capture.slug);
  
  // Step 4: Poll for completion
  const glbUrl = await pollLumaCompletion(
    apiKey,
    capture.slug,
    (status, progress) => {
      onProgress?.(`Processing: ${status}`, 40 + (progress * 0.5));
    }
  );
  
  // Step 5: Download GLB
  onProgress?.('Downloading model...', 95);
  const glbData = await downloadLumaGlb(glbUrl);
  
  onProgress?.('Complete!', 100);
  return glbData;
}

// Validate API key by making a test request
export async function validateLumaApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${LUMA_API_BASE}/captures?limit=1`, {
      headers: {
        'Authorization': `luma-api-key=${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}


