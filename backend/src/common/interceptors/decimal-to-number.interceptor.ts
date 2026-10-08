import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Prisma devuelve `Decimal` de MySQL, y `JSON.stringify` lo serializa como
 * string (`"150.00"`). Los DTOs y el frontend declaran `number`, así que sin
 * esta conversión el dashboard suma strings y los saldos se concatenan.
 *
 * Recorre la respuesta completa porque los montos aparecen también anidados
 * (por ejemplo, los pagos dentro del detalle de una inscripción).
 */
function convertDecimal(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(convertDecimal);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = convertDecimal(item);
    }
    return result;
  }

  return value;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map(convertDecimal));
  }
}
