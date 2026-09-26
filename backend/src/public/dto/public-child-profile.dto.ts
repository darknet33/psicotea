/**
 * Datos del tutor principal que un padre puede ver en la página pública.
 * Deliberadamente no incluye `email` ni `carnet` del tutor.
 */
export interface PublicPrimaryTutorDto {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

/**
 * Informe publicado del niño. Solo título y periodo: el `content` es un dato
 * clínico y no se expone públicamente.
 */
export interface PublicReportDto {
  title: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Respuesta de `GET /public/children/credential/:code`.
 *
 * Esta interfaz es la lista blanca de lo público. El servicio construye el
 * objeto con un `select` de Prisma que trae únicamente estos campos, así que
 * un campo nuevo que se agregue a `Child` no aparece aquí por accidente.
 */
export interface PublicChildProfileDto {
  name: string;
  lastName: string;
  /**
   * Carnet del niño. Se incluye porque quien abre esta página acaba de
   * escanear la credencial que ya lo lleva impreso, así que no agrega
   * exposición. Facilita que el padre confirme que la credencial es del niño
   * correcto antes de entregar datos de contacto.
   */
  carnet: string;
  /** Edad en años, calculada en el backend a partir de dateOfBirth. */
  age: number;
  photoUrl: string;
  primaryTutor: PublicPrimaryTutorDto | null;
  reports: PublicReportDto[];
}
