# Brand Identity Specification

## ADDED Requirements

### Requirement: Brand Identity Palette

The system SHALL register the official brand colors of the center as the source of truth for visual identity. The brand palette consists of the PISCO and TEA brand colors plus the complementary colors of the logo:

```
PISCO (brand primary):
  - Pisco:       #2A2960 (navy profundo)

TEA (brand accent):
  - Tea:         #A0C84F (verde menta)

Complementarios del logo:
  - Pink Brand:  #F7386B
  - Yellow Brand:#FDCA1F
  - Blue Brand:  #209CDC
  - Green Brand: #A3CC52
```

Every color used in the platform UI SHALL be derived from the brand palette, documented in `openspec/project.md` under the "Identidad de marca" section, and exposed as Tailwind tokens (`--color-brand-*`) in `fronted/src/app/globals.css`.

#### Scenario: Colores de marca registrados
- **WHEN** se revisa la documentacion del proyecto (`openspec/project.md`)
- **THEN** existen PISCO `#2A2960`, TEA `#A0C84F` y los complementarios `#F7386B`, `#FDCA1F`, `#209CDC`, `#A3CC52` con su rol de uso

#### Scenario: Tokens de marca disponibles
- **WHEN** se usa un color de marca en la UI
- **THEN** se referencia un token CSS de `globals.css` (p. ej. `text-brand-tea`, `bg-brand-pink`) en lugar de un hex hardcodeado

### Requirement: Brand Logo Asset

The system SHALL use the official logo of the center, available as `fronted/public/logo.jpg`, for brand-facing views (login, sidebar, landing page). The logo SHALL be served from the frontend `public/` folder (e.g. `/logo.jpg`) and the hex colors of the logo SHALL match the brand palette.

#### Scenario: Logo servido desde public
- **WHEN** una vista de marca renderiza el logo
- **THEN** se usa el asset `fronted/public/logo.jpg` servido por Next desde `/logo.jpg`

#### Scenario: Colores del logo alineados
- **WHEN** se extraen colores del logo `logo.jpg`
- **THEN** coinciden con la paleta de marca (PISCO `#2A2960`, TEA `#A0C84F` y complementarios del logo)

### Requirement: Brand Color Accessibility

The brand palette SHALL comply with WCAG 2.1 AA contrast for text and UI elements. Colors with high luminance (TEA `#A0C84F`, amarillo `#FDCA1F`, verde `#A3CC52`) SHALL use a dark foreground, and PISCO `#2A2960` SHALL use a light foreground. Color SHALL NOT be the only indicator of meaning (badges SHALL be complemented by text or icons).

#### Scenario: Foregrounds accesibles sobre colores claros
- **WHEN** un componente usa TEA, amarillo o verde de marca como fondo
- **THEN** el texto/foreground es oscuro (p. ej. navy `#2A2960`) para cumplir contraste 4.5:1

#### Scenario: Color no es el unico indicador
- **WHEN** un estado (activo/inactivo/retirado/pendiente) se comunica con color
- **THEN** ademas se muestra texto, icono u otro indicador no visual para usuarios que no distingan colores