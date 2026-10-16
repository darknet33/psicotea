/* eslint-disable */
// Verificación posterior a la migración enrollment-payment-periods.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const enrollments = await prisma.enrollment.count();
  const types = await prisma.$queryRawUnsafe(
    'SELECT type, COUNT(*) AS c FROM Enrollment GROUP BY type',
  );
  const nullTypes = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS c FROM Enrollment WHERE type IS NULL',
  );
  const allocations = await prisma.paymentAllocation.count();
  const sumEnrollment = await prisma.$queryRawUnsafe(
    'SELECT COALESCE(SUM(amount), 0) AS s FROM Enrollment',
  );
  const sumPayment = await prisma.$queryRawUnsafe(
    'SELECT COALESCE(SUM(amount), 0) AS s FROM Payment WHERE enrollmentId IS NOT NULL',
  );
  const sumAllocations = await prisma.$queryRawUnsafe(
    'SELECT COALESCE(SUM(amount), 0) AS s FROM PaymentAllocation',
  );
  const paymentsWithoutEnrollment = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS c FROM Payment WHERE enrollmentId IS NULL',
  );

  console.log(
    JSON.stringify(
      {
        enrollments,
        types: types.map((r) => ({ type: r.type, count: Number(r.c) })),
        nullTypes: Number(nullTypes[0].c),
        allocations,
        sumAmountEnrollment: String(sumEnrollment[0].s),
        sumPaymentWithEnrollment: String(sumPayment[0].s),
        sumAllocations: String(sumAllocations[0].s),
        paymentsWithoutEnrollment: Number(paymentsWithoutEnrollment[0].c),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
