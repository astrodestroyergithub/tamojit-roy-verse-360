const { Pool } = require('pg');
const fetch = global.fetch;
// const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function isAuthenticated(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return true;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (!isAuthenticated(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { id, filename, sha } = JSON.parse(event.body);

    // Delete from GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/contents/newsletter-uploads/${filename}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Delete newsletter document: ${filename}`,
          sha,
          branch: 'master'
        })
      }
    );

    if (!githubResponse.ok) {
      const err = await githubResponse.json();
      throw new Error(err.message || 'GitHub delete failed');
    }

    // Delete DB row
    await pool.query(
      `DELETE FROM newsletter_uploads WHERE id = $1`,
      [id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
