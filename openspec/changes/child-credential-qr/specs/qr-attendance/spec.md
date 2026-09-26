## ADDED Requirements

### Requirement: Attendance QR Scan

El sistema SHALL permitir registrar la asistencia de un nino escaneando su credencial, mediante un endpoint protegido por JWT y `RolesGuard`.

El endpoint SHALL aceptar en el cuerpo tanto el `credentialCode` suelto como la URL completa escaneada, en cuyo caso extraer el codigo del ultimo segmento de la ruta. El sistema SHALL validar la firma del token antes de resolver el nino.

El registro SHALL ser idempotente por nio y fecha: si ya existe una asistencia para ese nio y ese dia, el sistema SHALL devolver el registro existente en lugar de crear uno duplicado.

El sistema SHALL registrar como `registeredById` al usuario autenticado que realizo el escaneo.

El endpoint SHALL cumplir la Permission Matrix de `user-roles` para el modulo de niños: ADMIN y PERSONAL_ADMINISTRATIVO pueden registrar asistencia; un ESPECIALISTA solo puede registrar sobre ninos que tiene asignados.

#### Scenario: Escaneo valido
- **WHEN** un usuario autenticado escanea la credencial de un nino
- **THEN** el sistema registra la asistencia de hoy con estado `PRESENTE`, `registeredById` igual al usuario que escaneo, y responde 201 con el registro creado

#### Scenario: Token manipulado
- **WHEN** un usuario autenticado envia un `credentialCode` alterado
- **THEN** el sistema responde 404 y no registra ninguna asistencia

#### Scenario: Sin autenticacion
- **WHEN** un cliente sin JWT llama al endpoint de escaneo
- **THEN** el sistema responde 401 y no registra ninguna asistencia

#### Scenario: Escaneo repetido el mismo dia
- **WHEN** se escanea dos veces la credencial del mismo nio en el mismo dia
- **THEN** el sistema responde 200 con el registro existente y no crea un segundo registro

#### Scenario: URL escaneada en lugar del codigo
- **WHEN** se envia la URL completa `{FRONTEND_URL}/publico/nino/{code}`
- **THEN** el sistema extrae el codigo y registra la asistencia igual que en el escenario de escaneo valido

#### Scenario: Especialista sobre nio no asignado
- **WHEN** un ESPECIALISTA escanea la credencial de un nio que no tiene asignado
- **THEN** el sistema responde 403 y no registra ninguna asistencia

#### Scenario: Nino inactivo
- **WHEN** se escanea la credencial de un nio con `isActive` en false
- **THEN** el sistema responde 404 y no registra ninguna asistencia

### Requirement: Attendance Scan Interface

El frontend SHALL proporcionar una vista de asistencia con lector de camara que decodifique el QR de una credencial y registre la presencia, y SHALL ofrecer la entrada manual del `credentialCode` como alternativa cuando la camara no este disponible.

#### Scenario: Escaneo con camara
- **WHEN** el usuario autoriza la camara y enfoca la credencial
- **THEN** el sistema decodifica el QR, registra la asistencia y muestra el nombre del nio y el estado del registro

#### Scenario: Sin permiso de camara
- **WHEN** el usuario deniega el permiso de camara o el navegador no la soporta
- **THEN** la vista ofrece el campo de entrada manual y no se rompe

#### Scenario: QR no reconocido
- **WHEN** la camara decodifica un codigo que no corresponde a una credencial valida
- **THEN** la vista muestra un mensaje de credencial no valida y permite reintentar
