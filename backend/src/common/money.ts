import { Prisma } from '@prisma/client';

/**
 * Aritmética monetaria en centavos enteros.
 *
 * `Decimal` de MySQL evita errores al persistir, pero sumar `number` en
 * punto flotante produce residuos (`0.1 + 0.2 = 0.30000000000000004`) que
 * dejan saldos como `-0.0000001`. Estos helpers convierten a centavos,
 * operan con enteros y vuelven a la unidad para persistir.
 */
export function toCents(value: Prisma.Decimal | number | string): number {
  return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
