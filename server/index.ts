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
const PORT = process.env.PORT ? Number(process.env.PORT) : Number(process.env.EXPRESS_PORT || 3001);

console.log("ENV DEBUG =>", {
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ? "SET" : "MISSING",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
});

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
// Increase body size limit to handle large base64 image data URLs (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Firebase Admin
let projectId: string | undefined;
try {
  // Check if Firebase credentials are provided via environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    projectId = serviceAccount.project_id;
    initializeApp({
      credential: credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Use Application Default Credentials (for Google Cloud deployment)
    projectId = process.env.FIREBASE_PROJECT_ID;
    initializeApp({
      projectId: projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  } else {
    const connectionString = process.env.FIREBASE_CONNECTION_STRING;
    if (connectionString) {
      projectId = connectionString.split(':')[0];
      console.log(`Using project ID from connection string: ${projectId}`);
      initializeApp({
        projectId: projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    } else {
      console.warn('Firebase credentials not found. Using default credentials.');
      projectId = process.env.FIREBASE_PROJECT_ID;
      initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined),
      });
    }
  }
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : 'not configured');
  console.log('Firebase Admin initialized successfully');
  console.log(`Storage bucket: ${storageBucket}`);
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
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Express server running on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

export default app;

