-- Consolidated domain PostgreSQL schemas (from legacy oppskills schema).
-- Layout: admin | user | common | events | hackathon | payments | email_notifications
--
-- Safety:
-- - No DROP TABLE / TRUNCATE / DELETE — only CREATE SCHEMA + ALTER ... SET SCHEMA (moves metadata; row data stays attached).
-- - Idempotent: each move runs only if the object still lives in oppskills (safe after partial failure or re-deploy).
-- - Advisory lock: prevents two migration runners from executing this concurrently.

SELECT pg_advisory_xact_lock(872451961, 20260516);

CREATE SCHEMA IF NOT EXISTS "admin";
CREATE SCHEMA IF NOT EXISTS "user";
CREATE SCHEMA IF NOT EXISTS "common";
CREATE SCHEMA IF NOT EXISTS "events";
CREATE SCHEMA IF NOT EXISTS "hackathon";
CREATE SCHEMA IF NOT EXISTS "payments";
CREATE SCHEMA IF NOT EXISTS "email_notifications";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'ApprovalStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."ApprovalStatus" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'LifecycleStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."LifecycleStatus" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'LocationType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."LocationType" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'ReferralEntityType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."ReferralEntityType" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'RegistrationFieldType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."RegistrationFieldType" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'Visibility'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."Visibility" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'LogLevel'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."LogLevel" SET SCHEMA "email_notifications"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'NotificationStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."NotificationStatus" SET SCHEMA "email_notifications"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'ScheduleType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."ScheduleType" SET SCHEMA "email_notifications"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'CollegeMatchMode'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."CollegeMatchMode" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'EventAttendeeEligibility'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."EventAttendeeEligibility" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'EventType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."EventType" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'EventUserRole'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."EventUserRole" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'PassSendingMode'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."PassSendingMode" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonAttendeeEligibility'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonAttendeeEligibility" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonChargeMode'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonChargeMode" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonMode'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonMode" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonRoundType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonRoundType" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonType" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonUserRole'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonUserRole" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'ParticipantType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."ParticipantType" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'RoundStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."RoundStatus" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'DiscountCodeType'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."DiscountCodeType" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'EventPaymentOrderStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."EventPaymentOrderStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'EventPaymentStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."EventPaymentStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'FeeBearer'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."FeeBearer" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonPaymentOrderStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonPaymentOrderStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonPaymentScope'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonPaymentScope" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'HackathonPaymentStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."HackathonPaymentStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'PayoutStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."PayoutStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'RazorpayRouteStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."RazorpayRouteStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'RefundStatus'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."RefundStatus" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'AccessLevel'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."AccessLevel" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'ExperienceLevel'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."ExperienceLevel" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'Gender'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."Gender" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'TeamPreference'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."TeamPreference" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills'
      AND t.typname = 'UserCategory'
      AND t.typtype = 'e'
  ) THEN
    EXECUTE 'ALTER TYPE oppskills."UserCategory" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'admin_entity'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."admin_entity" SET SCHEMA "admin"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'admin_log'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."admin_log" SET SCHEMA "admin"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'festival'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."festival" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'referral'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."referral" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'referral_click'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."referral_click" SET SCHEMA "common"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'notification_logs'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."notification_logs" SET SCHEMA "email_notifications"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."notifications" SET SCHEMA "email_notifications"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_attachment'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_attachment" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_participant'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_participant" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_pass'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_pass" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_prize_breakdown'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_prize_breakdown" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_registration_answer'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_registration_answer" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_registration_field'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_registration_field" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_registration_form'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_registration_form" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_registration_submission'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_registration_submission" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_user_role'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_user_role" SET SCHEMA "events"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_attachment'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_attachment" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_registration_answer'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_registration_answer" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_registration_submission'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_registration_submission" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_team_round_submission'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_team_round_submission" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_user_role'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_user_role" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'prize_breakdown'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."prize_breakdown" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'registration_field'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."registration_field" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'registration_form'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."registration_form" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'round'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."round" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'team'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."team" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'team_member'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."team_member" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'team_round_qualification'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."team_round_qualification" SET SCHEMA "hackathon"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_discount_code'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_discount_code" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_discount_redemption'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_discount_redemption" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_payment'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_payment" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_payout'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_payout" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'event_payout_item'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."event_payout_item" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_discount_code'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_discount_code" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_discount_redemption'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_discount_redemption" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_payment'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_payment" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_payout'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_payout" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'hackathon_payout_item'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."hackathon_payout_item" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'incomplete_registration_reminder_log'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."incomplete_registration_reminder_log" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'organizer_payout_details'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."organizer_payout_details" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'payment_registration_escrow'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."payment_registration_escrow" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'razorpay_route_account'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."razorpay_route_account" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'razorpay_webhook_event'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."razorpay_webhook_event" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'ticket_tier'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."ticket_tier" SET SCHEMA "payments"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'college'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."college" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'feature_waitlist'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."feature_waitlist" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'user'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."user" SET SCHEMA "user"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'oppskills'
      AND tablename = 'user_onboarding_profile'
  ) THEN
    EXECUTE 'ALTER TABLE oppskills."user_onboarding_profile" SET SCHEMA "user"';
  END IF;
END $$;

-- Legacy oppskills schema is left intact (may be empty). Do not auto-DROP in production.