-- Registration incident — diagnostic queries (PostgreSQL, multi-schema)
-- Replace :festival_id with your festival UUID string.

-- =============================================================================
-- 1. Day-bucketed: paid vs submission (hackathons under festival)
-- =============================================================================
SELECT
  DATE(hp.created_at) AS registration_day,
  COUNT(*)::bigint AS total_paid,
  COUNT(hrs.id)::bigint AS has_submission,
  (COUNT(*) - COUNT(hrs.id))::bigint AS missing_submission
FROM payments.hackathon_payment hp
INNER JOIN hackathon.hackathon h ON h.id = hp.hackathon_id
LEFT JOIN hackathon.hackathon_registration_submission hrs
  ON hrs.hackathon_id = hp.hackathon_id
  AND hrs.user_id = hp.payer_user_id
WHERE h.festival_id = :festival_id
  AND hp.payment_status IN ('CAPTURED', 'AUTHORIZED')
GROUP BY DATE(hp.created_at)
ORDER BY registration_day;

-- =============================================================================
-- 2. Per hackathon: paid vs missing submission (festival)
-- =============================================================================
SELECT
  h.slug,
  h.charge_mode::text,
  COUNT(hp.id)::bigint AS paid_count,
  COUNT(hrs.id)::bigint AS submitted_count,
  (COUNT(hp.id) - COUNT(hrs.id))::bigint AS missing
FROM payments.hackathon_payment hp
INNER JOIN hackathon.hackathon h ON h.id = hp.hackathon_id
LEFT JOIN hackathon.hackathon_registration_submission hrs
  ON hrs.hackathon_id = hp.hackathon_id
  AND hrs.user_id = hp.payer_user_id
WHERE h.festival_id = :festival_id
  AND hp.payment_status IN ('CAPTURED', 'AUTHORIZED')
GROUP BY h.slug, h.charge_mode
ORDER BY missing DESC;

-- =============================================================================
-- 3. Affected users list (hackathon, for outreach)
-- =============================================================================
SELECT
  u.email,
  u."firstName",
  u."lastName",
  h.title AS hackathon_name,
  h.slug AS hackathon_slug,
  hp.created_at AS payment_date,
  hp.id AS payment_id,
  hp.razorpay_order_id
FROM payments.hackathon_payment hp
INNER JOIN hackathon.hackathon h ON h.id = hp.hackathon_id
INNER JOIN "user"."user" u ON u.id = hp.payer_user_id
WHERE h.festival_id = :festival_id
  AND hp.payment_status IN ('CAPTURED', 'AUTHORIZED')
  AND NOT EXISTS (
    SELECT 1
    FROM hackathon.hackathon_registration_submission hrs
    WHERE hrs.hackathon_id = hp.hackathon_id
      AND hrs.user_id = hp.payer_user_id
  )
ORDER BY hp.created_at DESC;

-- =============================================================================
-- 4. Events under same festival (mirror for event_payment / event_registration_submission)
-- =============================================================================
SELECT
  DATE(ep.created_at) AS payment_day,
  COUNT(*)::bigint AS total_paid,
  COUNT(ers.id)::bigint AS has_submission,
  (COUNT(*) - COUNT(ers.id))::bigint AS missing_submission
FROM payments.event_payment ep
INNER JOIN events.event e ON e.id = ep.event_id
LEFT JOIN events.event_registration_submission ers
  ON ers.event_id = ep.event_id
  AND ers.user_id = ep.payer_user_id
WHERE e.festival_id = :festival_id
  AND ep.payment_status IN ('CAPTURED', 'AUTHORIZED')
GROUP BY DATE(ep.created_at)
ORDER BY payment_day;

-- =============================================================================
-- 5. Timing: seconds between payment capture and submission (sample)
-- =============================================================================
SELECT
  hp.razorpay_order_id,
  hp.captured_at,
  hp.created_at,
  hrs.submitted_at,
  EXTRACT(
    EPOCH FROM (hrs.submitted_at - hp.captured_at)
  ) AS seconds_between_capture_and_submission
FROM payments.hackathon_payment hp
LEFT JOIN hackathon.hackathon_registration_submission hrs
  ON hrs.hackathon_id = hp.hackathon_id
  AND hrs.user_id = hp.payer_user_id
INNER JOIN hackathon.hackathon h ON h.id = hp.hackathon_id
WHERE h.festival_id = :festival_id
  AND hp.payment_status = 'CAPTURED'
ORDER BY hp.captured_at DESC
LIMIT 200;
