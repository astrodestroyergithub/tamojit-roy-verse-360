const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    const ip =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['client-ip'] ||
      'unknown';

    // Netlify GEO
    const country = event.headers['x-nf-geo-country'];
    const city = event.headers['x-nf-geo-city'];
    const region = event.headers['x-nf-geo-region'];
    const latitude = event.headers['x-nf-geo-latitude'];
    const longitude = event.headers['x-nf-geo-longitude'];

    const ua = event.headers['user-agent'] || '';
    const isBot = /(bot|crawler|spider|curl|wget|headless)/i.test(ua) ||
                  !body.screenResolution ||
                  !body.timezone;

    // ⭐ DUPLICATE SUPPRESSION
    const duplicateCheck = await pool.query(
      `SELECT id FROM resume_download_logs
       WHERE ip=$1 AND session_id=$2
       AND download_at > NOW() - INTERVAL '5 minutes'
       LIMIT 1`,
      [ip, body.sessionId]
    );

    if (duplicateCheck.rows.length > 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ duplicate:true }) };
    }

    const query = `
      INSERT INTO resume_download_logs(
        ip,country,region,city,latitude,longitude,
        user_agent,referrer,accept_language,
        screen_resolution,timezone,cookies_enabled,
        page_url,session_id,headers,
        client_click_time,hover_duration_ms,page_dwell_time_ms,intent_score,is_bot
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    `;

    await pool.query(query, [
      ip,
      country,
      region,
      city,
      latitude,
      longitude,
      ua,
      event.headers['referer'],
      event.headers['accept-language'],
      body.screenResolution,
      body.timezone,
      body.cookiesEnabled,
      body.pageUrl,
      body.sessionId,
      JSON.stringify(event.headers),
      body.clientClickTime,
      body.hoverDuration,
      body.pageDwell,
      body.intentScore,
      isBot
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success:true })
    };

  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error:'logging failed' })
    };
  }
};
