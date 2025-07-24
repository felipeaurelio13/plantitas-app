# Roadmap de Mejoras de Estilo Plantitas

Este documento sirve como checklist para aplicar y rastrear mejoras de diseño en la plataforma, priorizando cohesión visual, accesibilidad y experiencia de usuario. Cada ítem será marcado al completarse.

---

## 1. Vista “Mi Jardín” (Dashboard) - Mejoras adicionales

- [x] **Línea inferior acentuada**
  - [x] Quitar el degradado: dejar fondo blanco.
  - [x] Añadir border-bottom: 2px solid #E0F2E9 justo bajo el título.
- [x] **Peso y espaciado tipográfico**
  - [x] “Mi Jardín” en font-weight 600, tamaño 28 px.
  - [x] Interlínea 1.2 para compacidad.
- [x] **Contador como tag sutil**
  - [x] “17 plantas” como pill: fondo #E0F2E9 (5 % opacidad verde), texto #2A7F3E, padding 2px 6px.
- [x] **Icono lineal minimal**
  - [x] Icono de hoja 20×20 px, trazo 2 px, antes del título, color #2A7F3E.
- [x] **Micro-feedback al botón “+”**
  - [x] Hover/press: sombra cambia de 0 2 4 rgba(0,0,0,0.1) a 0 4 8 rgba(0,0,0,0.15).

---

## 1. Vista “Mi Jardín” (tema claro)

- [x] **Barra de búsqueda**
  - [x] Aumentar contraste del placeholder a gris medio (#777)
  - [x] Incrementar padding vertical a 12 px
- [x] **Dropdown “Ordenar por Nombre”**
  - [x] Flecha (▼) dentro del borde, pegada al texto
  - [x] Uniformizar radio de esquina (8 px) y borde (1 px verde claro)
- [x] **Cards de planta**
  - [x] Imagen 80×80 px con border-radius 8 px
  - [x] 6 px de separación entre título y subtítulo
  - [x] Subtítulo en gris #555, sin repetir nombre
  - [x] Barra de salud más alta (6 px), fondo pista #EEE
  - [x] Porcentaje alineado al final de la barra
  - [x] Etiqueta de estado como tag con icono, padding 4 px 8 px, fondo verde 10% opacidad, texto acento
- [x] **Botón “+”**
  - [x] Solo en esquina inferior derecha, flotante a 16 px, con sombra (0 2 4 rgba(0,0,0,0.1))
  - [x] Sticky si la lista scrollea (bottom: 16px)
- [x] **Navegación inferior**
  - [x] Contraste íconos inactivos #888, activo #2A7F3E
  - [x] Separar “Inicio” y barra de progreso 4 px debajo del icono

---

## 2. Vista “Chat IA”

- [x] **Header**
  - [x] Reducir tamaño de badges
  - [x] Letter-spacing: 0.2px al título
- [x] **Burbuja de mensaje**
  - [x] Radio de esquina 12 px
  - [x] Marca de tiempo en gris #888, fuente 12 px
- [x] **Preguntas sugeridas**
  - [x] margin-bottom: 16px antes del input
  - [x] Pills con feedback hover/press (#F0F0F0)
- [x] **Botón “+” en chat**
  - [x] Mismo estilo y posición que en “Mi Jardín”
  - [x] Reutilizar componente único si existe en ambas vistas

---

## 3. Detalle de planta

- [x] **Overlay de título y subtítulo**
  - [x] Fondo linear-gradient(to top, rgba(0,0,0,0.6), transparent)
  - [x] Texto blanco puro, 24 px título, 16 px subtítulo
- [x] **Badges de metadatos**
  - [x] Agrupar en dos filas máximo, gap 8 px
  - [x] Iconos lineales negros en círculo blanco semitransparente (32×32 px)
- [x] **Sección de estado (80% Buena)**
  - [x] Tag verde abarcando todo el ancho del card
  - [x] Ícono calendario + “Día 9” alineado con baseline
- [x] **Bloques de Riego, Luz, Ambiente, Temperatura**
  - [x] Misma anchura, dos columnas responsive
  - [x] Subtítulo en mayúsculas pequeñas, valor en negrita
- [x] **“Dato curioso”**
  - [x] Sombreado suave (#FFF2CC), borde izquierdo 4 px ámbar
  - [x] “+4 datos más” como link “Ver más” alineado derecha
- [x] **Botones flotantes (“Chat” / “Agregar foto”)**
  - [x] Mismo tamaño, color y sombra que “+” principal
  - [x] Posicionados en esquina inferior derecha del scrollable interior

---

## 4. Sección “Evolución y Progreso”

- [x] **Encabezado colapsable**
  - [x] Caret (∧/∨) a la derecha del texto, alineado verticalmente
  - [x] Badge “2 fotos” antes del caret, fondo gris claro, texto negro
- [x] **Card interno “Evolución de tu Planta”**
  - [x] Botón “+ Agregar Foto” width 100%, radius 8 px, icono cámara izquierda
  - [x] Listado de períodos: fecha inicio/fin con icono calendario
  - [x] Grid 3 columnas: icono+fechas, cantidad fotos, salud%
- [x] **Órdenes y colapsables siguientes**
  - [x] Mismo patrón: icono + título + estado + caret al final
  - [x] Padding vertical 12 px
- [x] **Galería de Imágenes**
  - [x] Miniaturas mismo tamaño y border-radius (8 px)
  - [x] Botón “Chat” redundante; overlay de icono de chat en la mano de cargar foto

---

**Notas:**
- Cada mejora debe ser incremental y no romper la funcionalidad existente.
- Priorizar la reutilización de componentes y la consistencia visual.
- Actualizar este roadmap tras cada cambio aplicado. 