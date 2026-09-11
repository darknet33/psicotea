/*
  Warnings:

  - You are about to drop the column `parentId` on the `child` table. All the data in the column will be lost.
  - Added the required column `parentCarnet` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentLastName` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentName` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentPhone` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentRelationship` to the `Child` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `child` DROP FOREIGN KEY `Child_parentId_fkey`;

-- AlterTable
ALTER TABLE `child` DROP COLUMN `parentId`,
    ADD COLUMN `parentCarnet` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentEmail` VARCHAR(191) NULL,
    ADD COLUMN `parentLastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentName` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentPhone` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentRelationship` VARCHAR(191) NOT NULL;
