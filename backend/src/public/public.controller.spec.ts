import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicController } from './public.controller';

const GUARDS_METADATA = '__guards__';

/**
 * El controlador público es la única superficie sin autenticación del sistema.
 * Estos tests fijan esa propiedad: si alguien agrega `JwtAuthGuard` por error,
 * la página pública de los padres dejaría de funcionar (o, peor, quedaría
 * protegida cuando tiene que ser pública).
 */
describe('PublicController - configuración de seguridad', () => {
  it('no aplica JwtAuthGuard: el endpoint es público', () => {
    const guards: unknown[] =
      Reflect.getMetadata(GUARDS_METADATA, PublicController) ?? [];

    const guardNames = guards.map(
      (guard) => (guard as { name?: string }).name ?? String(guard),
    );

    expect(guardNames).not.toContain('JwtAuthGuard');
    expect(guardNames).not.toContain('RolesGuard');
  });

  it('aplica ThrottlerGuard para limitar los intentos por fuerza bruta', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PublicController) ?? [];

    expect(guards).toContain(ThrottlerGuard);
  });

  it('declara un límite más estricto que el default global', () => {
    // `@Throttle({ default: {...} })` guarda cada valor en su propia clave de
    // metadata, con el nombre del throttler ("default") como sufijo.
    const limit = Reflect.getMetadata(
      'THROTTLER:LIMITdefault',
      PublicController.prototype.getChildByCredential,
    );
    const ttl = Reflect.getMetadata(
      'THROTTLER:TTLdefault',
      PublicController.prototype.getChildByCredential,
    );

    expect(limit).toBe(30);
    expect(ttl).toBe(5 * 60 * 1000);
  });
});
