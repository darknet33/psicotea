# Sistema_PsicoTea

## 1. Descripción del proyecto

**Sistema_PsicoTea** es una plataforma web para la gestión integral de un centro infantil dedicado al cuidado, acompañamiento y desarrollo de niños con autismo y otras necesidades particulares.

El sistema permitirá centralizar la información de los niños inscritos, controlar sus inscripciones, pagos, asistencias, actividades diarias e informes de avance elaborados por los especialistas o personal responsable.

La plataforma busca reemplazar el uso de archivadores físicos y registros dispersos, permitiendo que la información autorizada pueda ser consultada de forma rápida y organizada desde cualquier lugar.

El sistema también contará con un módulo de gestión de Recursos Humanos para administrar al personal del centro, un módulo de gastos para controlar las salidas de dinero, un sistema multiusuario con diferentes roles y una landing page pública para presentar los servicios del centro.

---

# 2. Objetivo general

Desarrollar un sistema web que permita administrar de manera centralizada la información de los niños inscritos en el centro, sus inscripciones, pagos, asistencias, actividades diarias e informes de avance, además de gestionar al personal, controlar los gastos y administrar el acceso mediante usuarios y roles.

---

# 3. Objetivos específicos

* Digitalizar el registro de los niños.
* Mantener organizada la información de cada niño.
* Registrar y controlar las fechas de inscripción.
* Controlar los pagos y mensualidades.
* Registrar las asistencias de los niños.
* Registrar las actividades realizadas diariamente.
* Permitir que los especialistas registren avances y observaciones.
* Generar informes periódicos de avance.
* Mantener un historial de los informes y actividades.
* Registrar y controlar los gastos del centro.
* Obtener reportes de ingresos y gastos básicos.
* Administrar el personal del centro.
* Gestionar usuarios y roles.
* Controlar el acceso a la información según el tipo de usuario.
* Permitir consultar la información desde computadoras, tablets y celulares.
* Proporcionar una landing page pública del centro.
* Mantener una arquitectura preparada para futuras funcionalidades.

---

# 4. Alcance funcional

## 4.1 Gestión de niños

El sistema deberá permitir registrar y administrar a todos los niños inscritos en el centro.

### Información general

Cada niño podrá contar con:

* Nombres.
* Apellidos.
* Fecha de nacimiento.
* Edad calculada automáticamente.
* Sexo.
* Fotografía opcional.
* Fecha de inscripción.
* Estado de inscripción.
* Datos del padre, madre o tutor.
* Teléfonos de contacto.
* Dirección.
* Contacto de emergencia.
* Información relevante.
* Observaciones generales.

### Funcionalidades

* Registrar niño.
* Editar información.
* Consultar información.
* Buscar niño.
* Filtrar niños.
* Consultar expediente digital.
* Ver historial.
* Activar o desactivar registro.
* Consultar fecha de inscripción.

---

# 5. Inscripciones

El sistema deberá permitir controlar el proceso de inscripción de cada niño.

Cada inscripción deberá registrar como mínimo:

* Niño.
* Fecha de inscripción.
* Fecha de inicio.
* Fecha de finalización, cuando corresponda.
* Estado.
* Información del tutor.
* Servicio o modalidad correspondiente, si aplica.
* Observaciones.

El sistema deberá conservar el historial de las inscripciones cuando un niño vuelva a ingresar después de haber sido retirado.

### Estados iniciales

* Activo.
* Inactivo.
* Retirado.

Los estados podrán ampliarse posteriormente.

---

# 6. Pagos

El sistema deberá permitir controlar los pagos realizados por los padres o tutores.

Podrá registrar:

* Niño.
* Concepto.
* Periodo.
* Fecha de pago.
* Monto.
* Método de pago.
* Estado.
* Observaciones.

### Métodos de pago

Inicialmente podrán contemplarse:

* Efectivo.
* Transferencia.
* QR.
* Otros.

### Control de pagos

El sistema deberá permitir:

* Registrar pagos.
* Consultar pagos.
* Consultar historial de pagos.
* Identificar pagos pendientes.
* Identificar pagos realizados.
* Consultar pagos por periodo.
* Consultar pagos por niño.
* Generar reportes.

El sistema deberá permitir identificar los pagos correspondientes a cada periodo de inscripción.

El diseño deberá permitir incorporar posteriormente conceptos adicionales de cobro.

---

# 7. Asistencias

El sistema deberá permitir registrar la asistencia diaria de los niños.

Se deberá poder registrar:

* Niño.
* Fecha.
* Estado de asistencia.
* Hora de ingreso, si corresponde.
* Hora de salida, si corresponde.
* Responsable del registro.
* Observaciones.

### Estados iniciales

* Presente.
* Ausente.
* Justificado.

El sistema deberá permitir consultar el historial de asistencia de cada niño.

También deberá permitir obtener información como:

* Asistencia por día.
* Asistencia por niño.
* Asistencia por periodo.
* Cantidad de faltas.
* Porcentaje de asistencia.

---

# 8. Actividades diarias

El sistema deberá permitir registrar las actividades realizadas durante la jornada.

Las actividades podrán estar asociadas a:

* Fecha.
* Niño o grupo.
* Responsable.
* Tipo de actividad.
* Nombre de la actividad.
* Descripción.
* Observaciones.
* Resultados o comportamiento observado.

El sistema deberá permitir consultar posteriormente las actividades realizadas.

Las actividades deberán formar parte del historial del niño cuando correspondan a un registro individual.

El sistema deberá permitir que los responsables registren las actividades realizadas durante el día de forma sencilla y rápida.

---

# 9. Informes de avance

El sistema deberá permitir que los especialistas o responsables elaboren **informes de avance** sobre cada niño.

Estos informes no deberán plantearse necesariamente como informes clínicos, sino como documentos de seguimiento del desarrollo, comportamiento, adaptación, participación y avances observados dentro del centro.

Cada informe podrá contener:

* Niño.
* Especialista o responsable.
* Fecha.
* Periodo evaluado.
* Áreas observadas.
* Objetivos o aspectos trabajados.
* Avances.
* Dificultades observadas.
* Actividades realizadas.
* Aspectos por reforzar.
* Recomendaciones.
* Observaciones generales.

Los campos deberán poder evolucionar de acuerdo con la metodología utilizada por el centro.

### Historial

Cada niño deberá conservar un historial de sus informes de avance.

Ejemplo:

```text
Niño
│
├── Datos personales
│
├── Inscripciones
│
├── Pagos
│
├── Asistencias
│
├── Actividades
│
└── Informes de avance
    ├── Informe inicial
    ├── Informe periódico
    └── Informe periódico
```

### PDF

El sistema podrá permitir generar los informes en PDF para:

* Descargar.
* Imprimir.
* Compartir con los padres o tutores.
* Mantener una copia digital.

---

# 10. Gestión de especialistas

El sistema deberá permitir registrar y administrar a los especialistas y responsables que trabajan con los niños.

Cada especialista podrá contar con:

* Datos personales.
* Especialidad o área.
* Cargo.
* Información de contacto.
* Estado.
* Usuario asociado.

Dependiendo de sus permisos, un especialista podrá:

* Consultar niños asignados.
* Registrar actividades.
* Registrar asistencias cuando corresponda.
* Registrar observaciones.
* Elaborar informes de avance.
* Consultar informes anteriores autorizados.

El sistema deberá permitir asociar uno o varios especialistas o responsables con un niño, cuando corresponda.

---

# 11. Gestión de Recursos Humanos

El sistema contará con un módulo administrativo para gestionar al personal del centro.

### Información del personal

Podrá incluir:

* Nombres.
* Apellidos.
* Documento de identificación.
* Teléfono.
* Correo.
* Dirección.
* Cargo.
* Especialidad.
* Fecha de ingreso.
* Estado laboral.
* Información adicional.

### Funcionalidades iniciales

* Registrar personal.
* Editar personal.
* Consultar personal.
* Activar/desactivar personal.
* Registrar cargos.
* Registrar especialidades.
* Asociar personal con un usuario.
* Consultar personal activo.

El módulo deberá diseñarse de forma que pueda ampliarse posteriormente con funcionalidades como:

* Control de horarios.
* Asistencia del personal.
* Permisos.
* Vacaciones.
* Ausencias.
* Contratos.
* Otros procesos de RRHH.

Estas funcionalidades no forman parte obligatoria del MVP.

---

# 12. Gestión de gastos

El sistema deberá contar con un módulo para registrar y controlar los gastos realizados por el centro.

El objetivo es mantener un historial organizado de las salidas de dinero y facilitar el control administrativo.

## 12.1 Registro de gastos

Cada gasto podrá registrar:

* Fecha del gasto.
* Concepto.
* Descripción.
* Categoría.
* Monto.
* Método de pago.
* Responsable.
* Comprobante o documento adjunto, cuando corresponda.
* Observaciones.

## 12.2 Categorías de gastos

El sistema deberá permitir clasificar los gastos.

Categorías iniciales:

* Servicios básicos.
* Alquiler.
* Alimentación.
* Materiales.
* Material educativo.
* Limpieza.
* Transporte.
* Mantenimiento.
* Equipamiento.
* Sueldos y personal.
* Otros.

Las categorías deberán poder ser administradas por usuarios autorizados.

## 12.3 Consulta de gastos

El sistema deberá permitir:

* Consultar gastos.
* Buscar gastos.
* Filtrar por fecha.
* Filtrar por categoría.
* Filtrar por responsable.
* Consultar gastos por periodo.
* Consultar el detalle de cada gasto.
* Editar gastos según permisos.
* Anular o desactivar registros cuando corresponda.

## 12.4 Reportes de gastos

El sistema deberá permitir obtener información como:

* Total de gastos del día.
* Total de gastos del mes.
* Gastos por categoría.
* Gastos por periodo.
* Gastos realizados por responsable.
* Historial de gastos.

Los reportes podrán visualizarse dentro del sistema y posteriormente exportarse o descargarse.

## 12.5 Control de acceso

El acceso al módulo de gastos deberá estar restringido según el rol del usuario.

### Administrador

Podrá:

* Registrar gastos.
* Consultar gastos.
* Editar gastos.
* Gestionar categorías.
* Consultar reportes.

### Personal administrativo

Podrá:

* Registrar gastos si cuenta con autorización.
* Consultar gastos permitidos.

### Especialista

No tendrá acceso al módulo de gastos salvo que se le otorgue explícitamente el permiso correspondiente.

---

# 13. Control financiero básico

El sistema deberá permitir relacionar la información de **pagos** y **gastos** para proporcionar una visión administrativa básica de los movimientos económicos del centro.

El sistema podrá mostrar:

* Total cobrado en un periodo.
* Total gastado en un periodo.
* Diferencia entre ingresos registrados y gastos registrados.
* Pagos pendientes.
* Gastos por categoría.

> Este módulo no constituye inicialmente un sistema contable completo. Su objetivo es proporcionar control administrativo básico sobre los ingresos provenientes de pagos y los gastos registrados.

---

# 14. Usuarios y autenticación

El sistema será multiusuario.

Cada usuario deberá iniciar sesión y tendrá un rol que determinará las funcionalidades e información a las que puede acceder.

## 14.1 Administrador

Tendrá acceso general al sistema.

Podrá:

* Gestionar usuarios.
* Gestionar roles.
* Gestionar niños.
* Gestionar inscripciones.
* Gestionar pagos.
* Gestionar asistencias.
* Gestionar actividades.
* Gestionar informes.
* Gestionar especialistas.
* Gestionar personal.
* Gestionar gastos.
* Gestionar categorías.
* Consultar reportes.
* Gestionar configuraciones generales.

---

## 14.2 Especialista

Tendrá acceso a las funcionalidades necesarias para realizar el seguimiento de los niños que tenga asignados.

Podrá:

* Consultar niños autorizados.
* Consultar información del niño.
* Registrar actividades.
* Registrar observaciones.
* Registrar asistencias cuando corresponda.
* Elaborar informes de avance.
* Consultar informes anteriores autorizados.

El acceso a información administrativa, pagos, gastos y otros módulos deberá estar restringido según sus permisos.

---

## 14.3 Personal administrativo

Podrá tener acceso a funcionalidades como:

* Registro de niños.
* Inscripciones.
* Datos de tutores.
* Pagos.
* Asistencias.
* Actividades.
* Consultas administrativas.
* Gastos, si cuenta con autorización.
* Reportes autorizados.

---

## 14.4 Roles adicionales

El sistema deberá permitir incorporar nuevos roles posteriormente.

La arquitectura deberá evitar que los permisos estén completamente ligados al código de cada módulo, permitiendo ampliar el sistema de autorización en futuras versiones.

---

# 15. Control de permisos

El sistema deberá implementar control de acceso basado en roles.

Cada usuario deberá visualizar únicamente los módulos y acciones permitidos.

Se deberá considerar especialmente la privacidad de la información de los niños.

Los permisos deberán contemplar, como mínimo:

* Ver.
* Crear.
* Editar.
* Eliminar o desactivar.
* Consultar reportes.
* Exportar información cuando corresponda.

La estructura podrá evolucionar posteriormente hacia permisos más específicos.

---

# 16. Dashboard

Después de iniciar sesión, cada usuario deberá acceder a un dashboard acorde con su rol.

## 16.1 Dashboard del administrador

Podrá visualizar indicadores como:

* Total de niños.
* Niños activos.
* Nuevas inscripciones.
* Pagos pendientes.
* Pagos recientes.
* Asistencias del día.
* Ausencias.
* Personal activo.
* Informes recientes.
* Gastos del mes.
* Ingresos registrados.
* Balance administrativo básico.

## 16.2 Dashboard del especialista

Podrá visualizar:

* Niños asignados.
* Actividades recientes.
* Registros pendientes.
* Informes pendientes.
* Asistencias.
* Información relevante de sus niños asignados.

---

# 17. Búsqueda y filtros

Los módulos deberán incluir mecanismos de búsqueda y filtrado.

## Niños

* Nombre.
* Apellido.
* Edad.
* Estado.
* Fecha de inscripción.
* Especialista o responsable.

## Pagos

* Niño.
* Periodo.
* Fecha.
* Estado.
* Método de pago.

## Asistencias

* Niño.
* Fecha.
* Periodo.
* Estado.

## Actividades

* Niño.
* Fecha.
* Responsable.
* Tipo de actividad.

## Informes

* Niño.
* Especialista.
* Fecha.
* Periodo.

## Gastos

* Concepto.
* Categoría.
* Fecha.
* Periodo.
* Responsable.
* Método de pago.

---

# 18. Reportes

El sistema deberá permitir generar información administrativa y operativa.

Reportes iniciales:

### Niños

* Niños inscritos.
* Niños activos.
* Niños retirados.
* Inscripciones por periodo.

### Pagos

* Pagos por periodo.
* Pagos pendientes.
* Historial de pagos por niño.
* Ingresos registrados.

### Asistencias

* Asistencia diaria.
* Asistencia por niño.
* Faltas.
* Porcentaje de asistencia.

### Actividades

* Actividades realizadas.
* Actividades por periodo.
* Actividades por responsable.

### Informes

* Informes de avance.
* Informes por niño.
* Informes por especialista.
* Informes por periodo.

### Gastos

* Gastos por periodo.
* Gastos por categoría.
* Gastos por responsable.
* Total de gastos.

Los reportes deberán poder visualizarse desde el sistema y, cuando corresponda, exportarse o descargarse.

---

# 19. Landing Page

El proyecto incluirá una landing page pública para presentar el centro.

La landing page estará orientada principalmente a:

* Padres.
* Madres.
* Tutores.
* Familias interesadas.
* Personas que buscan información sobre los servicios del centro.

## Secciones iniciales

* Inicio.
* Sobre nosotros.
* Servicios.
* Áreas de trabajo.
* Metodología o enfoque.
* Equipo.
* Preguntas frecuentes.
* Contacto.
* Ubicación.
* Redes sociales.

La landing page deberá contar con llamadas a la acción para facilitar el contacto con el centro.

La landing page no deberá exponer información privada de los niños, especialistas, usuarios o registros internos.

---

# 20. Diseño responsive

La plataforma deberá funcionar correctamente en:

* Computadoras.
* Laptops.
* Tablets.
* Smartphones.

El registro de actividades, asistencias y observaciones deberá ser cómodo desde dispositivos móviles o tablets.

La landing page deberá estar optimizada para dispositivos móviles.

---

# 21. Seguridad y privacidad

El sistema manejará información personal de menores, por lo que la seguridad y privacidad deberán ser consideradas desde el diseño inicial.

Como mínimo:

* Autenticación.
* Contraseñas almacenadas de forma segura.
* Control de acceso.
* Protección de rutas.
* Protección de endpoints.
* Validación de datos.
* Control de sesiones.
* Restricción de información según rol.
* Registro de acciones importantes.
* Protección de documentos.
* Acceso únicamente para usuarios autorizados.

La información de los niños no deberá estar disponible públicamente.

La landing page deberá mantenerse separada de la información privada del sistema.

---

# 22. Auditoría

El sistema deberá considerar un mecanismo de auditoría para registrar acciones relevantes realizadas por los usuarios.

Podrán registrarse acciones como:

* Inicio de sesión.
* Registro de niño.
* Modificación de datos.
* Registro de pago.
* Registro de gasto.
* Creación o modificación de informe.
* Cambios importantes en usuarios y permisos.

Los registros de auditoría deberán permitir identificar:

* Usuario.
* Acción.
* Fecha.
* Hora.
* Registro afectado, cuando corresponda.

El alcance exacto de la auditoría podrá definirse durante la implementación.

---

# 23. Arquitectura general

El sistema deberá mantener una separación clara entre la parte pública y la plataforma privada.

```text
                         Sistema_PsicoTea
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
           Landing Page                 Aplicación Web
              Pública                       Privada
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                              Autenticación          Dashboard
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                  Niños        Inscripciones       Pagos
                    │               │                │
                    ├───────────────┼────────────────┤
                    │               │                │
              Asistencias      Actividades       Informes
                    │                                │
                    └──────────────┬─────────────────┘
                                   │
                         Especialistas / Personal
                                   │
                            Recursos Humanos
                                   │
                                Gastos
                                   │
                                   ▼
                              Base de Datos
```

La arquitectura deberá permitir agregar nuevos módulos sin modificar completamente el sistema existente.

---

# 24. Principios del proyecto

El desarrollo de Sistema_PsicoTea deberá seguir estos principios:

1. **Simplicidad:** la interfaz deberá ser fácil de utilizar para personal no técnico.
2. **Modularidad:** cada área deberá estar organizada en módulos independientes.
3. **Escalabilidad:** el sistema deberá poder crecer posteriormente.
4. **Seguridad:** la información de los niños deberá estar protegida.
5. **Privacidad:** únicamente los usuarios autorizados podrán consultar la información.
6. **Responsive:** deberá funcionar correctamente en dispositivos móviles.
7. **Mantenibilidad:** el código deberá mantenerse organizado.
8. **Historial:** la información relevante deberá conservarse de forma organizada.
9. **Trazabilidad:** las acciones importantes deberán poder identificarse.
10. **Evolución:** las funcionalidades futuras deberán poder incorporarse sin rehacer la plataforma.
11. **Usabilidad:** las tareas frecuentes deberán requerir la menor cantidad posible de pasos.
12. **Consistencia:** los diferentes módulos deberán utilizar patrones de interfaz y comportamiento coherentes.

---

# 25. Identidad de marca

La plataforma usa la identidad visual del centro "PsicoTea". Los colores oficiales y su rol de uso son:

```
Colores de marca
  - PISCO:  #2A2960 (navy profundo) - color primario de la marca
  - TEA:    #A0C84F (verde menta)   - color secundario / acento de marca

Complementarios del logo
  - Pink Brand:  #F7386B
  - Yellow Brand:#FDCA1F
  - Blue Brand:  #209CDC
  - Green Brand: #A3CC52
```

Reglas de uso:

- **PISCO `#2A2960`**: color primario (botones, enlaces, elementos activos, marca). Soporta texto claro encima (contraste AA).
- **TEA `#A0C84F`**: acento secundario. Al ser un verde claro, el texto encima debe ser oscuro (PISCO o casi negro).
- **Complementarios**: acentos e identidad del logo. El amarillo `#FDCA1F`, el verde `#A3CC52` y TEA usan texto oscuro; el rosa `#F7386B` y el azul `#209CDC` usan texto claro.
- En la UI estos colores viven como **tokens CSS** en `fronted/src/app/globals.css` (tokens semanticos `--primary`, `--secondary`, `--accent`, `--success`, `--warning`, `--error`, `--info` y tokens de marca `--color-brand-*`) y se documentan en la spec `ui-design-system`.
- El **logo oficial** del centro esta disponible como asset en `fronted/public/logo.jpg` y debe servirse desde la carpeta `public` del frontend (p. ej. `/logo.jpg`). En las vistas de marca (login, sidebar, landing) se usa este archivo, no el mark "Ps" por defecto.

> Estas decisiones son la fuente de verdad para cualquier rediseño futuro: skills o herramientas de diseño deben consumir los tokens de `globals.css` y la spec `ui-design-system`, nunca hex hardcodeados en componentes.

---

# 27. MVP

La primera versión deberá priorizar las siguientes funcionalidades:

## Administración

* Login.
* Usuarios.
* Roles.
* Permisos básicos.
* Dashboard.

## Niños

* Registro.
* Edición.
* Consulta.
* Búsqueda.
* Expediente digital.

## Inscripciones

* Registro de inscripción.
* Fecha de inscripción.
* Fecha de inicio.
* Estado.
* Historial.

## Pagos

* Registro de pagos.
* Historial.
* Pagos pendientes.
* Métodos de pago.
* Reportes básicos.

## Asistencias

* Registro diario.
* Estados de asistencia.
* Consulta histórica.
* Reportes básicos.

## Actividades

* Registro de actividades diarias.
* Responsable.
* Observaciones.
* Historial.

## Informes

* Creación de informes de avance.
* Historial de informes.
* Consulta.
* Generación de PDF.

## Especialistas

* Registro de especialistas.
* Especialidades.
* Asignación a niños.
* Asociación con usuarios.

## Personal

* Registro de personal.
* Cargos.
* Especialidades.
* Estado.
* Asociación con usuarios.

## Gastos

* Registro de gastos.
* Categorías.
* Consulta.
* Búsqueda.
* Filtros.
* Historial.
* Reportes básicos.

## Control financiero básico

* Total de pagos registrados.
* Total de gastos.
* Diferencia entre pagos y gastos.
* Pagos pendientes.

## Landing Page

* Presentación del centro.
* Servicios.
* Información institucional.
* Contacto.
* Ubicación.
* Redes sociales.
* Diseño responsive.

---

# 28. Funcionalidades futuras

El sistema deberá quedar preparado para incorporar posteriormente:

### Gestión de niños

* Portal para padres/tutores.
* Consulta de información autorizada.
* Comunicación con el centro.
* Notificaciones.

### Agenda

* Agenda de actividades.
* Calendario.
* Programación de actividades.
* Recordatorios.

### Asistencias

* Control de asistencia mediante QR.
* Notificaciones de ausencia.
* Reportes avanzados.

### Pagos

* Recordatorios automáticos.
* Notificaciones de pagos pendientes.
* Comprobantes digitales.
* Integración con medios de pago.

### Informes

* Plantillas configurables.
* Firma digital.
* Informes personalizados por especialidad.
* Historial avanzado.

### Recursos Humanos

* Asistencia del personal.
* Horarios.
* Permisos.
* Vacaciones.
* Ausencias.
* Contratos.

### Finanzas

* Ingresos y egresos.
* Presupuestos.
* Reportes financieros avanzados.
* Flujo de caja.
* Categorías financieras.
* Cierre de periodos.

### Plataforma

* Aplicación móvil.
* Notificaciones push.
* Copias de seguridad avanzadas.
* Auditoría avanzada.

### Portal para padres

* Link público donde el padre, madre o tutor consulta el historial y datos de sus niños validándose con su carnet (documento de identidad).
* El portal expondrá únicamente información autorizada y no requerirá credenciales de la plataforma.
* No constituye un registro de usuarios: los padres no inician sesión en el sistema.

Estas funcionalidades deberán analizarse y especificarse antes de su implementación.

---

# 29. Resultado esperado

Al finalizar el proyecto, **Sistema_PsicoTea** deberá proporcionar al centro una plataforma web centralizada para gestionar:

```text
Niños
   │
   ├── Inscripciones
   ├── Pagos
   ├── Asistencias
   ├── Actividades diarias
   └── Informes de avance

Personal
   ├── Especialistas
   ├── Cargos
   └── Recursos Humanos

Administración
   ├── Gastos
   ├── Reportes
   ├── Usuarios
   └── Roles

Presencia digital
   └── Landing Page
```

El sistema deberá permitir que la información autorizada pueda ser consultada desde cualquier dispositivo, reduciendo la dependencia de archivadores físicos y facilitando la gestión administrativa y el seguimiento organizado de cada niño durante su permanencia en el centro.

La plataforma deberá servir como base para futuras funcionalidades administrativas, financieras y de acompañamiento, manteniendo una estructura modular, segura y escalable.
