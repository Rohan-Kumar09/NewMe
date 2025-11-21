import { NextResponse } from 'next/server';

// Exchange authorization code for tokens and set a session cookie (1 day)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Use NEXT_PUBLIC_APP_URL for redirects to avoid using internal container URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (url.protocol + '//' + url.host);

    if (error) {
      // User denied consent or another error from Google
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      console.error('Failed to exchange code:', await tokenRes.text());
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    const tokenJson = await tokenRes.json();
    // console.log('\n=== TOKEN EXCHANGE RESPONSE ===');
    // console.log('Has access_token:', !!tokenJson.access_token);
    // console.log('Has refresh_token:', !!tokenJson.refresh_token);
    // console.log('Has id_token:', !!tokenJson.id_token);
    // console.log('Scope from response:', tokenJson.scope);
    // console.log('================================\n');
    
    const idToken = tokenJson.id_token; // JWT
    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;

    // Set session cookies. Cookies expire in 1 day.
    const maxAge = 60 * 60 * 24; // 1 day in seconds
    const isProd = process.env.NODE_ENV === 'production';
    const secureSuffix = isProd ? ' Secure;' : '';

    const res = NextResponse.redirect(new URL('/', baseUrl));
    
    // Store id_token for user info
    res.headers.append(
      'Set-Cookie',
      `session=${encodeURIComponent(idToken ?? '')}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;${secureSuffix}`
    );
    
    // Store access_token for API calls
    res.headers.append(
      'Set-Cookie',
      `access_token=${encodeURIComponent(accessToken ?? '')}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;${secureSuffix}`
    );
    
    // Store refresh_token if provided
    if (refreshToken) {
      res.headers.append(
        'Set-Cookie',
        `refresh_token=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; Max-Age=${maxAge * 30}; SameSite=Lax;${secureSuffix}`
      );
    }
    
    return res;
  } catch (e) {
    console.error('Callback error', e);
    // Fallback to request.url if baseUrl wasn't set
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (new URL(request.url).protocol + '//' + new URL(request.url).host);
    return NextResponse.redirect(new URL('/', fallbackUrl));
  }
}
