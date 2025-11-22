"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBase64ImageToStorage = uploadBase64ImageToStorage;
exports.isDataUrl = isDataUrl;
const storage_1 = require("firebase-admin/storage");
/**
 * Upload a base64 image data URL to Firebase Storage
 * @param dataUrl - Base64 data URL (e.g., "data:image/png;base64,iVBORw0KG...")
 * @param userId - User ID for organizing files
 * @returns Public download URL
 */
async function uploadBase64ImageToStorage(dataUrl, userId) {
    try {
        // Parse the data URL
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid data URL format');
        }
        const mimeType = matches[1]; // e.g., "image/png"
        const base64Data = matches[2]; // Base64 string without prefix
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        // Get storage bucket - try to get it explicitly if bucket name is available
        const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET;
        const bucket = storageBucketName
            ? (0, storage_1.getStorage)().bucket(storageBucketName)
            : (0, storage_1.getStorage)().bucket();
        if (!bucket) {
            throw new Error('Firebase Storage bucket not configured. Please set FIREBASE_STORAGE_BUCKET environment variable or configure storageBucket in Firebase initialization.');
        }
        // Generate unique filename using timestamp and random number
        const fileExtension = mimeType.split('/')[1] || 'png';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const fileName = `transformations/${userId}/${timestamp}-${random}.${fileExtension}`;
        // Upload file
        const file = bucket.file(fileName);
        await file.save(imageBuffer, {
            metadata: {
                contentType: mimeType,
                metadata: {
                    uploadedBy: userId,
                    uploadedAt: new Date().toISOString(),
                },
            },
            public: true, // Make file publicly accessible
        });
        // Make file publicly readable
        await file.makePublic();
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log(`✅ Image uploaded to Storage: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.error('❌ Error uploading image to Storage:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}
/**
 * Check if a URL is a base64 data URL
 */
function isDataUrl(url) {
    return url.startsWith('data:');
}
