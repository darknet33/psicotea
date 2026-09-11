# Design: Brand Identity Design

## Context

El frontend (Next.js 16 + Tailwind v4 CSS-first + shadcn/ui) define todos sus colores como tokens CSS en `fronted/src/app/globals.css` (`:root`, `.dark` y `@theme inline`), y los componentes consumen clases semanticas (`bg-primary`, `text-muted-foreground`, `bg-success`, `bg-warning`, etc.). Esto hace que un cambio de identidad de marca sea de bajo costo: se redefine la paleta en un solo archivo y casi todo el rediseno se propaga automaticamente.

Estado actual relevante:
- La spec `ui-design-system` define una paleta generica (indigo/verde menta/morado), sin relacion con la marca real.
- `openspec/project.md` no documenta identidad de marca.
- `badge.tsx` es la unica pieza detectada que hardcodea color de texto fijo (`text-white` en variantes `success`/`warning`), independiente de los tokens.
- La UI actual (login, dashboard, children, enrollments, payments, sidebar) referencia tokens; nada usa hex directo fuera de `globals.css` y `badge.tsx`.

Marca oficial: PISCO `#2A2960`, TEA `#A0C84F`; complementarios del logo `#F7386B`, `#FDCA1F`, `#209CDC`, `#A3CC52`.

## Goals / Non-Goals

**Goals:**
- Registrar la identidad de marca en `openspec/project.md` y en la spec `ui-design-system`.
- Aplicar la paleta oficial a los tokens del frontend con foregrounds que cumplan WCAG 2.1 AA.
- Exponer tokens `brand-*` para usos de diseno explicitos.
- Ajustar las pocas piezas que dependen de color (badge, marca del sidebar, login) sin cambiar estructura ni logica.
- Dejar la base token-first para que un rediseno visual futuro (con skill/herramienta de diseno) consuma los mismos tokens.

**Non-Goals:**
- No se redisenan layout, tipografia ni componentes mas alla de color/fondo token-first.
- No se instalan dependencias nuevas ni se toca el backend.
- No se implanta dark mode activo (solo se actualizan sus variables para coherencia futura).
- No se redibuja el logo (solo se usan sus colores como tokens).

## Decisions

### D1. Mapeo de la paleta de marca a los tokens semanticos
Se asignan los colores de marca sobre la semantica existente para que la UI actual "herede" la identidad sin tocar componentes:
- `--primary` = PISCO `#2A2960` (navy profundo). Contraste con blanco ~13.5:1 (AA). Variantes light/dark derivadas (`#3D3A80` / `#1F1E4A`).
- `--secondary` = TEA `#A0C84F`, con `--secondary-foreground` = `#2A2960`. TEA es un verde claro: texto blanco fallaria (~1.9:1), por eso se fuerza foreground oscuro.
- `--accent` = `#209CDC` (azul del logo), foreground blanco (3.9:1: aceptable para iconos/UI, se evita para texto pequeno).
- `--success` = `#A3CC52` (verde del logo, familia TEA) con foreground oscuro.
- `--warning` = `#FDCA1F` (amarillo del logo) con foreground oscuro.
- `--error` / `--destructive` = `#F7386B` (rosa del logo), foreground blanco; los estados destructivos se complementan con icono/texto (el color no es el unico indicador).
- `--info` = `#209CDC`, foreground blanco.
- Neutros se conservan (son agnosticos de marca) y `--ring` pasa a PISCO.
Alternativa rechazada: mantener la paleta generica y solo documentar la marca. No cumple el objetivo de "aplicar el rediseno" del usuario.

### D2. Tokens `brand-*` ademas de los semanticos
Se agregan en `@theme` `--color-brand-tea`, `--color-brand-pink`, `--color-brand-yellow`, `--color-brand-blue`, `--color-brand-green` (ademas del PISCO como `brand-pisco`) para que el diseno futuro pueda usar clases explicitas (`text-brand-pink`, `bg-brand-yellow`, etc.) sin hex hardcodeados. Los semanticos cubren los usos de sistema; los `brand-*` cubren los usos de marca pura.

### D3. Foregrounds por token en los Badges
`badge.tsx` deja de hardcodear `text-white` en las variantes `success` y `warning` y pasa a `text-success-foreground` / `text-warning-foreground`. Es el unico componente con color fijo; el resto ya usa tokens.
Alternativa: dejar `text-white` y oscurecer los colores de fondo. Se rechaza porque degrada la identidad (amarillo/verde claros son marca) y porque TEA `#A0C84F` oscurecido dejaria de ser la marca.

### D4. Dark mode coherente con la identidad
Las variables `.dark` actualizan surface/card/border hacia tonos navy derivados de PISCO (`#1F1E4A` surface, textos claros) y los mismos foregrounds de marca. No se activa dark mode; solo se deja listo y coherente.

### D5. Detalle de marca en la UI (bajo riesgo)
- `sidebar.tsx`: el mark "Ps" ya usa `bg-primary text-white` (heredara PISCO automaticamente); se agrega hover del logo con TEA para un toque de marca.
- `login/page.tsx`: si existen gradientes/cajas de color, se ajustan a PISCO/TEA (revision puntual, sin cambio de estructura).
- El logo oficial se sirve desde `fronted/public/logo.jpg` (asset ya presente); las vistas de marca pueden referenciarlo via `/logo.jpg` en futuros redisenos (no se sustituye el mark en este change).
- Dashboard y tablas: sin cambios, heredan los tokens.
Alternativa rechazada: rediseno completo de componentes (reordenamiento, nuevos patrones). Fuera de alcance no-goal; se deja documentado para un change futuro de rediseno.

### D6. Documentacion como fuente de verdad
`openspec/project.md` incorpora una seccion "Identidad de marca" que define PISCO/TEA/complementarios, su rol de uso y la nota de contraste; la spec `ui-design-system` se actualiza (paleta de marca + tokens `brand-*` + escenarios). Cualquier skill/herramienta de diseno futura puede leer estos archivos como entrada.

## Risks / Trade-offs

- [Contraste de TEA/amarillo/verde claros con texto claro] → Mitigacion: foregrounds oscuros en `D1`/`D3` garantizan AA; los estados de color siempre se complementan con texto/icono.
- [Cambio abrupto de color de `--secondary` (boton secundario usa fondo TEA)] → Mitigacion: revision manual de botones/badges tras aplicar; al ser token-first, un ajuste puntual es de un solo valor.
- [Efecto visual en dark mode sin activar] → Mitigacion: solo se actualizan variables; no hay feature toggle que rompa.
- [El cambio es mayoritariamente visual; dificil de "probar" con tests] → Mitigacion: validacion con `npm run build` + `npm run lint` (accesibilidad y contraste se verifican en la guia de la spec).

## Migration Plan

- Fase 1 (documentacion): seccion "Identidad de marca" en `project.md` + delta specs (`brand-identity`, `ui-design-system`).
- Fase 2 (tokens): reescribir `:root`/`.dark`/`@theme` en `globals.css`.
- Fase 3 (componentes): `badge.tsx` con foregrounds de token; detalles de marca en `sidebar.tsx` y `login/page.tsx`.
- Verificacion: `npm run build` + `npm run lint` en `fronted/`.
- Rollback: revertir `globals.css` (un archivo) y los 1-2 componentes tocados; sin efecto sobre datos ni API.

## Open Questions

- (ninguna pendiente critica; el mapeo D1-D6 cubre el alcance del change)