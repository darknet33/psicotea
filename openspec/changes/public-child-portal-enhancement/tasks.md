## 1. Backend

- [x] 1.1 Ampliar `PublicChildProfileDto` con `diagnostico`, `enrollments`, `attendances`, `activities` e informes con contenido
- [x] 1.2 Ampliar el `select` de `public.service.ts`
- [x] 1.3 Agregar `GET /public/children/credential/:code/summary.pdf`
- [x] 1.4 Reutilizar el generador de PDF de `reports` (`common/pdf/pdf.builder.ts`)
- [x] 1.5 `public.service.spec.ts` actualizado

## 2. Frontend

- [x] 2.1 Ampliar `src/types/public-child.ts`
- [x] 2.2 Ampliar `src/app/(public)/publico/nino/[code]/page.tsx` con secciones
- [x] 2.3 Botón "Descargar resumen PDF"

## 3. Documentación

- [x] 3.1 Actualizar `openspec/project.md` §19/§21 (política de privacidad del portal)
- [x] 3.2 `openspec/specs/public-child-portal/spec.md` sincronizado

## 4. Verificación

- [x] 4.1 `cd backend && npm run lint && npm run build`
- [x] 4.2 `cd fronted && npm run lint && npm run build`
- [x] 4.3 `openspec validate public-child-portal-enhancement --type change --strict`
