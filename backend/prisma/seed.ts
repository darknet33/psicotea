import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

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
          enrollmentDate: new Date('2025-02-01'),
        },
      });

      const tutor = await tx.tutor.upsert({
        where: { carnet: 'DNI 45231876' },
        update: {},
        create: {
          name: 'Lucía',
          lastName: 'Pérez',
          phone: '+51 987 654 321',
          email: 'lucia.perez@example.com',
          carnet: 'DNI 45231876',
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

  console.log(`Seed completado. Usuario admin: ${admin.email} (password: Admin1234)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });