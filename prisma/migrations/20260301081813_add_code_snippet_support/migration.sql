-- AlterTable
ALTER TABLE `Material` ADD COLUMN `sourceType` VARCHAR(191) NOT NULL DEFAULT 'git';

-- CreateTable
CREATE TABLE `CodeSnippet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `code` LONGTEXT NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'typescript',
    `dependencies` TEXT NULL,
    `screenshot` TEXT NULL,
    `tags` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CodeSnippet_materialId_idx`(`materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CodeSnippet` ADD CONSTRAINT `CodeSnippet_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
