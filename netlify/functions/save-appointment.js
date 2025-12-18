// netlify/functions/save-appointment.js
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields' 
        })
      };
    }

    // Get client IP
    const ipAddress = event.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     event.headers['x-nf-client-connection-ip'] || 
                     'unknown';

    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO appointments (
        first_name, 
        last_name, 
        email, 
        phone, 
        company,
        services, 
        other_services, 
        project_title, 
        project_description,
        budget, 
        timeline, 
        deliverables, 
        preferred_date, 
        preferred_time,
        alternate_date, 
        alternate_time, 
        meeting_type, 
        timezone,
        referral_source, 
        additional_notes, 
        urgent_request, 
        nda_required,
        ip_address,
        status
      ) VALUES (
        ${data.firstName}, 
        ${data.lastName}, 
        ${data.email}, 
        ${data.phone}, 
        ${data.company || null},
        ${data.services || []}, 
        ${data.otherServices || null}, 
        ${data.projectTitle}, 
        ${data.projectDescription},
        ${data.budget}, 
        ${data.timeline}, 
        ${data.deliverables || null}, 
        ${data.preferredDate}, 
        ${data.preferredTime},
        ${data.alternateDate || null}, 
        ${data.alternateTime || null}, 
        ${data.meetingType}, 
        ${data.timezone},
        ${data.referralSource || null}, 
        ${data.additionalNotes || null}, 
        ${data.urgentRequest === 'Yes'}, 
        ${data.ndaRequired === 'Yes'},
        ${ipAddress},
        'pending'
      ) RETURNING id
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        appointmentId: result[0].id,
        message: 'Appointment saved successfully'
      })
    };

  } catch (error) {
    console.error('Save appointment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Failed to save appointment' 
      })
    };
  }
};
