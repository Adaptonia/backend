/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `channel` ADD COLUMN `inviteCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_inviteCode_key` ON `Channel`(`inviteCode`);
