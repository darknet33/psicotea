import { isAbsolute, resolve } from 'path';
import { mkdirSync } from 'fs';

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function getUploadsDir(): string {
  const configured = process.env.UPLOAD_DIR ?? 'uploads';
  const dir = isAbsolute(configured)
    ? configured
    : resolve(process.cwd(), configured);

  mkdirSync(dir, { recursive: true });

  return dir;
}

export function sanitizeExtension(
  originalname: string,
  mimetype: string,
): string {
  const fromMime = EXTENSION_BY_MIME[mimetype];
  if (fromMime) {
    return fromMime;
  }

  const match = /\.([a-z0-9]{1,5})$/i.exec(originalname ?? '');

  return match ? `.${match[1].toLowerCase()}` : '';
}

export function buildUniqueFilename(
  originalname: string,
  mimetype: string,
): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${sanitizeExtension(
    originalname,
    mimetype,
  )}`;
}

/**
 * Ruta pública del archivo subido, relativa al origen del backend.
 *
 * Se guarda relativa a propósito: si se almacenara absoluta (con el host del
 * request), la foto se rompería al cambiar de red o al abrir la app desde otro
 * dispositivo. El frontend la resuelve contra `NEXT_PUBLIC_API_URL`.
 */
export function buildUploadPath(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Formas admitidas para `Child.photoUrl`: la ruta que devuelve este módulo
 * (`/uploads/<archivo>`) o una URL absoluta, por si el cliente guarda la foto en
 * otro servicio.
 */
export const PHOTO_URL_PATTERN =
  /^(?:\/uploads\/[A-Za-z0-9._-]+|https?:\/\/\S+)$/;

export const PHOTO_URL_MESSAGE =
  'La foto debe ser una ruta /uploads/... o una URL válida';
