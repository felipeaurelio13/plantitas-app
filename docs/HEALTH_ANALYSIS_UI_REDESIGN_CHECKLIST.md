# Rediseño UI: Análisis de Salud de Planta

## Objetivo
Actualizar el estilo visual y la experiencia de usuario de la sección "Análisis de Salud" en la vista de detalle de una planta, siguiendo criterios de claridad, accesibilidad y consistencia visual.

---

## Checklist de Rediseño

- [ ] **Contenedor principal**
  - [ ] Envolver la sección en un `<Card>` o `<div>` con `border: 1px solid #E0E0E0`, `border-radius: 8px`, y `padding: 16px`.
  - [ ] Fondo blanco puro por defecto, pero `background-color: #FAFAFA` cuando esté expandida.
  - [ ] Añadir `padding-bottom: 8px` al final del contenedor.

- [ ] **Header colapsable**
  - [ ] Alinear icono (20×20 px) y título centrados verticalmente, con `margin-right: 8px`.
  - [ ] Badge de estado ("Saludable") a la derecha, solo para la sección de salud, con fondo `#E0F2E9`, texto `#2A7F3E`, padding `2px 6px`, radio `4px`.
  - [ ] Caret (ChevronDown) al final, a 16px del borde, rotando al expandir/colapsar.
  - [ ] Fondo del header blanco, pero `#FAFAFA` cuando esté expandido.

- [ ] **Bloque “Problemas Detectados”**
  - [ ] Título en `16px`, peso `600`, color `#333`, `margin-top: 12px`.
  - [ ] Texto de conteo en rojo `#D32F2F`, peso `500`, tamaño `14px`, `margin-bottom: 8px`.

- [ ] **Lista de problemas**
  - [ ] Icono `Leaf` de `lucide-react` en rojo claro `#EF9A9A`, tamaño `20x20px`.
  - [ ] Título del problema en `15px`, peso `600`, color `#333`.
  - [ ] Descripción en `14px`, color `#555`, `margin-top: 4px`.
  - [ ] Separador: `margin-bottom: 16px` entre ítems y línea `1px solid #EEE` entre problemas.

- [ ] **“Tratamientos Sugeridos” y “Recomendaciones Adicionales”**
  - [ ] Encabezado de bloque: `14px`, peso `600`, color `#333`, `margin-top: 16px`, `margin-bottom: 8px`.
  - [ ] Listas: viñetas `•` en verde `#2A7F3E`, texto `14px`, color `#444`, line-height `1.5`, sin sangría excesiva.

- [ ] **Espaciado y flujo**
  - [ ] Line-height homogéneo (`1.4`) en todo el texto.
  - [ ] Margin-top consistente entre secciones (`+16px` para Tratamientos y Recomendaciones).

---

## Notas
- El rediseño se aplica solo a la sección de Análisis de Salud.
- No se modifica la lógica de datos ni el comportamiento colapsable.
- Se prioriza la accesibilidad visual y la consistencia con el resto de la app. 