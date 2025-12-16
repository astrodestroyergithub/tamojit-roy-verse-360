// Simple password authentication
// In production, use proper hashing like bcrypt

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-password-123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Simple JWT creation (for demo - use jsonwebtoken package in production)
function createToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${body}.signature`;
}

function verifyToken(token) {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // Check if token is expired (24 hours)
        if (Date.now() > payload.exp) return false;
        return true;
    } catch {
        return false;
    }
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { password } = JSON.parse(event.body);

        if (password === ADMIN_PASSWORD) {
            // Create token valid for 24 hours
            const token = createToken({
                admin: true,
                exp: Date.now() + (24 * 60 * 60 * 1000)
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ token, message: 'Login successful' })
            };
        } else {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid password' })
            };
        }
    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Authentication failed' })
        };
    }
};

// Export verifyToken for use in other functions
exports.verifyToken = verifyToken;
