## 1. Documentacion de identidad

- [x] 1.1 Agregar seccion "Identidad de marca" en `openspec/project.md` con PISCO `#2A2960`, TEA `#A0C84F` y complementarios `#F7386B`, `#FDCA1F`, `#209CDC`, `#A3CC52` (rol de uso y nota de contraste), e indicar que el logo oficial es `fronted/public/logo.jpg`

## 2. Tokens de marca en el tema

- [x] 2.1 Reescribir `:root` en `fronted/src/app/globals.css` con la paleta PISCO/TEA (+ light/dark derivadas), complementarios y foregrounds accesibles (D1)
- [x] 2.2 Actualizar `.dark` con surface navy basado en PISCO y foregrounds de marca (D4)
- [x] 2.3 Agregar tokens `--color-brand-*` (brand-pisco, brand-tea, brand-pink, brand-yellow, brand-blue, brand-green) en `@theme` (D2)

## 3. Ajustes de componentes

- [x] 3.1 `fronted/src/components/ui/badge.tsx`: variantes `success`/`warning` usan `text-success-foreground`/`text-warning-foreground` en lugar de `text-white` (D3)
- [x] 3.2 Detalle de marca en `fronted/src/components/layout/sidebar.tsx` y `fronted/src/app/(auth)/login/page.tsx` (D5): marca con ring TEA en el sidebar y logo oficial `/logo.jpg` en el login, sin cambiar estructura

## 4. Verificacion y cierre

- [x] 4.1 `npm run build` + `npm run lint` en `fronted/`
- [x] 4.2 `openspec validate brand-identity-design`