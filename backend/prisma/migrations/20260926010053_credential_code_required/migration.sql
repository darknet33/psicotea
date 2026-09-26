-- AlterTable
-- Todos los niños ya tienen `credentialCode`: lo genera
-- `prisma/backfill-credential-codes.ts` con firma HMAC. Ejecutar ese script
-- antes de aplicar esta migración.
ALTER TABLE `Child` MODIFY COLUMN `credentialCode` VARCHAR(191) NOT NULL;
