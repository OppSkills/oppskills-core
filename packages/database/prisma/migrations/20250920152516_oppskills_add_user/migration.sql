-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "oppskills";

-- CreateTable
CREATE TABLE "oppskills"."user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "imageUrl" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "oppskills"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "oppskills"."user"("username");
