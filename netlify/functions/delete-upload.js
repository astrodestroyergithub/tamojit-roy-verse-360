// netlify/functions/delete-upload.js
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { id, filename, sha } = JSON.parse(event.body);

    if (!id || !filename || !sha) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: id, filename, sha' 
        })
      };
    }

    // Delete from GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/contents/newsletter-uploads/${filename}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Delete newsletter: ${filename}`,
          sha: sha,
          branch: 'newsletter-uploads'
        })
      }
    );

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json();
      console.error('GitHub delete error:', errorData);
      throw new Error(errorData.message || 'GitHub deletion failed');
    }

    // Delete from database
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      DELETE FROM newsletter_uploads 
      WHERE id = ${id}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Document deleted successfully' 
      })
    };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Delete failed' 
      })
    };
  }
};
