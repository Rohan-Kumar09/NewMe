import { NextResponse } from 'next/server';

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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const origin = new URL(request.url).origin;

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // If a relative/proxied path was provided (e.g. /api/photos/proxy-image?...), make absolute
    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`;

    // Fetch proxied image from our own server, forwarding cookies so /api/photos/proxy-image can use them
    const imageRes = await fetch(absoluteUrl, {
      method: 'GET',
      headers: {
        cookie: cookieHeader || '',
      },
    });

    if (!imageRes.ok) {
      const text = await imageRes.text();
      console.error('Proxy image fetch failed:', imageRes.status, text);
      return NextResponse.json({ error: 'Failed to fetch proxied image' }, { status: 502 });
    }

    const arrayBuf = await imageRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuf);

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
        const base64 = imageBuffer.toString('base64');
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

        const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(restBody),
        });

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
    console.error('Vision route error:', e?.message || e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
