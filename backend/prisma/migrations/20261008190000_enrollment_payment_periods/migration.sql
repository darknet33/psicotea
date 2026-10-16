-- Migración enrollment-payment-periods
-- Objetivo: monto por período (amount), tipo de inscripción derivado (type)
-- y aplicación de pagos a inscripciones (PaymentAllocation).
-- IMPORTANTE: el rename se hace con CHANGE COLUMN para preservar el dato
-- histórico de `monthlyFee`. No se elimina ninguna columna en esta migración.

-- 1. Rename monthlyFee -> amount preservando el valor histórico.
ALTER TABLE `Enrollment` CHANGE COLUMN `monthlyFee` `amount` DECIMAL(10, 2) NOT NULL;

-- 2. Tipo de inscripción: nullable hasta la revisión de los registros ambiguos.
ALTER TABLE `Enrollment` ADD COLUMN `type` ENUM('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NULL;

-- 3. Backfill de `type` a partir de la duración histórica.
--    Las duraciones no reconocidas (fuera de 30/90/180/360) quedan en NULL
--    y deben revisarse a mano; no se adivinan.
UPDATE `Enrollment` SET `type` = 'MENSUAL' WHERE `type` IS NULL AND `durationDays` = 30;
UPDATE `Enrollment` SET `type` = 'TRIMESTRAL' WHERE `type` IS NULL AND `durationDays` = 90;
UPDATE `Enrollment` SET `type` = 'SEMESTRAL' WHERE `type` IS NULL AND `durationDays` = 180;
UPDATE `Enrollment` SET `type` = 'ANUAL' WHERE `type` IS NULL AND `durationDays` = 360;

-- 4. Tabla de aplicación de pagos (fuente de verdad del saldo por inscripción).
CREATE TABLE `PaymentAllocation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `enrollmentId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentAllocation_paymentId_enrollmentId_key`(`paymentId`, `enrollmentId`),
    INDEX `PaymentAllocation_enrollmentId_idx`(`enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentAllocation` ADD CONSTRAINT `PaymentAllocation_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAllocation` ADD CONSTRAINT `PaymentAllocation_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Backfill de allocations: cada pago históricamente asociado a una
--    inscripción pasa a tener una allocation por el monto completo.
--    Los pagos sin `enrollmentId` quedan sin allocation y se reportan
--    aparte para revisión (no se les asigna un destino adivinado).
INSERT INTO `PaymentAllocation` (`paymentId`, `enrollmentId`, `amount`, `createdAt`)
SELECT `id`, `enrollmentId`, `amount`, NOW(3)
FROM `Payment`
WHERE `enrollmentId` IS NOT NULL;
