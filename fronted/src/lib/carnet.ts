/**
 * Los carnets generados por la migración tienen el prefijo `LEGACY-`. La UI los
 * marca para que el personal los reemplace por el documento real antes de
 * imprimir credenciales definitivas.
 */
const LEGACY_PREFIX = "LEGACY-";

export function isLegacyCarnet(carnet: string | null | undefined): boolean {
  return Boolean(carnet?.trim().toUpperCase().startsWith(LEGACY_PREFIX));
}
