# UI Design System Specification

## MODIFIED Requirements

### Requirement: Color Palette

El sistema SHALL usar la paleta oficial de la marca (PISCO y TEA mas los complementarios del logo) mapeada a los tokens semanticos del design system, con foregrounds que cumplan WCAG 2.1 AA.

```
Primario (PISCO - navy profundo):
  - Primary:       #2A2960
  - Primary Light: #3D3A80
  - Primary Dark:  #1F1E4A
  - Primary Foreground: #FFFFFF

Secundario (TEA - verde menta):
  - Secondary:       #A0C84F
  - Secondary Light: #B5D86C
  - Secondary Dark:  #7FA03B
  - Secondary Foreground: #2A2960 (texto oscuro por contraste)

Acento (logo):
  - Accent:       #209CDC (azul)
  - Accent Light: #4FB6E6
  - Accent Dark:  #1678A8
  - Accent Foreground: #FFFFFF

Complementarios de marca (tokens brand-*):
  - Brand Pink:    #F7386B
  - Brand Yellow:  #FDCA1F
  - Brand Blue:    #209CDC
  - Brand Green:   #A3CC52
  - Brand Tea:     #A0C84F

Neutros:
  - Background:    #fafafa
  - Surface:       #ffffff
  - Border:        #e5e7eb
  - Text Primary:  #1f2937
  - Text Secondary:#6b7280

Estados (derivados de marca):
  - Success:    #A3CC52 (Foreground: #2A2960)
  - Warning:    #FDCA1F (Foreground: #2A2960)
  - Error:      #F7386B (Foreground: #FFFFFF)
  - Info:       #209CDC (Foreground: #FFFFFF)

Dark mode (surface navy basado en PISCO):
  - Background:  #111827
  - Surface:     #1F1E4A
  - Border:      #374151
```

#### Scenario: Tokens de color
- **WHEN** se implementan colores en la UI
- **THEN** se usan los tokens de la paleta de marca definida (semanticos `--primary`, `--secondary`, `--accent` y de marca `--color-brand-*`)

#### Scenario: Badges con foreground accesible
- **WHEN** un Badge usa las variantes `success` o `warning`
- **THEN** el texto usa `--success-foreground`/`--warning-foreground` (oscuro sobre TEA/amarillo) en lugar de blanco fijo

## ADDED Requirements

### Requirement: Brand Tokens in Tailwind

El sistema SHALL exponer los colores de la marca como tokens de utilidad en Tailwind (`--color-brand-*` dentro de `@theme`), ademas de los tokens semanticos, para permitir usos de diseno explicitos sin depender de hex hardcodeados.

#### Scenario: Clases de marca
- **WHEN** un diseno usa un color complementario del logo
- **THEN** esta disponible una clase como `text-brand-pink`, `bg-brand-yellow`, `border-brand-blue`, etc.