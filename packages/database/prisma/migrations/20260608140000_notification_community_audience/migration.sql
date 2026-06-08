-- Target audience for community mass-mail campaigns (roster, followers, role type, etc.)
ALTER TABLE "email_notifications"."notifications"
ADD COLUMN "community_audience" TEXT;
