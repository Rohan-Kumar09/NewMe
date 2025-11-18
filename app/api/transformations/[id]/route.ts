import { NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:3001';

/**
 * DELETE /api/transformations/[id]
 * Proxy request to Express backend to delete a transformation
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cookies = request.headers.get('cookie') || '';

    const response = await fetch(`${EXPRESS_API_URL}/api/transformations/${id}`, {
      method: 'DELETE',
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
    console.error('Error deleting transformation:', error);
    return NextResponse.json(
      { error: 'Failed to delete transformation', message: error.message },
      { status: 500 }
    );
  }
}

