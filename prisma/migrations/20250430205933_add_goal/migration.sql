-- CreateTable
CREATE TABLE `Goal` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('SCHEDULE', 'FINANCE', 'CAREER', 'AUDIO_BOOKS') NOT NULL,
    `deadline` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `reminderDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Goal_userId_idx`(`userId`),
    INDEX `Goal_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
