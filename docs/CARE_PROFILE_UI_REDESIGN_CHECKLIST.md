# Rediseño UI: Perfil de Cuidados

## Objetivo
Actualizar el estilo visual y la experiencia de usuario de la sección "Perfil de Cuidados" en la vista de detalle de una planta, siguiendo criterios de claridad, accesibilidad y coherencia visual con el resto de la app.

---

## Checklist de Rediseño

- [ ] **Contenedor general**
  - [ ] Frame uniforme: border: 1px solid #E5E5E5; border-radius: 8px; padding: 16px.
  - [ ] Fondo blanco puro, sin fondo gris.
  - [ ] El borde sigue visible al colapsar, solo cambia el caret.

- [ ] **Encabezado Collapsable**
  - [ ] Icono + Título: tamaño 20×20 px, espaciado igual que otras secciones.
  - [ ] Quitar badge de estado (“Completo” o “Saludable”).
  - [ ] Caret con transition: transform .2s, gira 180° al expandir.

- [ ] **Grid de iconos y valores**
  - [ ] Dos columnas balanceadas: grid-template-columns: 1fr 1fr; gap: 24px 16px.
  - [ ] Iconos uniformes: trazo 2 px, tamaño 20×20 px, color #555.
  - [ ] Etiqueta en mayúsculas pequeñas (12px, letter-spacing:0.4px, color:#777).
  - [ ] Valor en 15 px, peso 600, color #333.

- [ ] **“Cuidados Especiales”**
  - [ ] Título: 14 px, peso 600, color #333, margin-top: 16px, margin-bottom: 8px.
  - [ ] Lista: viñetas verdes (• en #2A7F3E), texto 14 px, line-height:1.5, margin-left:16px, sin padding-left.

- [ ] **Separador suave**
  - [ ] Línea horizontal 1px solid #EEE entre “Cuidados Especiales” y “Personalidad de la Planta”, margin: 24px 0.

- [ ] **Personalidad de la Planta**
  - [ ] Título: icono robot 20×20 px + “Personalidad de la Planta” en 18 px, peso 600.
  - [ ] Estilo de comunicación: grid de 2 columnas si hay más de uno, centrado si solo hay uno. Etiqueta en mayúsculas pequeñas, valor en 15 px, peso 600.
  - [ ] Frases Típicas: título 14 px, peso 600. Lista horizontal de chips (fondo #F0FDF6, texto #046A38, padding 4px 8px, radius 4px, gap 8px, wrap).

- [ ] **Espaciados y coherencia final**
  - [ ] Margin-bottom: 16px entre cada sección interna.
  - [ ] Line-height: 1.4 consistente.
  - [ ] Colores: grises para labels, negros para valores, verdes suaves para acentos.

---

## Notas
- El rediseño se aplica solo a la sección de Perfil de Cuidados.
- No se modifica la lógica de datos ni el comportamiento colapsable.
- Se prioriza la accesibilidad visual y la coherencia con el resto de la app. 