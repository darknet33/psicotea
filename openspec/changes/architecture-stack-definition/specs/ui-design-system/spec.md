# UI Design System Specification

## Overview

Sistema de diseño UI/UX para la plataforma Sistema_PsicoTea, enfocado en crear una interfaz amigable, accesible y consistente para padres y profesionales que trabajan con niños.

## Requirements

### REQ-UI-001: Design Principles

1. **Amigable**: Interfaz cálida y acogedora, apropiada para contexto de niños
2. **Accesible**: WCAG 2.1 AA, contraste adecuado, navegación por teclado
3. **Responsive**: Mobile-first, funciona en desktop, tablet y móvil
4. **Consistente**: Patrones coherentes en todos los módulos
5. **Simple**: Tareas frecuentes con mínimo número de pasos

### REQ-UI-002: Color Palette

```
Primario:
  - Primary:       #6366f1 (Indigo suave)
  - Primary Light: #818cf8
  - Primary Dark:  #4f46e5

Secundario:
  - Secondary:       #10b981 (Verde menta)
  - Secondary Light: #34d399
  - Secondary Dark:  #059669

Acento:
  - Accent:       #8b5cf6 (Morado suave)
  - Accent Light: #a78bfa
  - Accent Dark:  #7c3aed

Neutros:
  - Background:    #fafafa
  - Surface:       #ffffff
  - Border:        #e5e7eb
  - Text Primary:  #1f2937
  - Text Secondary:#6b7280

Estados:
  - Success:    #22c55e
  - Warning:    #f59e0b
  - Error:      #ef4444
  - Info:       #3b82f6
```

### REQ-UI-003: Typography

```
Font Family: Inter (principal), system-ui (fallback)

Scale:
  - text-xs:    12px (0.75rem)
  - text-sm:    14px (0.875rem)
  - text-base:  16px (1rem) - Base
  - text-lg:    18px (1.125rem)
  - text-xl:    20px (1.25rem)
  - text-2xl:   24px (1.5rem)
  - text-3xl:   30px (1.875rem)
  - text-4xl:   36px (2.25rem)

Weights:
  - Regular:  400
  - Medium:   500
  - Semibold: 600
  - Bold:     700
```

### REQ-UI-004: Component Library (shadcn/ui)

Componentes base a instalar:

**Form Elements**:
- Button (variantes: default, destructive, outline, secondary, ghost, link)
- Input
- Select
- Checkbox
- Radio Group
- Textarea
- Switch
- Label

**Layout**:
- Card
- Separator
- Sheet (sidebar mobile)
- Tabs
- Dialog
- Alert Dialog

**Data Display**:
- Table
- Badge
- Avatar
- Tooltip
- Popover
- Calendar

**Feedback**:
- Alert
- Toast (Sonner)
- Progress
- Skeleton

**Navigation**:
- Dropdown Menu
- Breadcrumb
- Pagination
- Command (search)

### REQ-UI-005: Layout Structure

**Dashboard Layout**:
```
┌─────────────────────────────────────────────┐
│  Header (h-16)                              │
│  [Logo] [Search] [Notifications] [Avatar]   │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │       Main Content               │
│ (w-64)   │       (p-6)                      │
│          │                                  │
│ Logo     │  ┌────────────────────────────┐  │
│          │  │ Page Header                │  │
│ Nav      │  │ Title + Actions            │  │
│ Items    │  └────────────────────────────┘  │
│          │                                  │
│          │  ┌────────────────────────────┐  │
│          │  │ Content Area               │  │
│          │  │ Cards / Tables / Forms     │  │
│          │  │                            │  │
│          │  └────────────────────────────┘  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Responsive Breakpoints**:
- Mobile: < 768px (sidebar collapses to sheet)
- Tablet: 768px - 1024px (sidebar collapsed)
- Desktop: > 1024px (sidebar expanded)

### REQ-UI-006: Navigation Structure

**Sidebar Items** (según rol):
```
Dashboard
─────────
Niños
Inscripciones
Pagos
─────────
Asistencias
Actividades
Informes
─────────
Especialistas
Personal
─────────
Gastos
Categorías
─────────
Configuración
```

### REQ-UI-007: Form Patterns

**Standard Form Layout**:
```
┌─────────────────────────────────────┐
│ Form Title                          │
├─────────────────────────────────────┤
│ Field Group                         │
│ ┌─────────┐ ┌─────────┐            │
│ │ Label   │ │ Label   │            │
│ │ Input   │ │ Input   │            │
│ │ Error   │ │ Error   │            │
│ └─────────┘ └─────────┘            │
│                                     │
│ Field Group                         │
│ ┌─────────────────────────────────┐ │
│ │ Label                           │ │
│ │ Input / Select / Textarea       │ │
│ │ Error                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌──────────┐ ┌──────────┐          │
│ │ Cancel   │ │ Submit   │          │
│ └──────────┘ └──────────┘          │
└─────────────────────────────────────┘
```

**Validation**:
- Errors shown below field on blur/submit
- Red border on invalid fields
- Toast notification on success

### REQ-UI-008: Table Patterns

**Standard Table**:
```
┌─────────────────────────────────────────────────┐
│ [Search Input] [Filters] [Export] [Add Button]  │
├─────────────────────────────────────────────────┤
│ Column Headers (sortable)                       │
├─────────────────────────────────────────────────┤
│ Row 1                                           │
│ Row 2                                           │
│ Row 3                                           │
│ ...                                             │
├─────────────────────────────────────────────────┤
│ Pagination: < 1 2 3 ... 10 >                   │
└─────────────────────────────────────────────────┘
```

**Features**:
- Sorting by columns
- Search/filter
- Pagination (10, 25, 50, 100)
- Row actions (edit, delete, view)
- Bulk actions (when applicable)

### REQ-UI-009: Card Patterns

**Stat Card**:
```
┌──────────────────────┐
│ Icon    │ Value      │
│ Label   │ Trend      │
└──────────────────────┘
```

**Content Card**:
```
┌──────────────────────┐
│ Title               │
├──────────────────────┤
│ Content             │
│                     │
├──────────────────────┤
│ Actions             │
└──────────────────────┘
```

### REQ-UI-010: Accessibility

- **Contraste**: Mínimo 4.5:1 para texto, 3:1 para UI components
- **Focus Visible**: Ring visible en todos los elementos interactivos
- **Alt Text**: Todas las imágenes con descripción
- **Keyboard Navigation**: Tab order lógico, Escape para cerrar modales
- **Screen Readers**: Labels en todos los inputs, ARIA labels donde sea necesario
- **Color**: No usar color como único indicador de información

### REQ-UI-011: Animations

- **Transitions**: 200ms ease-in-out para hover/focus states
- **Page Transitions**: Fade in/out suave
- **Modals**: Scale from 95% + fade
- **Toasts**: Slide in from top-right
- **Loading**: Skeleton screens para carga de datos

### REQ-UI-012: Dark Mode (Future)

- Preparar sistema para soporte futuro de dark mode
- Usar CSS variables para colores
- Tailwind dark: prefix

## Component Examples

### Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Status Badges

```tsx
<Badge variant="default">Activo</Badge>
<Badge variant="secondary">Inactivo</Badge>
<Badge variant="destructive">Retirado</Badge>
<Badge variant="outline">Pendiente</Badge>
```

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```
