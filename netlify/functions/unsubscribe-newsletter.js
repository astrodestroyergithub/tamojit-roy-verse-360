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

  const { email, reason, additionalReason } = JSON.parse(event.body || '{}');

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

    /* 1️⃣ Check existence in subscribers table */
    const subscriberResult = await client.query(
      `SELECT 1 FROM newsletter_subscribers WHERE email = $1`,
      [email]
    );

    if (subscriberResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Email address is not subscribed'
        })
      };
    }

    /* 2️⃣ Insert into unsubscribe audit table */
    await client.query(
      `
      INSERT INTO newsletter_unsubscribers
        (email, reason, additional_reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      `,
      [email, reason, additionalReason || null]
    );

    /* 3️⃣ Delete from active subscribers */
    await client.query(
      `DELETE FROM newsletter_subscribers WHERE email = $1`,
      [email]
    );

    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully unsubscribed'
      })
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unsubscribe error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    client.release();
  }
};
