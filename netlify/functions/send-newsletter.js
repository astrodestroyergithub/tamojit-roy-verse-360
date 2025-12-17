const { Pool } = require('pg');
const { Resend } = require('resend');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Convert markdown-like syntax to HTML
function formatContent(content) {
    return content
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #667eea;">$1</a>')
        .replace(/\n/g, '<br>');
}

// Create HTML email template
function createEmailHTML(newsletter) {
    const formattedContent = formatContent(newsletter.content);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletter.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${newsletter.title}</h1>
                        </td>
                    </tr>
                    
                    ${newsletter.image_url ? `
                    <!-- Header Image -->
                    <tr>
                        <td style="padding: 0;">
                            <img src="${newsletter.image_url}" alt="${newsletter.title}" style="width: 100%; height: auto; display: block;">
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                                ${formattedContent}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                                You're receiving this because you subscribed to our newsletter.
                            </p>
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                © ${new Date().getFullYear()} Tamojit Roy. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

exports.handler = async (event, context) => {
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
        const { newsletter_id } = JSON.parse(event.body);

        // Get newsletter details
        const newsletterQuery = `
            SELECT * FROM newsletters WHERE id = $1
        `;
        const newsletterResult = await pool.query(newsletterQuery, [newsletter_id]);
        
        if (newsletterResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Newsletter not found' })
            };
        }

        const newsletter = newsletterResult.rows[0];

        // Get all subscribers
        const subscribersQuery = `
            SELECT email FROM newsletter_subscribers ORDER BY id
        `;
        const subscribersResult = await pool.query(subscribersQuery);
        const subscribers = subscribersResult.rows;

        if (subscribers.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No subscribers found' })
            };
        }

        // Update newsletter status to 'sending'
        await pool.query(
            `UPDATE newsletters SET status = 'sending', total_recipients = $1 WHERE id = $2`,
            [subscribers.length, newsletter_id]
        );

        // Create email HTML
        const emailHTML = createEmailHTML(newsletter);

        // Send emails in batches
        let successCount = 0;
        let failCount = 0;
        const batchSize = 10;

        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            
            const sendPromises = batch.map(async (subscriber) => {
                try {
                    await resend.emails.send({
                        from: process.env.FROM_EMAIL || 'newsletter@tamojitroyverse360.com',
                        to: subscriber.email,
                        subject: newsletter.subject,
                        html: emailHTML
                    });

                    // Log successful send
                    await pool.query(
                        `INSERT INTO newsletter_sends (newsletter_id, subscriber_email, status, sent_at)
                         VALUES ($1, $2, 'sent', NOW())`,
                        [newsletter_id, subscriber.email]
                    );

                    successCount++;
                    return { success: true, email: subscriber.email };
                } catch (error) {
                    console.error(`Failed to send to ${subscriber.email}:`, error);
                    
                    // Log failed send
                    await pool.query(
                        `INSERT INTO newsletter_sends (newsletter_id, subscriber_email, status, error_message)
                         VALUES ($1, $2, 'failed', $3)`,
                        [newsletter_id, subscriber.email, error.message]
                    );

                    failCount++;
                    return { success: false, email: subscriber.email, error: error.message };
                }
            });

            await Promise.all(sendPromises);

            // Small delay between batches to avoid rate limits
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update newsletter with final status
        await pool.query(
            `UPDATE newsletters 
             SET status = 'sent', 
                 sent_at = NOW(),
                 successful_sends = $1,
                 failed_sends = $2
             WHERE id = $3`,
            [successCount, failCount, newsletter_id]
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Newsletter sent successfully',
                total: subscribers.length,
                successful: successCount,
                failed: failCount
            })
        };
    } catch (error) {
        console.error('Send newsletter error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to send newsletter', details: error.message })
        };
    }
};
