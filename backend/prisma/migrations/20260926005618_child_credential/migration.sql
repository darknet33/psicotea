-- AlterTable
-- `carnet` y `credentialCode` se agregan como NULL para poder rellenarlos
-- antes de aplicar el NOT NULL, igual que se hizo con photoUrl/diagnostico.
ALTER TABLE `Child` ADD COLUMN `carnet` VARCHAR(191) NULL,
    ADD COLUMN `credentialCode` VARCHAR(191) NULL;

-- Backfill del carnet: los niños ya registrados no tienen documento de identidad.
-- Se usa un marcador visible y único por fila para no romper el índice único.
-- El personal debe reemplazarlo por el carnet real antes de imprimir credenciales.
UPDATE `Child` SET `carnet` = CONCAT('LEGACY-', `id`) WHERE `carnet` IS NULL OR TRIM(`carnet`) = '';

-- AlterTable
ALTER TABLE `Child` MODIFY COLUMN `carnet` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Child_carnet_key` ON `Child`(`carnet`);

-- CreateIndex
CREATE UNIQUE INDEX `Child_credentialCode_key` ON `Child`(`credentialCode`);
