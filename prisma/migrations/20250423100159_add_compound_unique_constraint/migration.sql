/*
  Warnings:

  - A unique constraint covering the columns `[email,provider]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- CreateIndex
CREATE INDEX `User_providerId_idx` ON `User`(`providerId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_provider_key` ON `User`(`email`, `provider`);
