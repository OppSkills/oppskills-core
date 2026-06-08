-- Add FOLLOWER access control role for users who follow a community page.
-- Must be separate from the data backfill: PostgreSQL cannot use a new enum
-- value in the same transaction as ALTER TYPE ... ADD VALUE.
ALTER TYPE "community"."CommunityAccessControlRole" ADD VALUE 'FOLLOWER';
