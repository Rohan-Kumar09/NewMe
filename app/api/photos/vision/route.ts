import { NextResponse } from 'next/server';

// Increase timeout to 2 minutes (120 seconds) for Vision API calls
// Vision API can sometimes take longer for complex images
export const maxDuration = 120; // 2 minutes
export const runtime = "nodejs";

function parseCookies(cookieHeader: string | null) {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    map[key] = val;
  }
  return map;
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies['access_token'];

    if (!accessToken) {
      console.error('❌ [VISION] Missing access_token cookie');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const origin = new URL(request.url).origin;

    let body: any;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('❌ [VISION] JSON parse error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError.message },
        { status: 400 }
      );
    }

    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // If a relative/proxied path was provided (e.g. /api/photos/proxy-image?...), make absolute
    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`;

    // Fetch proxied image from our own server, forwarding cookies so /api/photos/proxy-image can use them
    // Create AbortController with 30 second timeout for image fetch
    const imageController = new AbortController();
    const imageTimeoutId = setTimeout(() => imageController.abort(), 30000); // 30 seconds
    
    let imageRes: Response;
    try {
      imageRes = await fetch(absoluteUrl, {
        method: 'GET',
        headers: {
          cookie: cookieHeader || '',
        },
        signal: imageController.signal,
      });
      clearTimeout(imageTimeoutId);
    } catch (imageFetchError: any) {
      clearTimeout(imageTimeoutId);
      if (imageFetchError.name === 'AbortError') {
        console.error('Image fetch timed out after 30 seconds');
        return NextResponse.json({ error: 'Failed to fetch image: request timed out' }, { status: 504 });
      }
      throw imageFetchError;
    }

    if (!imageRes.ok) {
      const text = await imageRes.text();
      console.error('Proxy image fetch failed:', imageRes.status, text);
      return NextResponse.json({ error: 'Failed to fetch proxied image' }, { status: 502 });
    }

    let arrayBuf: ArrayBuffer;
    let imageBuffer: Buffer;
    
    try {
      arrayBuf = await imageRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
      
      // Check image size (Vision API has limits)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (imageBuffer.length > maxSize) {
        console.error('❌ [VISION] Image too large:', imageBuffer.length, 'bytes (max:', maxSize, ')');
        return NextResponse.json(
          { error: 'Image too large', details: `Image size ${Math.round(imageBuffer.length / 1024 / 1024)}MB exceeds maximum of 20MB` },
          { status: 400 }
        );
      }
      
      console.log('✅ [VISION] Image fetched, size:', imageBuffer.length, 'bytes');
    } catch (bufferError: any) {
      console.error('❌ [VISION] Error processing image buffer:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process image', details: bufferError.message },
        { status: 500 }
      );
    }

    // Try to use @google-cloud/vision if installed; otherwise fall back to REST using API key
    try {
      // Dynamically require to avoid hard dependency in package.json
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();

      const [result] = await client.batchAnnotateImages({
        requests: [
          {
            image: { content: imageBuffer },
            features: [
              { type: 'FACE_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' },
            ],
          },
        ],
      });

      const visionResponse = result.responses?.[0] ?? result;
      const labels = (visionResponse.labelAnnotations || []).map((l: any) => ({ description: l.description, score: l.score }));

      return NextResponse.json({ labels, visionResponse });
    } catch (err: any) {
      console.warn('Vision SDK not available or failed, attempting REST fallback with API key:', err?.message || err);

      // REST fallback: use GOOGLE_API_KEY if provided
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('No GOOGLE_API_KEY available for REST fallback');
        return NextResponse.json({ error: 'Vision client not available on server and no GOOGLE_API_KEY configured for REST fallback.' }, { status: 500 });
      }

      try {
        let base64: string;
        try {
          base64 = imageBuffer.toString('base64');
        } catch (base64Error: any) {
          console.error('❌ [VISION] Base64 encoding error:', base64Error);
          return NextResponse.json(
            { error: 'Failed to encode image to base64', details: base64Error.message },
            { status: 500 }
          );
        }
        
        const restBody = {
          requests: [
            {
              image: { content: base64 },
              features: [
                { type: 'FACE_DETECTION', maxResults: 10 },
                { type: 'SAFE_SEARCH_DETECTION' },
              ],
            },
          ],
        };

        // Create AbortController with 90 second timeout (slightly less than maxDuration)
        const visionController = new AbortController();
        const visionTimeoutId = setTimeout(() => visionController.abort(), 90000); // 90 seconds
        
        let visionRes: Response;
        try {
          visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restBody),
            signal: visionController.signal,
          });
          clearTimeout(visionTimeoutId);
        } catch (visionFetchError: any) {
          clearTimeout(visionTimeoutId);
          if (visionFetchError.name === 'AbortError') {
            console.error('Vision REST call timed out after 90 seconds');
            return NextResponse.json({ error: 'Vision API request timed out. Please try again with a smaller image.' }, { status: 504 });
          }
          throw visionFetchError;
        }

        if (!visionRes.ok) {
          const text = await visionRes.text();
          console.error('Vision REST call failed:', visionRes.status, text);
          return NextResponse.json({ error: 'Vision REST call failed', details: text }, { status: 502 });
        }

        const visionJson = await visionRes.json();
        const visionResponse = visionJson.responses?.[0] || visionJson;
        const labels = (visionResponse.labelAnnotations || []).map((l: any) => ({ description: l.description, score: l.score }));

        return NextResponse.json({ labels, visionResponse, raw: visionJson });
      } catch (restErr: any) {
        console.error('Vision REST fallback error:', restErr?.message || restErr);
        return NextResponse.json({ error: 'Vision REST fallback failed', details: String(restErr) }, { status: 500 });
      }
    }
  } catch (e: any) {
    // Enhanced error logging
    console.error('❌ [VISION] Unhandled error:', {
      message: e?.message || String(e),
      name: e?.name,
      stack: e?.stack,
      code: e?.code,
      cause: e?.cause,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process vision request';
    let errorDetails = String(e?.message || e);
    
    if (e?.name === 'TypeError' && e?.message?.includes('fetch')) {
      errorMessage = 'Network error: Failed to connect to Vision API';
      errorDetails = 'Check your internet connection and API key configuration';
    } else if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED') {
      errorMessage = 'Network error: Cannot reach Vision API';
      errorDetails = 'API endpoint may be unreachable or API key is invalid';
    } else if (e?.message?.includes('JSON')) {
      errorMessage = 'Invalid response from Vision API';
      errorDetails = 'The API returned an unexpected response format';
    } else if (e?.message?.includes('require')) {
      errorMessage = 'Vision SDK initialization error';
      errorDetails = 'Failed to load @google-cloud/vision package';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: e?.stack,
          fullError: String(e)
        })
      },
      { status: 500 }
    );
  }
}
