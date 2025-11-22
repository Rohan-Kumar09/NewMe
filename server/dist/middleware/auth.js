"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
/**
 * Middleware to authenticate requests using Google ID token from cookies
 */
async function authMiddleware(req, res, next) {
    try {
        // Get session cookie (ID token) from request
        const cookies = req.headers.cookie || '';
        const cookieMap = {};
        cookies.split(';').forEach(cookie => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
                cookieMap[key] = decodeURIComponent(value);
            }
        });
        const idToken = cookieMap['session'];
        if (!idToken) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Verify token with Google tokeninfo endpoint
        const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
        const verifyRes = await fetch(tokenInfoUrl);
        if (!verifyRes.ok) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const tokenInfo = await verifyRes.json();
        // Attach user info to request
        req.user = {
            email: tokenInfo.email || '',
            name: tokenInfo.name || null,
            picture: tokenInfo.picture || null,
            userId: tokenInfo.sub || tokenInfo.email || '', // Use Google user ID or email as fallback
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}
