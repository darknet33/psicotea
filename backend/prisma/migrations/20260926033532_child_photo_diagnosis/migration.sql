/*
  Warnings:

  - You are about to drop the column `enrollmentDate` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `child` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `child` ADD COLUMN `diagnostico` VARCHAR(191) NULL,
    ADD COLUMN `photoUrl` VARCHAR(191) NULL;

-- Backfill: conserva la foto existente y usa un placeholder cuando no hay,
-- antes de aplicar el NOT NULL.
UPDATE `child` SET `photoUrl` = COALESCE(NULLIF(TRIM(`photo`), ''), '/uploads/placeholder.png');

-- Diagnóstico no registrado: texto pendiente de completar por el especialista.
UPDATE `child` SET `diagnostico` = 'Pendiente de evaluación' WHERE `diagnostico` IS NULL;

-- AlterTable
ALTER TABLE `child` DROP COLUMN `enrollmentDate`,
    DROP COLUMN `photo`,
    MODIFY COLUMN `diagnostico` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `photoUrl` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tutor` ADD COLUMN `address` VARCHAR(191) NULL;
