import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import transformationsRouter from './routes/transformations';
import authMiddleware from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin
try {
  // Check if Firebase credentials are provided via environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Use Application Default Credentials (for Google Cloud deployment)
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    const connectionString = process.env.FIREBASE_CONNECTION_STRING;
    if (connectionString) {
      const projectId = connectionString.split(':')[0];
      console.log(`Using project ID from connection string: ${projectId}`);
      initializeApp({
        projectId: projectId,
      });
    } else {
      console.warn('Firebase credentials not found. Using default credentials.');
      initializeApp();
    }
  }
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Initialize Firestore
const db = getFirestore();
console.log('Firestore initialized');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/transformations', authMiddleware, transformationsRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;

