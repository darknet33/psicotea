-- Backfill de métodos antes de reducir el enum:
-- TARJETA y CHEQUE dejan de existir, se reetiquetan a los vigentes.
UPDATE `Payment` SET `method` = 'TRANSFERENCIA' WHERE `method` = 'TARJETA';
UPDATE `Payment` SET `method` = 'EFECTIVO' WHERE `method` = 'CHEQUE';

-- AlterTable
ALTER TABLE `Enrollment` ADD COLUMN `durationDays` INTEGER NULL;

-- AlterTable
ALTER TABLE `Payment` MODIFY `method` ENUM('EFECTIVO', 'QR', 'TRANSFERENCIA') NOT NULL;

-- CreateTable
CREATE TABLE `EnrollmentScheduleDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enrollmentId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `shift` ENUM('TODO_DIA', 'MANANA', 'TARDE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnrollmentScheduleDay_dayOfWeek_idx`(`dayOfWeek`),
    UNIQUE INDEX `EnrollmentScheduleDay_enrollmentId_dayOfWeek_key`(`enrollmentId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EnrollmentScheduleDay` ADD CONSTRAINT `EnrollmentScheduleDay_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

