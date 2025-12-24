import { NextRequest, NextResponse } from 'next/server';

export interface DetectedItem {
  name: string;
  type: 'bed' | 'desk' | 'chair' | 'couch' | 'bookshelf' | 'tv_stand' | 'nightstand' | 'wardrobe' | 'coffee_table' | 'dining_table' | 'other';
  dimensions: {
    width: number;  // meters
    height: number; // meters
    depth: number;  // meters
  };
  confidence: number; // 0-1
  position?: {
    x: number; // relative position in room (0-1)
    z: number; // relative position in room (0-1)
  };
  color?: string;
}

export interface RoomAnalysis {
  roomDimensions?: {
    width: number;
    length: number;
    height: number;
  };
  items: DetectedItem[];
  description: string;
}

const SYSTEM_PROMPT = `You are an expert at identifying furniture in room photos. Your job is to detect ALL furniture items and estimate their real-world DIMENSIONS accurately.

FOCUS ON:
1. Identifying every piece of furniture visible
2. Estimating accurate real-world dimensions in METERS
3. Detecting the room size

STANDARD FURNITURE SIZES (use as reference):
- King bed: 2.0m wide x 0.6m tall x 2.1m deep (platform beds are lower ~0.4m)
- Queen bed: 1.6m x 0.5m x 2.0m
- Twin bed: 1.0m x 0.5m x 2.0m
- Large desk (gaming/office): 1.5-1.8m x 0.75m x 0.8m
- Small desk: 1.2m x 0.75m x 0.6m
- TV stand/entertainment center: 1.5-2.5m x 0.5m x 0.45m
- Large TV (65"+): 1.5m x 0.9m x 0.1m (mounted)
- Dresser: 1.2-1.5m x 0.9m x 0.5m
- Bookshelf: 0.8-1.2m x 1.8m x 0.3m
- Couch/Sofa: 2.0-2.5m x 0.85m x 0.95m
- Nightstand: 0.5m x 0.6m x 0.45m
- Gaming chair: 0.7m x 1.3m x 0.7m
- Wardrobe/Closet: 1.5-2.0m x 2.0m x 0.6m

ROOM SIZE ESTIMATION:
- Look at doors (standard 2.0m tall, 0.9m wide) for scale
- Ceiling fans indicate ~2.7m ceiling height
- Beds help estimate room width

For each item provide:
1. Name - be specific (e.g., "Platform King Bed", "L-Shaped Gaming Desk", "65-inch Wall-Mounted TV")
2. Type - choose the BEST match from this list:
   BEDS: bed, king_bed, twin_bed, bunk_bed
   DESKS: desk, l_desk, standing_desk, gaming_desk
   SEATING: chair, office_chair, gaming_chair, armchair, couch, sectional_couch, loveseat, bean_bag
   STORAGE: bookshelf, tall_bookshelf, dresser, wardrobe, nightstand, filing_cabinet, storage_cube
   TABLES: coffee_table, dining_table, side_table, console_table
   ENTERTAINMENT: tv_stand, tv_wall, monitor, dual_monitor, gaming_pc
   DECOR: plant, floor_lamp, ceiling_fan, rug, mirror, christmas_tree
   OTHER: bar_stool, kitchen_island, treadmill, exercise_bike
3. Dimensions in meters: width (side to side), height (floor to top), depth (front to back)
4. Confidence: 0-1
5. Position: just use x: 0.5, z: 0.5 (user will position manually)
6. Color: hex code of primary color

Respond with JSON only:
{
  "roomDimensions": { "width": number, "length": number, "height": number },
  "items": [
    {
      "name": "specific name",
      "type": "type",
      "dimensions": { "width": number, "height": number, "depth": number },
      "confidence": number,
      "position": { "x": 0.5, "z": 0.5 },
      "color": "#hexcode"
    }
  ],
  "description": "Brief description"
}`;

// Helper function to make API call with retries
async function callOpenAIWithRetry(
  apiKey: string,
  image: string,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  let lastStatus: number = 0;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this room photo and identify all furniture with dimensions. Respond with JSON only.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image,
                    detail: 'low',
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      lastStatus = response.status;

      // If rate limited, wait and retry
      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = (attempt + 1) * 5000; // 5s, 10s
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        // On last attempt, return the 429 response for proper error handling
        return response;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // Create a mock response for the error
  if (lastStatus === 429) {
    return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  throw lastError || new Error('Network error - please check your connection');
}

export async function POST(request: NextRequest) {
  try {
    const { image, apiKey } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
    }

    // Call OpenAI GPT-4 Vision API with retry logic
    const response = await callOpenAIWithRetry(apiKey, image);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // Provide user-friendly error messages
      let errorMessage = 'API error';
      if (response.status === 429) {
        errorMessage = '⏳ Rate limit hit! Free OpenAI accounts have very low limits. Either: (1) Wait 2-3 minutes and try again, OR (2) Add billing at platform.openai.com/account/billing to increase limits.';
      } else if (response.status === 401) {
        errorMessage = '🔑 Invalid API key. Please check your OpenAI API key is correct.';
      } else if (response.status === 402) {
        errorMessage = '💳 Payment required. Add credits at platform.openai.com/account/billing';
      } else if (response.status === 403) {
        errorMessage = '🚫 Access denied. Your API key may not have access to vision models. Check your OpenAI account permissions.';
      } else if (response.status === 500) {
        errorMessage = '🔧 OpenAI server error. Please try again in a moment.';
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    try {
      const analysis: RoomAnalysis = JSON.parse(jsonContent.trim());
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing room:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

