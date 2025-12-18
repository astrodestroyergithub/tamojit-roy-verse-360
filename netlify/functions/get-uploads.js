// netlify/functions/get-uploads.js
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
};
