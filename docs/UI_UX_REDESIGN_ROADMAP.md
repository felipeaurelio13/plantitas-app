# UI/UX Redesign Roadmap

Este documento detalla el plan de mejoras de UI/UX a implementar en la app Plantitas, basado en feedback real de usuario y buenas prácticas de diseño móvil. El objetivo es refinar la experiencia visual, la jerarquía, la coherencia y la usabilidad, sin romper funcionalidades existentes.

---

## 1. Cards de Plantas
- **Jerarquía tipográfica:**
  - Reducir tamaño/peso del porcentaje de salud ("80%"), dar mayor protagonismo al nombre de la planta.
- **Etiqueta de estado ("Excelente", "Buena", etc.):**
  - Usar color acento más suave y/o icono minimalista.
- **Contraste y colores secundarios:**
  - Oscurecer gris de subtítulos e iconos secundarios (de #666 a #888).
  - Aumentar contraste en iconos y textos secundarios.
- **Barra de progreso:**
  - Fondo más tenue para que el progreso destaque más.
- **Espaciados y padding:**
  - Uniformizar padding (ej. 16px) en todos los cards.
  - Igualar espaciado entre imagen-texto y entre cards.
- **Alineación de barra de salud:**
  - Alinear la barra de salud al mismo nivel que la etiqueta "Salud general" para lectura rápida.

## 2. Chat
- **Separación de sugerencias:**
  - Añadir `margin-bottom` a los botones sugeridos para separarlos del input.
- **Pestaña activa:**
  - Destacar la pestaña activa con subrayado o color más notorio para evitar superposición con “+”.
- **Coherencia de colores:**
  - Homologar el color de “Buena” en el header del chat con el color de “Excelente” en los cards.

## 3. Botón “+” (Agregar)
- **Posición y unicidad:**
  - Mantener el botón “+” siempre en la esquina inferior derecha, eliminar duplicado en “Mi Jardín”.
- **Microetiqueta:**
  - Al expandirse, mostrar una microetiqueta (“Agregar planta”, “Nueva consulta”) para reforzar su función.

## 4. Elementos interactivos
- **Botón de orden:**
  - Si “Ordenar por Nombre” es clicable, darle estilo de botón (borde o sombra); si no, dejarlo como texto estático.

## 5. Buscador y flujo de escaneo
- **Buscador:**
  - Centrar el buscador y darle margen superior para que no compita con el título.

## 6. Coherencia de colores y acentos
- **Color acento único:**
  - Definir un color acento único (verde claro o naranja) para todas las acciones y estados “buenos”.

---

### Notas
- Todos los cambios deben ser compatibles con mobile y desktop.
- Se debe testear que no se rompan flujos existentes (creación de planta, chat, navegación, etc.).
- El batch de cambios debe ser atómico y fácil de revertir si es necesario.

---

**Prioridad:** Aplicar todos los cambios en un solo batch, agrupando los commits por área si es posible. 