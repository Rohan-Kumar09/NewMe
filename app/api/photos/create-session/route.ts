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

    const decodedToken = decodeURIComponent(accessToken);

    console.log('\n=== CREATING PHOTOS PICKER SESSION ===');
    console.log('Access token length:', decodedToken.length);

    // Create a Photos Picker API session
    const sessionRes = await fetch('https://photospicker.googleapis.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decodedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    console.log('Session response status:', sessionRes.status);

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error('=== SESSION CREATION ERROR ===');
      console.error('Status:', sessionRes.status);
      console.error('Error text:', errorText);
      console.error('==============================');
      
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        parsedError = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          error: 'Please login to continue!', 
          details: errorText,
          parsedError 
        },
        { status: sessionRes.status }
      );
    }

    const sessionData = await sessionRes.json();
    
    return NextResponse.json({
      sessionId: sessionData.id,
      pickerUri: sessionData.pickerUri,
    });
  } catch (e) {
    console.error('Create session error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
