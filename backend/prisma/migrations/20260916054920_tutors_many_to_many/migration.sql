/*
  Warnings:

  - You are about to drop the column `parentCarnet` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `parentEmail` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `parentLastName` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `parentName` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhone` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `parentRelationship` on the `child` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Child` DROP COLUMN `parentCarnet`,
    DROP COLUMN `parentEmail`,
    DROP COLUMN `parentLastName`,
    DROP COLUMN `parentName`,
    DROP COLUMN `parentPhone`,
    DROP COLUMN `parentRelationship`;

-- CreateTable
CREATE TABLE `Tutor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `carnet` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tutor_carnet_key`(`carnet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChildTutor` (
    `childId` INTEGER NOT NULL,
    `tutorId` INTEGER NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChildTutor_childId_idx`(`childId`),
    INDEX `ChildTutor_tutorId_idx`(`tutorId`),
    PRIMARY KEY (`childId`, `tutorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChildTutor` ADD CONSTRAINT `ChildTutor_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildTutor` ADD CONSTRAINT `ChildTutor_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `Tutor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
