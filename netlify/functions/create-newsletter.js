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
        const { title, subject, content, image_url, status, scheduled_at } = JSON.parse(event.body);
        console.log('Creating newsletter with data:', { title, subject, content, image_url, status, scheduled_at });

        // Validate required fields
        if (!title || !subject || !content) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Title, subject, and content are required' })
            };
        }

        // Insert newsletter
        const insertQuery = `
            INSERT INTO newsletters (title, subject, content, image_url, status, scheduled_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;

        const result = await pool.query(insertQuery, [
            title,
            subject,
            content,
            image_url || null,
            status || 'draft',
            scheduled_at || null
        ]);

        const newsletterId = result.rows[0].id;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Newsletter created successfully',
                id: newsletterId
            })
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create newsletter' })
        };
    }
};
