-- AlterTable
ALTER TABLE "oppskills"."user_onboarding_profile" ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "user_category" SET DEFAULT 'COLLEGE_STUDENT',
ALTER COLUMN "location_city" DROP NOT NULL,
ALTER COLUMN "location_state" DROP NOT NULL,
ALTER COLUMN "location_country" DROP NOT NULL;
