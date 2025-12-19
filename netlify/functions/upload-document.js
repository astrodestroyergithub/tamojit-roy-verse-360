const { Pool } = require('pg');
const fetch = global.fetch;
// const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple auth check
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
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const {
      filename,
      content,
      newsletterTitle,
      emailSubject,
      status,
      scheduledTimestamp
    } = JSON.parse(event.body);

    // Filename validation (matches your UI output)
    const filenameRegex =
      /^.+_.+_(sending|sent|scheduled|draft)(_\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?_\d{4}-\d{2}-\d{2}\.docx$/;

    if (!filenameRegex.test(filename)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid filename format' })
      };
    }

    // Upload to GitHub (master branch)
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/contents/newsletter-uploads/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Upload newsletter document: ${newsletterTitle}`,
          content,
          branch: 'master'
        })
      }
    );

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error('GitHub error:', githubData);
      throw new Error(githubData.message || 'GitHub upload failed');
    }

    // Correct file size calculation
    const fileSize = Buffer.from(content, 'base64').length;

    // Insert metadata into DB
    const result = await pool.query(
      `
      INSERT INTO newsletter_uploads (
        filename,
        newsletter_title,
        email_subject,
        status,
        scheduled_timestamp,
        upload_date,
        file_size,
        github_url,
        github_sha
      )
      VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8)
      RETURNING *
      `,
      [
        filename,
        newsletterTitle,
        emailSubject,
        status,
        scheduledTimestamp || null,
        fileSize,
        githubData.content.download_url,
        githubData.content.sha
      ]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        upload: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
