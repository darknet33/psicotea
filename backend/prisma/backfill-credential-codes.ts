/**
 * Genera un `credentialCode` firmado para cada niño que aún no lo tenga.
 *
 * Es idempotente: los niños cuyo token ya es válido no se tocan, así que se
 * puede ejecutar las veces que haga falta. Reutiliza `CredentialTokenService`
 * para no duplicar el algoritmo de firma.
 *
 *   npx ts-node prisma/backfill-credential-codes.ts
 */
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { CredentialTokenService } from '../src/common/credential/credential-token.service';

async function main() {
  const prisma = new PrismaClient();
  const config = new ConfigService(process.env);
  const tokenService = new CredentialTokenService(config);

  if (!config.get<string>('CREDENTIAL_SECRET')) {
    throw new Error(
      'Falta CREDENTIAL_SECRET en el .env del backend. Generá uno con:\n' +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  try {
    const children = await prisma.child.findMany({
      select: { id: true, name: true, lastName: true, credentialCode: true },
      orderBy: { id: 'asc' },
    });

    let generados = 0;
    let yaValidos = 0;
    let invalidos = 0;

    for (const child of children) {
      if (child.credentialCode && tokenService.verify(child.credentialCode)) {
        yaValidos += 1;
        continue;
      }
      if (child.credentialCode) invalidos += 1;

      const credentialCode = tokenService.generate();
      await prisma.child.update({
        where: { id: child.id },
        data: { credentialCode },
      });
      generados += 1;
      console.log(
        `  ${child.id} ${child.name} ${child.lastName} -> ${credentialCode}`,
      );
    }

    console.log(
      `\nListo. ${generados} generado(s), ${yaValidos} ya válido(s)` +
        (invalidos > 0
          ? `, ${invalidos} con firma inválida regenerado(s).`
          : '.'),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
