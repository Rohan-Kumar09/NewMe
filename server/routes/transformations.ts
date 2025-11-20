import express, { Request, Response } from 'express';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to get Firestore instance
function getDb(): Firestore {
  return getFirestore();
}

interface Transformation {
  userId: string;
  originalImageUrl: string;
  transformedImageUrl: string;
  hairColor?: string;
  hairStyle?: string;
  prompt?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * POST /api/transformations
 * Save a new transformation result
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { originalImageUrl, transformedImageUrl, hairColor, hairStyle, prompt } = req.body;
    const user = req.user!;

    // Validate required fields
    if (!originalImageUrl || !transformedImageUrl) {
      return res.status(400).json({
        error: 'originalImageUrl and transformedImageUrl are required',
      });
    }

    const transformation: Omit<Transformation, 'createdAt' | 'updatedAt'> = {
      userId: user.userId,
      originalImageUrl,
      transformedImageUrl,
      hairColor: hairColor || null,
      hairStyle: hairStyle || null,
      prompt: prompt || null,
    };

    const db = getDb();
    const now = new Date();
    const docRef = await db.collection('transformations').add({
      ...transformation,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Transformation saved: ${docRef.id} for user ${user.userId}`);

    res.status(201).json({
      id: docRef.id,
      ...transformation,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Error saving transformation:', error);
    res.status(500).json({
      error: 'Failed to save transformation',
      message: error.message,
    });
  }
});

/**
 * GET /api/transformations
 * Get all transformations for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 50;
    const lastDocId = req.query.lastDocId as string | undefined;

    let query = db
      .collection('transformations')
      .where('userId', '==', user.userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Handle pagination with cursor (Firestore doesn't support offset)
    if (lastDocId) {
      const lastDoc = await db.collection('transformations').doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    const transformations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === limit;

    res.json({
      transformations,
      count: transformations.length,
      limit,
      hasMore,
      lastDocId: hasMore && lastDoc ? lastDoc.id : null,
    });
  } catch (error: any) {
    console.error('Error fetching transformations:', error);
    res.status(500).json({
      error: 'Failed to fetch transformations',
      message: error.message,
    });
  }
});

/**
 * GET /api/transformations/:id
 * Get a specific transformation by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const doc = await db.collection('transformations').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Transformation not found' });
    }

    const data = doc.data()!;

    // Verify ownership
    if (data.userId !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching transformation:', error);
    res.status(500).json({
      error: 'Failed to fetch transformation',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/transformations/:id
 * Delete a transformation
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const user = req.user!;

    const doc = await db.collection('transformations').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Transformation not found' });
    }

    const data = doc.data()!;

    // Verify ownership
    if (data.userId !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('transformations').doc(id).delete();

    console.log(`Transformation deleted: ${id} by user ${user.userId}`);

    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting transformation:', error);
    res.status(500).json({
      error: 'Failed to delete transformation',
      message: error.message,
    });
  }
});

/**
 * GET /api/transformations/stats/summary
 * Get statistics for the authenticated user
 */
router.get('/stats/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const user = req.user!;

    const snapshot = await db
      .collection('transformations')
      .where('userId', '==', user.userId)
      .get();

    const total = snapshot.size;
    const transformations = snapshot.docs.map(doc => doc.data());

    // Count by hair color
    const colorCounts: Record<string, number> = {};
    transformations.forEach(t => {
      if (t.hairColor) {
        colorCounts[t.hairColor] = (colorCounts[t.hairColor] || 0) + 1;
      }
    });

    // Count by hairstyle
    const styleCounts: Record<string, number> = {};
    transformations.forEach(t => {
      if (t.hairStyle) {
        styleCounts[t.hairStyle] = (styleCounts[t.hairStyle] || 0) + 1;
      }
    });

    res.json({
      total,
      colorCounts,
      styleCounts,
      mostUsedColor: Object.keys(colorCounts).reduce((a, b) => 
        colorCounts[a] > colorCounts[b] ? a : b, Object.keys(colorCounts)[0] || ''
      ) || null,
      mostUsedStyle: Object.keys(styleCounts).reduce((a, b) => 
        styleCounts[a] > styleCounts[b] ? a : b, Object.keys(styleCounts)[0] || ''
      ) || null,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

export default router;

