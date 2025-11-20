import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:3001';

/**
 * POST /api/transformations/save
 * Proxy request to Express backend to save transformation
 */
export async function POST(request: Request) {
  try {
    // Forward the request to Express backend
    const body = await request.json();
    const cookies = request.headers.get('cookie') || '';

    console.log('Forwarding to Express backend...');
    console.log('Has cookies:', !!cookies);
    console.log('Body keys:', Object.keys(body));

    const response = await fetch(`${EXPRESS_API_URL}/api/transformations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(body),
    });

    console.log('Express response status:', response.status);

    const data = await response.json();
    console.log('Express response data:', data);

    if (!response.ok) {
      console.error('Express returned error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Successfully proxied to Express');
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in proxy:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to Express server', 
          message: `Make sure the Express server is running on ${EXPRESS_API_URL}`,
          details: error.message 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save transformation', message: error.message },
      { status: 500 }
    );
  }
}

