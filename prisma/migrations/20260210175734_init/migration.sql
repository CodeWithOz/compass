-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('HABIT_BUNDLE', 'MEASURABLE_OUTCOME', 'EXPLORATORY_TRACK');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MomentumSignal" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReframeType" AS ENUM ('MISALIGNMENT', 'STAGNATION', 'OVER_OPTIMIZATION', 'PHASE_MISMATCH', 'EXIT_SIGNAL');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "MomentumTrend" AS ENUM ('DECLINING', 'STABLE', 'GROWING');

-- CreateTable
CREATE TABLE "resolutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResolutionType" NOT NULL,
    "purpose" TEXT,
    "constraints" TEXT,
    "success_signals" TEXT,
    "failure_modes" TEXT,
    "non_goals" TEXT,
    "status" "ResolutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "target_date" TIMESTAMP(3),
    "exit_criteria" TEXT,
    "current_phase_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolution_phases" (
    "id" TEXT NOT NULL,
    "resolution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "expected_frequency" TEXT,
    "intensity_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolution_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_text" TEXT NOT NULL,
    "linked_resolution_ids" TEXT[],

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interpretations" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "detected_activity" JSONB NOT NULL,
    "momentum_signal" "MomentumSignal" NOT NULL,
    "risk_flags" TEXT[],
    "suggested_adjustments" TEXT,
    "reframe_type" "ReframeType",
    "reframe_reason" TEXT,
    "reframe_suggestion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interpretations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "resolution_id" TEXT NOT NULL,
    "activity_level" "ActivityLevel" NOT NULL,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_summaries" (
    "id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "resolution_id" TEXT NOT NULL,
    "engagement_score" INTEGER NOT NULL,
    "momentum_trend" "MomentumTrend" NOT NULL,
    "summary_text" TEXT,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_date_resolution_id_key" ON "daily_activity"("date", "resolution_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_summaries_week_start_resolution_id_key" ON "weekly_summaries"("week_start", "resolution_id");

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "resolution_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_phases" ADD CONSTRAINT "resolution_phases_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
