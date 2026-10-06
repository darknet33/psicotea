import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Role } from '@prisma/client';
import { CredentialTokenService } from '../src/common/credential/credential-token.service';

const prisma = new PrismaClient();
const credentialToken = new CredentialTokenService(
  new ConfigService(process.env),
);

async function main() {
  const password = await bcrypt.hash('Admin1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@psicotea.com' },
    update: {},
    create: {
      email: 'admin@psicotea.com',
      password,
      name: 'Administrador',
      lastName: 'PsicoTea',
      role: Role.ADMIN,
    },
  });

  const childrenCount = await prisma.child.count();
  if (childrenCount === 0) {
    await prisma.$transaction(async (tx) => {
      const child = await tx.child.create({
        data: {
          name: 'Martina',
          lastName: 'Gómez',
          dateOfBirth: new Date('2019-04-12'),
          sex: 'Mujer',
          photoUrl:
            'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=640&q=80',
          diagnostico:
            'Trastorno por déficit de atención e hiperactividad (TDAH)',
          carnet: 'CI 10293847',
          credentialCode: credentialToken.generate(),
        },
      });

      const tutor = await tx.tutor.upsert({
        where: { carnet: 'CI 45231876' },
        update: {},
        create: {
          name: 'Lucía',
          lastName: 'Pérez',
          phone: '+51 987 654 321',
          email: 'lucia.perez@example.com',
          address: 'Av. Los Álamos 1234, Lince, Lima',
          carnet: 'CI 45231876',
        },
      });

      await tx.childTutor.create({
        data: {
          childId: child.id,
          tutorId: tutor.id,
          relationship: 'Madre',
          isPrimary: true,
        },
      });
    });
    console.log('Seed completado. Niño de ejemplo creado.');
  }

  const areasIniciales = [
    'Lenguaje',
    'Terapia ocupacional',
    'Conducta',
    'Aprendizaje',
    'Socialización',
  ];

  for (const name of areasIniciales) {
    await prisma.area.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(
    `Seed completado. Usuario admin: ${admin.email} (password: Admin1234)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
