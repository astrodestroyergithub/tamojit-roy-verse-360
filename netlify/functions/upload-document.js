// netlify/functions/upload-document.js
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // CORS headers
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
    const { 
      filename, 
      content, 
      newsletterTitle, 
      emailSubject, 
      status, 
      scheduledTimestamp 
    } = JSON.parse(event.body);

    // Validate filename format
    const filenameRegex = /^(.+)_(.+)_(sending|sent|scheduled|draft)(_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})?_\d{4}-\d{2}-\d{2}\.docx$/;
    if (!filenameRegex.test(filename)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid filename format. Must be: Title_Subject_Status_Date.docx' 
        })
      };
    }

    // Upload to GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/contents/newsletter-uploads/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Upload newsletter: ${newsletterTitle}`,
          content: content, // Base64 encoded file
          branch: 'newsletter-uploads'
        })
      }
    );

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error('GitHub API Error:', githubData);
      throw new Error(githubData.message || 'GitHub upload failed');
    }

    // Store metadata in Neon DB
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
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
      ) VALUES (
        ${filename}, 
        ${newsletterTitle}, 
        ${emailSubject}, 
        ${status},
        ${scheduledTimestamp || null}, 
        NOW(), 
        ${content.length}, 
        ${githubData.content.download_url}, 
        ${githubData.content.sha}
      ) RETURNING *
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        upload: result[0],
        githubUrl: githubData.content.download_url
      })
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Upload failed' 
      })
    };
  }
};
