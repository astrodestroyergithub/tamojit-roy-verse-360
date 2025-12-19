const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async () => {
  try {

    const dailyAppointments = await pool.query(`
      SELECT DATE(created_at) as day, COUNT(*)::int
      FROM appointments
      GROUP BY day
      ORDER BY day
    `);

    const servicesRadar = await pool.query(`
      SELECT unnest(services) as service, COUNT(*)::int
      FROM appointments
      GROUP BY service
    `);

    const hourlyHeatmap = await pool.query(`
      SELECT EXTRACT(HOUR FROM preferred_time)::int as hour,
             COUNT(*)::int
      FROM appointments
      GROUP BY hour
    `);

    const newsletterFunnel = await pool.query(`
      SELECT status, COUNT(*)::int
      FROM newsletters
      GROUP BY status
    `);

    const subscriberGrowth = await pool.query(`
      SELECT DATE(subscribed_at) as day, COUNT(*)::int
      FROM newsletter_subscribers
      GROUP BY day
      ORDER BY day
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({
        appointments: {
          dailyTrend: dailyAppointments.rows,
          servicesRadar: servicesRadar.rows,
          hourHeatmap: hourlyHeatmap.rows
        },
        newsletters: {
          sendFunnel: newsletterFunnel.rows
        },
        subscribers: {
          growth: subscriberGrowth.rows
        }
      })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Analytics fetch failed" };
  }
};
