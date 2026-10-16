-- AlterTable
ALTER TABLE `area` ADD COLUMN `kind` ENUM('PRINCIPAL', 'SECUNDARIA') NOT NULL DEFAULT 'SECUNDARIA',
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `report` ADD COLUMN `reportPeriod` ENUM('INICIO', 'MEDIADOS', 'FIN', 'NINGUNO') NOT NULL DEFAULT 'NINGUNO',
    ADD COLUMN `summary` TEXT NULL,
    ADD COLUMN `type` ENUM('EVALUACION', 'EVOLUTIVO', 'PERIODICO') NOT NULL DEFAULT 'EVOLUTIVO',
    ADD COLUMN `visibilityToParents` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `specialist` ADD COLUMN `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `monthlySalary` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `SpecialistSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `specialistId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `shift` ENUM('MANANA', 'TARDE', 'AMBOS') NULL,
    `startTime` VARCHAR(5) NULL,
    `endTime` VARCHAR(5) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SpecialistSchedule_dayOfWeek_idx`(`dayOfWeek`),
    UNIQUE INDEX `SpecialistSchedule_specialistId_dayOfWeek_key`(`specialistId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialistArea` (
    `specialistId` INTEGER NOT NULL,
    `areaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SpecialistArea_areaId_idx`(`areaId`),
    PRIMARY KEY (`specialistId`, `areaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialistPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `specialistId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `periodStart` DATE NOT NULL,
    `periodEnd` DATE NOT NULL,
    `paymentDate` DATE NOT NULL,
    `method` ENUM('EFECTIVO', 'QR', 'TRANSFERENCIA') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SpecialistPayment_specialistId_idx`(`specialistId`),
    INDEX `SpecialistPayment_paymentDate_idx`(`paymentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreatmentPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `childId` INTEGER NOT NULL,
    `specialistId` INTEGER NOT NULL,
    `areaId` INTEGER NULL,
    `frequency` ENUM('DAILY', 'WEEKLY') NOT NULL DEFAULT 'WEEKLY',
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `notes` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TreatmentPlan_childId_idx`(`childId`),
    INDEX `TreatmentPlan_specialistId_idx`(`specialistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreatmentPlanItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dayOfWeek` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TreatmentPlanItem_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvolutionNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `childId` INTEGER NOT NULL,
    `specialistId` INTEGER NOT NULL,
    `planId` INTEGER NULL,
    `planItemId` INTEGER NULL,
    `date` DATE NOT NULL,
    `content` TEXT NOT NULL,
    `observation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EvolutionNote_childId_idx`(`childId`),
    INDEX `EvolutionNote_specialistId_idx`(`specialistId`),
    INDEX `EvolutionNote_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReportAttachment_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpecialistSchedule` ADD CONSTRAINT `SpecialistSchedule_specialistId_fkey` FOREIGN KEY (`specialistId`) REFERENCES `Specialist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistArea` ADD CONSTRAINT `SpecialistArea_specialistId_fkey` FOREIGN KEY (`specialistId`) REFERENCES `Specialist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistArea` ADD CONSTRAINT `SpecialistArea_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistPayment` ADD CONSTRAINT `SpecialistPayment_specialistId_fkey` FOREIGN KEY (`specialistId`) REFERENCES `Specialist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialistPayment` ADD CONSTRAINT `SpecialistPayment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentPlan` ADD CONSTRAINT `TreatmentPlan_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentPlan` ADD CONSTRAINT `TreatmentPlan_specialistId_fkey` FOREIGN KEY (`specialistId`) REFERENCES `Specialist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentPlan` ADD CONSTRAINT `TreatmentPlan_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentPlanItem` ADD CONSTRAINT `TreatmentPlanItem_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `TreatmentPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvolutionNote` ADD CONSTRAINT `EvolutionNote_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvolutionNote` ADD CONSTRAINT `EvolutionNote_specialistId_fkey` FOREIGN KEY (`specialistId`) REFERENCES `Specialist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvolutionNote` ADD CONSTRAINT `EvolutionNote_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `TreatmentPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvolutionNote` ADD CONSTRAINT `EvolutionNote_planItemId_fkey` FOREIGN KEY (`planItemId`) REFERENCES `TreatmentPlanItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttachment` ADD CONSTRAINT `ReportAttachment_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

