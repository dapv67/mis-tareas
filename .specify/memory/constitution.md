<!--
Sync Impact Report
- Version change: (plantilla sin versionar) → 1.0.0
- Principios definidos (adopción inicial, la plantilla traía 5 huecos; se usan 4 por petición
  del usuario):
  - [PRINCIPLE_1_NAME] → I. Código simple y legible
  - [PRINCIPLE_2_NAME] → II. Pruebas automáticas obligatorias (NO NEGOCIABLE)
  - [PRINCIPLE_3_NAME] → III. Interfaz apta para móvil
  - [PRINCIPLE_4_NAME] → IV. Dependencias mínimas
  - [PRINCIPLE_5_NAME] → eliminado (no solicitado)
- Secciones añadidas: Restricciones adicionales, Flujo de desarrollo y puertas de calidad,
  Gobernanza
- Secciones eliminadas: ninguna
- TODOs diferidos: ninguno
-->

# Mis Tareas Constitution

## Core Principles

### I. Código simple y legible

- El código MUST resolver el problema actual de la forma más directa posible; no se añaden
  abstracciones, capas ni configurabilidad para necesidades hipotéticas (YAGNI).
- Los nombres de variables, funciones y archivos MUST describir su propósito sin necesidad de
  comentarios aclaratorios.
- Cada función MUST tener una única responsabilidad; si su propósito no cabe en una frase,
  se divide.
- Los comentarios explican el *porqué*, no el *qué*.
- Toda complejidad adicional MUST justificarse por escrito en el plan de la funcionalidad
  (sección de seguimiento de complejidad).

**Justificación**: un código fácil de leer es fácil de revisar, probar y cambiar; la
simplicidad reduce errores y el coste de mantenimiento.

### II. Pruebas automáticas obligatorias (NO NEGOCIABLE)

- Toda funcionalidad nueva o modificada MUST incluir pruebas automáticas que verifiquen su
  comportamiento.
- Toda corrección de un error MUST incluir una prueba que reproduzca el error y falle antes
  del arreglo.
- Las pruebas MUST ejecutarse con un único comando documentado y MUST pasar antes de
  integrar cualquier cambio.
- Las pruebas MUST ser deterministas: sin dependencia de red externa, orden de ejecución ni
  hora del sistema sin controlar.

**Justificación**: las pruebas automáticas son la garantía de que el sistema funciona y de
que los cambios futuros no rompen lo existente.

### III. Interfaz apta para móvil

- La interfaz MUST ser utilizable en pantallas desde 360 px de ancho sin desplazamiento
  horizontal.
- El diseño MUST partir de móvil (mobile-first) y ampliarse a pantallas mayores.
- Los elementos interactivos MUST tener un área táctil mínima de 44×44 px.
- Toda funcionalidad MUST poder completarse con interacción táctil, sin depender de
  `hover` ni de atajos de teclado.
- Cada funcionalidad con interfaz MUST verificarse en un viewport móvil antes de darse por
  terminada.

**Justificación**: buena parte del uso de una lista de tareas ocurre desde el teléfono; una
interfaz que falla en móvil falla para el usuario.

### IV. Dependencias mínimas

- Antes de añadir una dependencia MUST comprobarse si la plataforma o la biblioteca estándar
  ya resuelve la necesidad.
- Cada dependencia nueva MUST justificarse en el plan de la funcionalidad indicando: qué
  resuelve, por qué no basta con código propio razonable y su estado de mantenimiento.
- Las versiones de las dependencias MUST fijarse (lockfile o versión exacta).
- Las dependencias que dejen de usarse MUST eliminarse en el mismo cambio.

**Justificación**: cada dependencia añade superficie de errores, riesgos de seguridad,
peso y trabajo de actualización.

## Restricciones adicionales

- Preferir las capacidades nativas de la plataforma (p. ej. HTML, CSS y APIs del navegador)
  frente a frameworks o bibliotecas cuando cubran la necesidad.
- El tamaño y el rendimiento en dispositivos móviles de gama media son criterios de
  aceptación, no optimizaciones posteriores.

## Flujo de desarrollo y puertas de calidad

- Cada funcionalidad sigue el flujo Spec Kit: especificación → plan → tareas →
  implementación.
- El plan de cada funcionalidad MUST incluir una verificación explícita contra los cuatro
  principios ("Constitution Check").
- Un cambio solo se considera terminado cuando: las pruebas pasan, la interfaz se ha
  verificado en móvil y no introduce dependencias sin justificar.
- En la revisión de código, la legibilidad es motivo suficiente para solicitar cambios.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica o convención del proyecto.
- Las enmiendas MUST documentarse en este archivo, con su justificación y la actualización
  de la versión.
- Versionado semántico de la constitución:
  - MAJOR: eliminación o redefinición incompatible de un principio o regla de gobierno.
  - MINOR: nuevo principio o sección, o ampliación material de una guía existente.
  - PATCH: aclaraciones, redacción o correcciones sin cambio semántico.
- Toda especificación, plan y revisión MUST verificar el cumplimiento de esta constitución;
  las excepciones MUST justificarse por escrito en el plan correspondiente.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
