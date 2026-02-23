-- DropForeignKey
ALTER TABLE "ai_interpretations" DROP CONSTRAINT "ai_interpretations_journal_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_activity" DROP CONSTRAINT "daily_activity_resolution_id_fkey";

-- DropForeignKey
ALTER TABLE "resolution_phases" DROP CONSTRAINT "resolution_phases_resolution_id_fkey";

-- DropForeignKey
ALTER TABLE "weekly_summaries" DROP CONSTRAINT "weekly_summaries_resolution_id_fkey";

-- AddForeignKey
ALTER TABLE "resolution_phases" ADD CONSTRAINT "resolution_phases_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
