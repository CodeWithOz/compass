/*
  Warnings:

  - Added the required column `updated_at` to the `resolutions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add updated_at column with default value for existing rows
ALTER TABLE "resolutions" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
