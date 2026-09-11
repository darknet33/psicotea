## Why

El proyecto arranco con una paleta de colores generica (indigo/verde menta/morado) que no representa la identidad real del centro. La marca oficial (PISCO `#2A2960` y TEA `#A0C84F`, con los complementarios del logo) no esta registrada en ningun lado: ni en `openspec/project.md` ni en la especificacion del design system. Sin ese registro, los colores de marca no quedan documentados para que herramientas o skills de diseno futuras puedan considerarlos en un rediseno, y la UI actual no refleja la identidad visual del centro. Esto se resuelve ahora, en inicios del proyecto, cuando el cambio es de bajo costo porque todos los colores viven en tokens CSS.

## What Changes

- **Identidad de marca registrada** en `openspec/project.md` (nueva seccion) y en la spec `ui-design-system`: PISCO `#2A2960`, TEA `#A0C84F` y complementarios del logo `#F7386B`, `#FDCA1F`, `#209CDC`, `#A3CC52`, con su rol de uso y notas de contraste.
- **Paleta aplicada a la UI actual** via tokens en `fronted/src/app/globals.css`: los tokens semanticos (`--primary`, `--secondary`, `--accent`, `--success`, `--warning`, `--error`, `--info`) pasan a los colores de marca, con los `*-foreground` corregidos para mantener WCAG 2.1 AA (p. ej. texto oscuro sobre TEA y amarillo).
- **Nuevos tokens de marca** (`--color-brand-tea`, `--color-brand-pink`, `--color-brand-yellow`, `--color-brand-blue`, `--color-brand-green`) disponibles como clases Tailwind para uso futuro de diseno.
- **Rediseno de bajo riesgo** de componentes que dependen de color: `badge.tsx` deja de hardcodear `text-white` en las variantes `success`/`warning` y usa los foregrounds de token; marca del sidebar y login adoptan la paleta de marca (navy PISCO + TEA).
- **Dark mode** reajustado con variantes oscuras coherentes con la identidad (surface navy).

## Capabilities

### New Capabilities

- `brand-identity`: definicion de la identidad visual de marca (colores oficiales PISCO/TEA y complementarios del logo) y su registro como tokens en el design system, con guia de uso y contraste.

### Modified Capabilities

- `ui-design-system`: la paleta de color deja de ser generica (indigo/verde menta/morado) y pasa a la paleta oficial de la marca, incluyendo foregrounds accesibles y tokens `brand-*`.

## Impact

- `openspec/project.md`: nueva seccion "Identidad de marca".
- `openspec/specs/ui-design-system/spec.md`: actualizacion de la paleta de color (se sincroniza desde la delta spec al archivar).
- `fronted/src/app/globals.css`: tokens CSS `:root`, `.dark` y `@theme` reescritos a la paleta de marca.
- `fronted/src/components/ui/badge.tsx`: variantes `success` y `warning` usan tokens de foreground (dejan `text-white` hardcodeado).
- `fronted/src/components/layout/sidebar.tsx` y `fronted/src/app/login/page.tsx`: detalles visuales (marca, gradientes, hover) con colores de marca. No cambia estructura ni logica.
- `fronted/public/logo.jpg`: logo oficial del centro ya presente en `public/`; queda registrado como asset de marca (servido via `/logo.jpg`).
- Sin cambios en el backend, sin nuevas dependencias externas. Todo el rediseno es token-first, por lo que se revierte/reajusta solo tocando CSS.