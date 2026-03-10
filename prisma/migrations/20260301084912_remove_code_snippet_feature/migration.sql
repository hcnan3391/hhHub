/*
  Warnings:

  - You are about to drop the column `sourceType` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the `CodeSnippet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CodeSnippet` DROP FOREIGN KEY `CodeSnippet_materialId_fkey`;

-- AlterTable
ALTER TABLE `Material` DROP COLUMN `sourceType`;

-- DropTable
DROP TABLE `CodeSnippet`;
