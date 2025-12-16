const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function isAuthenticated(event) {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    return true;
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

    if (!isAuthenticated(event)) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        const { id } = JSON.parse(event.body);

        // Delete newsletter (cascade will delete related sends)
        const query = `DELETE FROM newsletters WHERE id = $1`;
        await pool.query(query, [id]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Newsletter deleted' })
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete newsletter' })
        };
    }
};
