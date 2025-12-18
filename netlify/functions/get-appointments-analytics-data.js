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
    // Service popularity
    const serviceStatsQuery = `
      SELECT 
        unnest(services) as service,
        COUNT(*)::int as count
      FROM appointments
      WHERE services IS NOT NULL AND array_length(services, 1) > 0
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10
    `;
    const serviceStats = await pool.query(serviceStatsQuery);

    // Budget distribution
    const budgetStatsQuery = `
      SELECT 
        budget, 
        COUNT(*)::int as count
      FROM appointments
      WHERE budget IS NOT NULL
      GROUP BY budget
      ORDER BY count DESC
    `;
    const budgetStats = await pool.query(budgetStatsQuery);

    // Monthly trends (last 6 months)
    const monthlyTrendsQuery = `
      SELECT 
        TO_CHAR(submission_date, 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM appointments
      WHERE submission_date >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month DESC
    `;
    const monthlyTrends = await pool.query(monthlyTrendsQuery);

    // Meeting type distribution
    const meetingTypeStatsQuery = `
      SELECT 
        meeting_type, 
        COUNT(*)::int as count
      FROM appointments
      WHERE meeting_type IS NOT NULL
      GROUP BY meeting_type
      ORDER BY count DESC
    `;
    const meetingTypeStats = await pool.query(meetingTypeStatsQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        serviceStats: serviceStats.rows,
        budgetStats: budgetStats.rows,
        monthlyTrends: monthlyTrends.rows,
        meetingTypeStats: meetingTypeStats.rows
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch appointments analytics data' })
    };
  }
};
