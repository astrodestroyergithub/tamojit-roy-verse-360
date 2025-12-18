// netlify/functions/update-appointment-status.js
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
    const { id, status } = JSON.parse(event.body);

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid status. Must be: pending, confirmed, completed, or cancelled' 
        })
      };
    }

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      UPDATE appointments 
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Appointment not found' 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        appointment: result[0],
        message: `Status updated to ${status}` 
      })
    };

  } catch (error) {
    console.error('Update status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to update status' 
      })
    };
  }
};
