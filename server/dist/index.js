"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_admin_1 = require("firebase-admin");
const transformations_1 = __importDefault(require("./routes/transformations"));
const auth_1 = __importDefault(require("./middleware/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.EXPRESS_PORT || '3001', 10);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
}));
// Increase body size limit to handle large base64 image data URLs (50MB)
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Initialize Firebase Admin
let projectId;
try {
    // Check if Firebase credentials are provided via environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        projectId = serviceAccount.project_id;
        (0, app_1.initializeApp)({
            credential: firebase_admin_1.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        });
    }
    else if (process.env.FIREBASE_PROJECT_ID) {
        // Use Application Default Credentials (for Google Cloud deployment)
        projectId = process.env.FIREBASE_PROJECT_ID;
        (0, app_1.initializeApp)({
            projectId: projectId,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        });
    }
    else {
        const connectionString = process.env.FIREBASE_CONNECTION_STRING;
        if (connectionString) {
            projectId = connectionString.split(':')[0];
            console.log(`Using project ID from connection string: ${projectId}`);
            (0, app_1.initializeApp)({
                projectId: projectId,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
            });
        }
        else {
            console.warn('Firebase credentials not found. Using default credentials.');
            projectId = process.env.FIREBASE_PROJECT_ID;
            (0, app_1.initializeApp)({
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined),
            });
        }
    }
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : 'not configured');
    console.log('Firebase Admin initialized successfully');
    console.log(`Storage bucket: ${storageBucket}`);
}
catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}
// Initialize Firestore
const db = (0, firestore_1.getFirestore)();
console.log('Firestore initialized');
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/transformations', auth_1.default, transformations_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
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
exports.default = app;
