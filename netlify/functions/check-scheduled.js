const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    try {
        // Find newsletters scheduled for now or earlier that haven't been sent
        const query = `
            SELECT id FROM newsletters
            WHERE status = 'scheduled'
            AND scheduled_at <= NOW()
        `;
        
        const result = await pool.query(query);
        
        // Trigger send for each scheduled newsletter
        for (const newsletter of result.rows) {
            await fetch(process.env.URL + '/.netlify/functions/send-newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newsletter_id: newsletter.id })
            });
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ checked: result.rows.length })
        };
    } catch (error) {
        console.error('Cron error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
