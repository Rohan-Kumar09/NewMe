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
    
    const hasSession = !!cookies['session'];
    const hasAccessToken = !!cookies['access_token'];
    const hasRefreshToken = !!cookies['refresh_token'];

    let tokenInfo = null;
    let tokenValid = false;

    if (hasAccessToken) {
      const decodedToken = decodeURIComponent(cookies['access_token']);
      
      // Try to get token info from Google
      try {
        const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(decodedToken)}`;
        const tokenRes = await fetch(tokenInfoUrl);
        
        if (tokenRes.ok) {
          tokenInfo = await tokenRes.json();
          tokenValid = true;
        } else {
          const errorText = await tokenRes.text();
          tokenInfo = { error: errorText };
        }
      } catch (e) {
        tokenInfo = { error: String(e) };
      }
    }

    return NextResponse.json({
      cookiesPresent: {
        session: hasSession,
        access_token: hasAccessToken,
        refresh_token: hasRefreshToken,
      },
      accessTokenValid: tokenValid,
      tokenInfo: tokenInfo,
      scopes: tokenInfo?.scope?.split(' ') || [],
      envConfigured: {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
        GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
        GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
      hasPhotosScope: tokenInfo?.scope?.includes('photoslibrary') || false,
      apiEndpoints: {
        gemini: {
          configured: !!process.env.GOOGLE_API_KEY,
          maxDuration: 300, // 5 minutes
        },
        vision: {
          configured: !!process.env.GOOGLE_API_KEY,
          maxDuration: 120, // 2 minutes
          sdkAvailable: (() => {
            try {
              require.resolve('@google-cloud/vision');
              return true;
            } catch {
              return false;
            }
          })(),
        },
      },
    });
  } catch (e) {
    console.error('Diagnostics error:', e);
    return NextResponse.json(
      { error: 'Failed to run diagnostics', details: String(e) },
      { status: 500 }
    );
  }
}
