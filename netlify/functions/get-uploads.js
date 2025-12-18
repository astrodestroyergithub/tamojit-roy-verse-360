// netlify/functions/get-uploads.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple auth check
function isAuthenticated(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return true; // In production, verify the JWT properly
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const query = `
      SELECT 
        id,
        filename,
        newsletter_title,
        email_subject,
        status,
        scheduled_timestamp,
        upload_date,
        file_size,
        github_url,
        github_sha,
        uploaded_by,
        created_at
      FROM newsletter_uploads 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch uploads' })
    };
  }
};

/*** COMMENT OUT FOR NOW 
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Auth check
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    return { 
      statusCode: 401, 
      headers, 
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const uploads = await sql`
      SELECT 
        id,
        filename,
        newsletter_title,
        email_subject,
        status,
        scheduled_timestamp,
        upload_date,
        file_size,
        github_url,
        github_sha,
        uploaded_by,
        created_at
      FROM newsletter_uploads 
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(uploads)
    };

  } catch (error) {
    console.error('Get uploads error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to fetch uploads' 
      })
    };
  }
}; ***/
