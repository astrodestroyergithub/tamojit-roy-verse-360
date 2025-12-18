// netlify/functions/get-appointments.js
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
    
    // Get all appointments
    const appointments = await sql`
      SELECT * FROM appointments 
      ORDER BY submission_date DESC
    `;

    // Get analytics
    const analytics = await sql`
      SELECT 
        COUNT(*)::int as total_appointments,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'completed')::int as completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int as cancelled_count,
        COUNT(*) FILTER (WHERE urgent_request = true)::int as urgent_count,
        COUNT(*) FILTER (WHERE nda_required = true)::int as nda_count,
        COUNT(*) FILTER (WHERE submission_date >= NOW() - INTERVAL '30 days')::int as last_30_days,
        COUNT(*) FILTER (WHERE submission_date >= NOW() - INTERVAL '7 days')::int as last_7_days
      FROM appointments
    `;

    // Service popularity
    const serviceStats = await sql`
      SELECT 
        unnest(services) as service,
        COUNT(*)::int as count
      FROM appointments
      WHERE services IS NOT NULL AND array_length(services, 1) > 0
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10
    `;

    // Budget distribution
    const budgetStats = await sql`
      SELECT 
        budget, 
        COUNT(*)::int as count
      FROM appointments
      WHERE budget IS NOT NULL
      GROUP BY budget
      ORDER BY count DESC
    `;

    // Timeline distribution
    const timelineStats = await sql`
      SELECT 
        timeline, 
        COUNT(*)::int as count
      FROM appointments
      WHERE timeline IS NOT NULL
      GROUP BY timeline
      ORDER BY count DESC
    `;

    // Meeting type distribution
    const meetingTypeStats = await sql`
      SELECT 
        meeting_type, 
        COUNT(*)::int as count
      FROM appointments
      WHERE meeting_type IS NOT NULL
      GROUP BY meeting_type
      ORDER BY count DESC
    `;

    // Referral source distribution
    const referralStats = await sql`
      SELECT 
        referral_source, 
        COUNT(*)::int as count
      FROM appointments
      WHERE referral_source IS NOT NULL 
        AND referral_source != ''
      GROUP BY referral_source
      ORDER BY count DESC
    `;

    // Monthly trends (last 6 months)
    const monthlyTrends = await sql`
      SELECT 
        TO_CHAR(submission_date, 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM appointments
      WHERE submission_date >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        appointments,
        analytics: analytics[0],
        serviceStats,
        budgetStats,
        timelineStats,
        meetingTypeStats,
        referralStats,
        monthlyTrends
      })
    };

  } catch (error) {
    console.error('Get appointments error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to fetch appointments' 
      })
    };
  }
};
