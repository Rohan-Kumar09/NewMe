/**
 * Utility functions for saving and retrieving transformations from the backend
 */

export interface Transformation {
  id?: string;
  originalImageUrl: string;
  transformedImageUrl: string;
  hairColor?: string;
  hairStyle?: string;
  prompt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveTransformationResponse {
  id: string;
  userId: string;
  originalImageUrl: string;
  transformedImageUrl: string;
  hairColor?: string;
  hairStyle?: string;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTransformationsResponse {
  transformations: Transformation[];
  count: number;
  limit: number;
  hasMore: boolean;
  lastDocId: string | null;
}

/**
 * Save a transformation to the backend
 */
export async function saveTransformation(
  originalImageUrl: string,
  transformedImageUrl: string,
  hairColor?: string,
  hairStyle?: string,
  prompt?: string
): Promise<SaveTransformationResponse> {
  console.log('[FETCH] Making request to /api/transformations/save');
  
  try {
    const response = await fetch('/api/transformations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies for authentication
      body: JSON.stringify({
        originalImageUrl,
        transformedImageUrl,
        hairColor,
        hairStyle,
        prompt,
      }),
    });

    console.log('📡 [FETCH] Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('📡 [FETCH] Error response:', errorData);
      } catch (e) {
        const text = await response.text();
        console.error('📡 [FETCH] Error response (text):', text);
        errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to save transformation`);
    }

    const data = await response.json();
    console.log('📡 [FETCH] Success response:', data);
    return data;
  } catch (error) {
    console.error('📡 [FETCH] Network or parsing error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to server. Make sure the Express server is running on port 3001.');
    }
    throw error;
  }
}

/**
 * Get user's transformations
 */
export async function getTransformations(
  limit: number = 50,
  lastDocId?: string
): Promise<GetTransformationsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (lastDocId) {
    params.append('lastDocId', lastDocId);
  }

  const response = await fetch(`/api/transformations/list?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transformations');
  }

  return await response.json();
}

/**
 * Delete a transformation
 */
export async function deleteTransformation(id: string): Promise<void> {
  const response = await fetch(`/api/transformations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete transformation');
  }
}

