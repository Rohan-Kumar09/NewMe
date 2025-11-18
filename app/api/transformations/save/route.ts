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

    const response = await fetch(`${EXPRESS_API_URL}/api/transformations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error saving transformation:', error);
    return NextResponse.json(
      { error: 'Failed to save transformation', message: error.message },
      { status: 500 }
    );
  }
}

