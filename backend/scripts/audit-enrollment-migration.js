/* eslint-disable */
// Auditoría previa a la migración enrollment-payment-periods (tarea 1.2-1.4).
// Uso: node scripts/audit-enrollment-migration.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const result = {};

  result.enrollmentCount = await prisma.enrollment.count();
  result.paymentCount = await prisma.payment.count();

  const durationRows = await prisma.$queryRawUnsafe(
    'SELECT durationDays, COUNT(*) AS c FROM Enrollment GROUP BY durationDays ORDER BY durationDays',
  );
  result.distinctDurations = durationRows.map((r) => ({
    durationDays: r.durationDays,
    count: Number(r.c),
  }));

  const methodRows = await prisma.$queryRawUnsafe(
    'SELECT method, COUNT(*) AS c FROM Payment GROUP BY method',
  );
  result.paymentMethods = methodRows.map((r) => ({
    method: r.method,
    count: Number(r.c),
  }));

  const zeroFeeRows = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS c FROM Enrollment WHERE monthlyFee <= 0',
  );
  result.enrollmentsWithNullOrZeroFee = Number(zeroFeeRows[0].c);

  const recognized = [30, 90, 180, 360];
  result.unrecognizedDurations = await prisma.enrollment.findMany({
    where: {
      OR: [{ durationDays: null }, { durationDays: { notIn: recognized } }],
    },
    select: {
      id: true,
      childId: true,
      startDate: true,
      endDate: true,
      durationDays: true,
      monthlyFee: true,
      status: true,
    },
    orderBy: { id: 'asc' },
  });

  result.paymentsWithEnrollment = await prisma.payment.count({
    where: { enrollmentId: { not: null } },
  });
  result.paymentsWithoutEnrollment = await prisma.payment.count({
    where: { enrollmentId: null },
  });

  result.paymentsWithoutEnrollmentList = await prisma.payment.findMany({
    where: { enrollmentId: null },
    select: {
      id: true,
      childId: true,
      amount: true,
      paymentDate: true,
      periodStart: true,
      periodEnd: true,
    },
    orderBy: { id: 'asc' },
  });

  const feeSum = await prisma.enrollment.aggregate({ _sum: { monthlyFee: true } });
  result.totalMonthlyFee = feeSum._sum.monthlyFee?.toString() ?? '0';

  const outDir = path.join(__dirname, '..', '..', 'openspec', 'changes', 'enrollment-payment-periods');
  const outFile = path.join(outDir, 'migration-audit.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(JSON.stringify({
    enrollmentCount: result.enrollmentCount,
    paymentCount: result.paymentCount,
    distinctDurations: result.distinctDurations,
    paymentMethods: result.paymentMethods,
    enrollmentsWithNullOrZeroFee: result.enrollmentsWithNullOrZeroFee,
    unrecognizedDurationCount: result.unrecognizedDurations.length,
    unrecognizedDurationIds: result.unrecognizedDurations.map((e) => e.id),
    paymentsWithEnrollment: result.paymentsWithEnrollment,
    paymentsWithoutEnrollment: result.paymentsWithoutEnrollment,
    paymentsWithoutEnrollmentIds: result.paymentsWithoutEnrollmentList.map((p) => p.id),
    totalMonthlyFee: result.totalMonthlyFee,
    auditFile: outFile,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
