UPDATE newsletters
SET
    scheduled_at     = NULL,
    status           = 'sent',
    sent_at          = NOW(),
    total_recipients = (
        SELECT COUNT(*)
        FROM newsletter_subscribers
    ),
    successful_sends = (
        SELECT COUNT(*)
        FROM newsletter_subscribers
    ),
    updated_at       = NOW()
WHERE id IN (5, 12, 13);



INSERT INTO newsletter_sends (
    newsletter_id,
    subscriber_email,
    status,
    sent_at,
    created_at
)
SELECT
    n.id,
    s.email,
    n.status,
    n.sent_at,
    n.created_at
FROM newsletters AS n
CROSS JOIN newsletter_subscribers AS s
WHERE n.status = 'sent'
  AND NOT EXISTS (
      SELECT 1
      FROM newsletter_sends AS ns
      WHERE ns.newsletter_id     = n.id
        AND ns.subscriber_email  = s.email
  )
RETURNING *;



SELECT
    n.id,
    s.email,
    n.status,
    n.sent_at,
    n.created_at
FROM newsletters n
CROSS JOIN newsletter_subscribers s
WHERE n.status = 'sent';



UPDATE appointments
SET status = 'confirmed'
WHERE id IN (1, 2);



DEVL
I. TR-VRS-360-01-01: EXTREME ANALYTICS DASHBOARD (SUBSCRIBERS, NEWS-LETTERS, APPOINTMENTS)
    |---> TR-VRS-360-01-01-01: TECH BLOG TAB
            |---> TR-VRS-360-01-01-01-01: AI CHAT PAGE
    |---> TR-VRS-360-01-01-02: NIL
II. TR-VRS-360-02-01: NIL
III. TR-VRS-360-03-01: NIL
