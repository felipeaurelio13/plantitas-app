# Roadmap de Mejoras para la Sección de Settings

## Objetivo
Dejar la sección de Settings limpia, funcional y minimalista, eliminando funcionalidades sobrantes y mejorando la experiencia de usuario.

---

## 1. Limpieza y Eliminación de Funcionalidades Sobrantes
- [x] Eliminar el toggle y lógica de notificaciones (no aporta valor real ni feedback útil).
- [ ] Eliminar botones o secciones que no tengan funcionalidad real (ej: perfil si no hay edición).
- [ ] Limpiar código muerto y comentarios obsoletos.

## 2. Mejoras de UX y Feedback
- [ ] Añadir toasts o mensajes visuales para exportar y eliminar datos (éxito y error).
- [ ] Confirmar con modal personalizado antes de eliminar datos (no solo window.confirm).
- [ ] Deshabilitar botones si la acción no es posible.

## 3. Funcionalidad
- [ ] Implementar navegación real al perfil de usuario (o eliminar el botón si no hay perfil editable).
- [ ] Mejorar la lógica de exportación de datos para que sea robusta y siempre muestre resultado.
- [ ] Mejorar la lógica de eliminación de datos para que sea segura y muestre resultado.
- [ ] Implementar (o eliminar) las secciones de Soporte, Ayuda, Privacidad y Acerca de.

## 4. Accesibilidad
- [ ] Asegurar que todos los botones y toggles tengan etiquetas ARIA y feedback accesible.

---

## Siguiente Paso
- Priorizar la mejora de feedback visual (toasts, modales personalizados) y la limpieza de botones sin funcionalidad real.
- Implementar mejoras de accesibilidad y feedback en las acciones de exportar/eliminar datos.

---

*Actualizado: Julio 2025* 