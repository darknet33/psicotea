# Photo Upload Specification

## Purpose

Subida de imágenes desde el frontend. Define un endpoint autenticado que recibe el multipart, valida tipo y tamaño, guarda el archivo en disco y devuelve la URL absoluta servida estáticamente por el backend, usada como `photoUrl` de los niños.

## ADDED Requirements

### Requirement: Image Upload Endpoint

El sistema SHALL exponer `POST /uploads/image` protegido por JWT, que recibe un archivo en el campo `file` (multipart/form-data). Debe aceptar imágenes `image/jpeg`, `image/png` y `image/webp`, con un máximo de 5 MB por archivo, y guardar cada archivo con un nombre único en el directorio de uploads.

La respuesta SHALL ser `{ url: "http://<host>:<puerto>/uploads/<nombre>" }`, donde el host/puerto son los del request, de modo que el frontend pueda cargar la imagen directamente.

#### Scenario: Subida exitosa
- **WHEN** un usuario autenticado sube una imagen válida
- **THEN** el sistema devuelve 201 con la URL absoluta de la imagen y el archivo queda disponible en `GET /uploads/<nombre>`

#### Scenario: Sin autenticación
- **WHEN** se llama al endpoint sin token JWT válido
- **THEN** el sistema devuelve 401

#### Scenario: Tipo de archivo no permitido
- **WHEN** se sube un archivo cuyo mimetype no es `image/jpeg`, `image/png` ni `image/webp`
- **THEN** el sistema devuelve 400 con un error de validación y no guarda el archivo

#### Scenario: Archivo demasiado grande
- **WHEN** se sube una imagen mayor a 5 MB
- **THEN** el sistema devuelve 413 (Payload Too Large) y no guarda el archivo

#### Scenario: Acceso a la imagen servida
- **WHEN** el frontend solicita `GET /uploads/<nombre>` de una imagen existente
- **THEN** el backend sirve el archivo con su tipo de contenido correcto