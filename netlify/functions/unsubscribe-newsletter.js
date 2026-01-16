const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, reason, additionalReason } = JSON.parse(event.body);

    if (!email || !reason) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and reason are required' })
      };
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert into unsubscribe audit table
      await client.query(
        `
        INSERT INTO newsletter_unsubscribers
        (email, reason, additional_reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        `,
        [email, reason, additionalReason]
      );

      // Remove from active subscribers
      await client.query(
        `DELETE FROM newsletter_subscribers WHERE email = $1`,
        [email]
      );

      await client.query('COMMIT');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
