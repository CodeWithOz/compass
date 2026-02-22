/*
  Warnings:

  - A unique constraint covering the columns `[journal_entry_id,provider]` on the table `ai_interpretations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ai_interpretations_journal_entry_id_provider_key" ON "ai_interpretations"("journal_entry_id", "provider");
