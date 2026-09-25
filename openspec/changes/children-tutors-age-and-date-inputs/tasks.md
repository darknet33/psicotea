## 1. Modelo de datos

- [x] 1.1 Agregar modelo `Tutor` (name, lastName, phone, email?, carnet, timestamps, `@@unique([carnet])`) en `backend/prisma/schema.prisma`
- [x] 1.2 Agregar modelo `ChildTutor` (childId, tutorId, relationship, isPrimary, `@@unique([childId, tutorId])`, cascade) en `schema.prisma`
- [x] 1.3 Eliminar campos `parent*` de `Child` y añadir `tutors ChildTutor[]`
- [x] 1.4 Ejecutar `npx prisma migrate dev --name tutors_many_to_many` y `npx prisma generate`

## 2. Backend — children y tutores

- [x] 2.1 Crear `ChildTutorDto` y reemplazar campos `parent*` por `tutors[]` en `create-child.dto.ts` y `update-child.dto.ts` (≥1 tutor, `sex` con `IsIn(['Varón','Mujer'])`, email opcional)
- [x] 2.2 Actualizar `children.service.ts` `create`: upsert de tutores por `carnet`, validación de exactamente 1 principal, crear vínculos `ChildTutor`
- [x] 2.3 Actualizar `children.service.ts` `update`: reemplazo total de vínculos (deleteMany + recrear) en transacción, y especialista
- [x] 2.4 Actualizar `children.service.ts` `findAll`/`findOne` para incluir `tutors` (con `tutor` y `relationship`/`isPrimary` ordenando principal primero)
- [x] 2.5 Actualizar `seed.ts` a sexo `Mujer` y datos del niño con tutor vía relación N:N
- [x] 2.6 Verificar `npm run build` del backend

## 3. Frontend — sexo, edad y tipos

- [x] 3.1 Actualizar `types/child.ts`: `SEX_OPTIONS = ["Varón", "Mujer"]`, tipo `ChildTutor`, y reemplazar `parent*` por `tutors[]` en `Child` y `ChildInput`
- [x] 3.2 Agregar `formatAge(iso)` en `lib/format.ts` (años y meses; meses solos <1 año) con `TIME_ZONE`
- [x] 3.3 Crear componente `components/forms/date-selects.tsx` (Día/Mes/Año, días por mes/bisiesto, emite `YYYY-MM-DD`)

## 4. Frontend — formularios y páginas

- [x] 4.1 Actualizar `child-form.tsx`: sexo Varón/Mujer, fechas con `date-selects`, sección "Tutores" con filas dinámicas (`useFieldArray`) y radio de tutor principal; labels "Celular/WhatsApp"
- [x] 4.2 Actualizar `enrollment-form.tsx`: `startDate` con `date-selects`
- [x] 4.3 Actualizar `payment-form.tsx`: `paymentDate` con `date-selects`
- [x] 4.4 Actualizar `children/page.tsx`: columna "Edad" y columna "Tutor" con el tutor principal y su Celular/WhatsApp
- [x] 4.5 Actualizar `children/[id]/page.tsx`: mostrar edad, sección "Tutores" con todos (principal con badge "Principal", Celular/WhatsApp)
- [x] 4.6 Actualizar `children/[id]/edit/page.tsx`: mapear `child.tutors` al `ChildInput`
- [x] 4.7 Verificar lint/build del frontend (`npm run lint` y build de Next)

## 5. Verificación

- [ ] 5.1 Probar alta de niño con 2 tutores (1 principal); listado muestra edad y principal; expediente muestra todos
- [ ] 5.2 Probar edición y reutilización de un tutor ya existente (mismo carnet) en otro niño; sexo solo Varón/Mujer con 400 para valores antiguos
- [ ] 5.3 Probar validaciones: 0 o >1 tutor principal → 400; fechas inválidas según mes/año