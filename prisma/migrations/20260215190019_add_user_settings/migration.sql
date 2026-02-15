-- CreateEnum
CREATE TYPE "AIProviderType" AS ENUM ('CLAUDE', 'OPENAI', 'GEMINI');

-- AlterTable
ALTER TABLE "resolutions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT 'default',
    "ai_provider" "AIProviderType" NOT NULL DEFAULT 'CLAUDE',
    "anthropic_api_key" TEXT,
    "openai_api_key" TEXT,
    "gemini_api_key" TEXT,
    "experimental_phases" BOOLEAN NOT NULL DEFAULT true,
    "hard_mode" BOOLEAN NOT NULL DEFAULT false,
    "reflective_reminders" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");
