-- Allow multiple payment rows per user per hackathon/event (history of attempts).
-- Application still blocks duplicate successful (CAPTURED/AUTHORIZED) payments at checkout.

DROP INDEX IF EXISTS "oppskills"."hackathon_payment_scope_hackathon_id_team_id_key";
DROP INDEX IF EXISTS "oppskills"."hackathon_payment_scope_hackathon_id_payer_user_id_key";
DROP INDEX IF EXISTS "oppskills"."event_payment_event_id_payer_user_id_key";
