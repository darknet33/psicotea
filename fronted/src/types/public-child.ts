/**
 * Tipos de la página pública de consulta para padres.
 *
 * Reflejan exactamente `PublicChildProfileDto` del backend
 * (`backend/src/public/dto/public-child-profile.dto.ts`). Es una lista blanca:
 * el diagnóstico y el contenido de los informes nunca llegan al cliente, así
 * que no tienen campo aquí que los exponga por accidente.
 */

/** Tutor principal que el padre puede contactar. Sin `carnet` ni `email`. */
export interface PublicPrimaryTutor {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

/** Informe publicado: solo título y periodo, nunca el contenido clínico. */
export interface PublicReport {
  title: string;
  /** Fechas en ISO `YYYY-MM-DD`. */
  periodStart: string;
  periodEnd: string;
}

export interface PublicChildProfile {
  name: string;
  lastName: string;
  /** Carnet del niño; viene impreso en la credencial escaneada. */
  carnet: string;
  /** Edad en años, calculada en el backend. */
  age: number;
  photoUrl: string;
  /** `null` cuando el niño no tiene tutor marcado como principal. */
  primaryTutor: PublicPrimaryTutor | null;
  reports: PublicReport[];
}
