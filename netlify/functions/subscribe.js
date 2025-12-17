const { Pool } = require('pg');

// Initialize connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Referrer-Policy': 'no-referrer',
        'Content-Type': 'application/json'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true })
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email } = JSON.parse(event.body);
        console.log('Subscription attempt for email:', email);

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        // Get IP and user agent
        const ip_address = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
        // const ip_address = '';
        const user_agent = event.headers['user-agent'] || '';
        // const user_agent = '';

        // Insert into database
        const query = `
            INSERT INTO newsletter_subscribers (email, ip_address, user_agent)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
        `;

        const result = await pool.query(query, [email, ip_address, user_agent]);

        if (result.rows.length === 0) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'This email is already subscribed!' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Successfully subscribed to newsletter!' 
            })
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to subscribe. Please try again.' })
        };
    }
};
