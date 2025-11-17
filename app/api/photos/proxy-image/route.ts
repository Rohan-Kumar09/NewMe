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

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies['access_token'];

    // Basic diagnostics
    console.log('Proxy-image called; cookie header present:', !!cookieHeader, 'access_token present:', !!accessToken);

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated (missing access_token cookie)' }, { status: 401 });
    }

    const decodedToken = decodeURIComponent(accessToken);
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    console.log('Proxying image:', imageUrl);

    // Fetch the image with authorization header
    let imageRes: Response;
    try {
      imageRes = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${decodedToken}`,
        },
      });
    } catch (fetchErr) {
      console.error('Network/fetch error when proxying image:', fetchErr);
      return NextResponse.json({ error: 'Network error when fetching image', details: String(fetchErr) }, { status: 502 });
    }

    if (!imageRes.ok) {
      // Try to capture a small snippet of the response body for debugging (not the full binary)
      let bodySnippet = null;
      try {
        const txt = await imageRes.text();
        bodySnippet = txt.slice(0, 1000);
      } catch (e) {
        bodySnippet = '<no-text-body-unavailable>';
      }
      console.error('Image fetch error:', imageRes.status, imageRes.statusText, 'bodySnippet:', bodySnippet);
      return NextResponse.json(
        { error: 'Failed to fetch image', status: imageRes.status, statusText: imageRes.statusText, bodySnippet },
        { status: imageRes.status }
      );
    }

    // Get the image as a buffer
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await imageRes.arrayBuffer();
    } catch (e) {
      console.error('Error reading image response as arrayBuffer:', e);
      return NextResponse.json({ error: 'Failed to read image body', details: String(e) }, { status: 500 });
    }

    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (e) {
    console.error('Proxy image error (catch):', e);
    return NextResponse.json(
      { error: 'Internal server error', details: String(e) },
      { status: 500 }
    );
  }
}
