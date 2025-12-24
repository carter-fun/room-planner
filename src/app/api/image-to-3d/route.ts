import { NextRequest, NextResponse } from 'next/server';

export interface ImageTo3DRequest {
  imageUrl: string;
  apiKey: string;
  name?: string;
}

// Upload base64 image to imgbb (free image hosting)
async function uploadToImgBB(base64Data: string): Promise<string> {
  // Extract just the base64 part without the data URL prefix
  const base64Only = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  // Use imgbb free API (no key required for basic usage, but limited)
  // Alternative: use a simple blob URL approach
  const formData = new FormData();
  formData.append('image', base64Only);
  
  const response = await fetch('https://api.imgbb.com/1/upload?key=7a1d89e6e4b4a9c3f2e1d0c9b8a7f6e5', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image to hosting service');
  }
  
  const data = await response.json();
  return data.data.url;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ImageTo3DRequest;
    const { imageUrl, apiKey, name } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Please enter your Meshy API key first' }, { status: 400 });
    }

    console.log('Meshy API Key (first 8 chars):', apiKey.substring(0, 8));
    
    let finalImageUrl = imageUrl;
    
    // If it's a base64 data URL, we need to handle it differently
    // Meshy might not accept base64 directly
    if (imageUrl.startsWith('data:')) {
      console.log('Image is base64, sending directly to Meshy...');
      // Try sending base64 directly first - some versions of Meshy accept it
    }

    const requestBody = {
      image_url: finalImageUrl,
      enable_pbr: true,
    };

    console.log('Calling Meshy API v1...');
    console.log('Image URL length:', finalImageUrl.length);

    const response = await fetch('https://api.meshy.ai/v1/image-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Meshy response status:', response.status);
    console.log('Meshy response body:', responseText.substring(0, 1000));

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw: responseText };
      }

      let errorMessage = 'Failed to start 3D conversion';
      const meshyMsg = (errorData as {message?: string}).message || '';
      
      if (response.status === 401) {
        errorMessage = 'Invalid Meshy API key. Check your key at meshy.ai/settings';
      } else if (response.status === 402 || meshyMsg.toLowerCase().includes('credit')) {
        errorMessage = 'Credits issue: ' + meshyMsg + ' - Note: Image-to-3D costs 2 credits per model. Check your balance at meshy.ai';
      } else if (response.status === 429) {
        errorMessage = 'Rate limited. Wait a moment and try again.';
      } else if (response.status === 400) {
        errorMessage = 'Bad request: ' + (meshyMsg || responseText);
      } else {
        errorMessage = 'Meshy error (' + response.status + '): ' + (meshyMsg || responseText);
      }

      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      taskId: data.result,
      status: 'pending',
      name: name || 'Scanned Object',
    });
  } catch (error) {
    console.error('Image-to-3D error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Server error: ' + msg },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('taskId');
  const apiKey = request.nextUrl.searchParams.get('apiKey');

  if (!taskId || !apiKey) {
    return NextResponse.json({ error: 'Missing taskId or apiKey' }, { status: 400 });
  }

  try {
    const url = 'https://api.meshy.ai/v1/image-to-3d/' + taskId;
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Meshy status check failed:', response.status, text);
      return NextResponse.json(
        { error: 'Failed to check task status: ' + text },
        { status: response.status }
      );
    }

    const data = await response.json();

    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
    if (data.status === 'SUCCEEDED') {
      status = 'completed';
    } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
      status = 'failed';
    } else if (data.status === 'PENDING') {
      status = 'pending';
    }

    return NextResponse.json({
      taskId,
      status,
      progress: data.progress || 0,
      modelUrl: data.model_urls?.glb || null,
      thumbnailUrl: data.thumbnail_url || null,
      error: data.task_error?.message || null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
