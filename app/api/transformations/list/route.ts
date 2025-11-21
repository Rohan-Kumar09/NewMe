import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:3001';

/**
 * GET /api/transformations/list
 * Proxy request to Express backend to get user's transformations
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';
    const lastDocId = url.searchParams.get('lastDocId') || undefined;
    const cookies = request.headers.get('cookie') || '';

    let apiUrl = `${EXPRESS_API_URL}/api/transformations?limit=${limit}`;
    if (lastDocId) {
      apiUrl += `&lastDocId=${encodeURIComponent(lastDocId)}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching transformations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transformations', message: error.message },
      { status: 500 }
    );
  }
}

