const { Pool } = require('pg');
const UAParser = require('ua-parser-js');

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
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {

    const body = JSON.parse(event.body || '{}');

    const ua = event.headers['user-agent'] || '';

    const parser = new UAParser(ua);

    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const ip =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['client-ip'] ||
      'unknown';

    console.log({
        ip: event.headers['x-nf-client-connection-ip'],
        country: event.headers['x-nf-geo-country'],
        region: event.headers['x-nf-geo-region'],
        city: event.headers['x-nf-geo-city'],
        latitude: event.headers['x-nf-geo-latitude'],
        longitude: event.headers['x-nf-geo-longitude']
    });

    await pool.query(
      `
      INSERT INTO blog_visit_logs(
        blog_number,
        session_id,
        ip,
        country,
        region,
        city,
        latitude,
        longitude,
        user_agent,
        browser_name,
        browser_version,
        os_name,
        os_version,
        device_type,
        screen_resolution,
        viewport_size,
        timezone,
        language,
        referrer,
        cookies_enabled,
        touch_enabled,
        color_depth,
        hardware_concurrency,
        memory_gb,
        network_type,
        page_load_time_ms,
        headers,
        is_bot
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28
      )
      `,
      [
        body.blogNumber,
        body.sessionId,

        ip,

        event.headers['x-nf-geo-country'],
        event.headers['x-nf-geo-region'],
        event.headers['x-nf-geo-city'],

        event.headers['x-nf-geo-latitude'],
        event.headers['x-nf-geo-longitude'],

        ua,

        browser.name,
        browser.version,

        os.name,
        os.version,

        device.type || 'desktop',

        body.screenResolution,
        body.viewportSize,

        body.timezone,
        body.language,

        event.headers['referer'],

        body.cookiesEnabled,
        body.touchEnabled,
        body.colorDepth,
        body.hardwareConcurrency,
        body.deviceMemory,
        body.networkType,
        body.pageLoadTime,

        JSON.stringify(event.headers),

        body.isBot
      ]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true
      })
    };

  } catch(err) {

    console.error(err);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'logging failed'
      })
    };
  }
};
