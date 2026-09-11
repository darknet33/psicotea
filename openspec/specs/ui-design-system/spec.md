# UI Design System Specification

## Purpose

Sistema de diseño UI/UX para la plataforma Sistema_PsicoTea, enfocado en crear una interfaz amigable, accesible y consistente para padres y profesionales que trabajan con niños. Define principios de diseño, paleta de colores, tipografía, librería de componentes, estructura de layout, navegación, patrones de formularios, tablas y cards, accesibilidad, animaciones y soporte futuro de dark mode.

## Requirements

### Requirement: Design Principles

El diseño SHALL ser amigable, accesible (WCAG 2.1 AA), responsive (mobile-first), consistente y simple.

1. **Amigable**: Interfaz cálida y acogedora, apropiada para contexto de niños
2. **Accesible**: WCAG 2.1 AA, contraste adecuado, navegación por teclado
3. **Responsive**: Mobile-first, funciona en desktop, tablet y móvil
4. **Consistente**: Patrones coherentes en todos los módulos
5. **Simple**: Tareas frecuentes con mínimo número de pasos

#### Scenario: Principios aplicados
- **WHEN** se diseña o implementa una pantalla
- **THEN** cumple los principios de amigabilidad, accesibilidad, responsive, consistencia y simplicidad

### Requirement: Color Palette

El sistema SHALL usar una paleta de colores con primarios (indigo), secundarios (verde menta), acento (morado), neutros y colores de estado.

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

#### Scenario: Tokens de color
- **WHEN** se implementan colores en la UI
- **THEN** se usan los tokens de la paleta definida

### Requirement: Typography

El sistema SHALL usar la tipografía Inter con la escala de tamaños y pesos definidos.

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

#### Scenario: Escala tipográfica
- **WHEN** se aplica tipografía en la UI
- **THEN** se usa Inter con la escala y pesos definidos

### Requirement: Component Library (shadcn/ui)

El sistema SHALL usar la librería de componentes shadcn/ui con los componentes base de formularios, layout, data display, feedback y navegación.

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

#### Scenario: Componentes disponibles
- **WHEN** se desarrolla una interfaz
- **THEN** se reutilizan los componentes base de shadcn/ui instalados

### Requirement: Layout Structure

El sistema SHALL usar un layout de dashboard con header (h-16), sidebar (w-64) y área de contenido (p-6), con breakpoints responsive.

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

#### Scenario: Layout del dashboard
- **WHEN** se visualiza el dashboard en desktop
- **THEN** muestra header (h-16), sidebar expandida (w-64) y contenido con padding (p-6)

#### Scenario: Comportamiento responsive
- **WHEN** el ancho de pantalla es menor a 1024px
- **THEN** la sidebar colapsa (sheet en móvil < 768px)

### Requirement: Navigation Structure

El sistema SHALL mostrar los ítems de navegación del sidebar según el rol del usuario.

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

#### Scenario: Ítems del sidebar
- **WHEN** un usuario abre el sidebar
- **THEN** ve los ítems definidos filtrados según su rol

### Requirement: Form Patterns

Los formularios SHALL seguir un layout estándar con field groups, labels, inputs y mensajes de error bajo cada campo, mostrando errores en blur/submit.

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

#### Scenario: Validación de formulario
- **WHEN** un usuario envía un formulario con errores
- **THEN** se muestran los errores bajo los campos con borde rojo y, al validar correctamente, un toast de éxito

### Requirement: Table Patterns

Las tablas SHALL incluir search, filtros, export, acciones por fila, paginación y sorting por columnas.

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

#### Scenario: Tabla estándar
- **WHEN** se muestra un listado de datos
- **THEN** incluye search/filtros, headers ordenables, paginación y acciones por fila

### Requirement: Card Patterns

El sistema SHALL usar stat cards y content cards con los layouts definidos para métricas y contenido.

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

#### Scenario: Cards de métricas y contenido
- **WHEN** se muestra una métrica o un bloque de contenido
- **THEN** se usan los patrones de stat card o content card definidos

### Requirement: Accessibility

El sistema SHALL cumplir WCAG 2.1 AA con contraste mínimo, focus visible, alt text, navegación por teclado y soporte para screen readers.

- **Contraste**: Mínimo 4.5:1 para texto, 3:1 para UI components
- **Focus Visible**: Ring visible en todos los elementos interactivos
- **Alt Text**: Todas las imágenes con descripción
- **Keyboard Navigation**: Tab order lógico, Escape para cerrar modales
- **Screen Readers**: Labels en todos los inputs, ARIA labels donde sea necesario
- **Color**: No usar color como único indicador de información

#### Scenario: Verificación de accesibilidad
- **WHEN** se audita una pantalla
- **THEN** cumple contraste mínimo y los requisitos de focus, alt text, teclado y screen readers

### Requirement: Animations

El sistema SHALL usar animaciones con transiciones de 200ms, page transitions suaves, modales con scale+fade, toasts slide-in y skeletons para carga.

- **Transitions**: 200ms ease-in-out para hover/focus states
- **Page Transitions**: Fade in/out suave
- **Modals**: Scale from 95% + fade
- **Toasts**: Slide in from top-right
- **Loading**: Skeleton screens para carga de datos

#### Scenario: Estados animados
- **WHEN** se interactúa con elementos o se cargan datos
- **THEN** se aplican las animaciones definidas (hover/focus 200ms, modales scale+fade, toasts slide-in, skeletons)

### Requirement: Dark Mode (Future)

El sistema SHALL preparar el soporte futuro de dark mode usando CSS variables, Tailwind `dark:` prefix y `darkMode: 'class'`.

- Preparar sistema para soporte futuro de dark mode
- Usar CSS variables para colores
- Tailwind dark: prefix

#### Scenario: Preparación para dark mode
- **WHEN** se implementan colores en la UI
- **THEN** se usan CSS variables y el prefijo `dark:` de Tailwind para permitir dark mode futuro

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