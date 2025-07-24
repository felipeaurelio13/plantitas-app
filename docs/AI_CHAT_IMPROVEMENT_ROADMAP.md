# Roadmap de Mejora para el Chat IA (Jardín y Plantas)

## Objetivo
Mejorar la calidad, utilidad y personalización de las respuestas de la IA en el chat de jardín y el chat de planta individual, siguiendo las mejores prácticas de prompt engineering 2024, sin afectar otras funcionalidades de la app.

---

## Fase 1: Diagnóstico y Quick Wins
- [ ] Auditar los prompts actuales enviados a la función Edge (garden y planta).
- [ ] Agregar logs de los prompts y respuestas (solo en desarrollo).
- [ ] Detectar y filtrar respuestas genéricas o vacías en frontend, mostrando advertencia si la IA no responde bien.

## Fase 2: Mejora de Prompts
- [ ] Rediseñar el prompt base para ambos chats:
  - Incluir instrucciones de rol, tono, formato y ejemplos.
  - Ejemplo para jardín:
    ```
    Eres un asistente experto en botánica y cuidado de jardines. Responde de forma amigable, precisa y personalizada. Si el usuario pregunta por la salud de su jardín, analiza los datos y da consejos accionables. Si no tienes suficiente información, pide más detalles. Responde siempre en español neutro.
    ```
  - Ejemplo para planta:
    ```
    Eres la voz de la planta {nombre}. Responde como si fueras la planta, de forma simpática y útil, dando consejos sobre tu propio cuidado. Si el usuario pregunta algo que no sabes, díselo honestamente.
    ```
- [ ] Agregar ejemplos de buenas respuestas (few-shot prompting).
- [ ] Incluir contexto ambiental y preferencias del usuario si están disponibles.

## Fase 2.5: Evolución y análisis temporal de plantas con imágenes
- [ ] Enriquecer el prompt del chat de planta para:
  - Incluir explícitamente la instrucción de analizar la evolución de la planta usando la secuencia de imágenes y sus timestamps.
  - Indicar que debe comparar los análisis asociados a cada imagen (si existen) para responder sobre progreso o retroceso.
  - Pedir que, ante preguntas de evolución, haga referencia a fechas y cambios detectados.
  - Mantener el contexto conversacional usando el historial de mensajes previos.
- [ ] Si hay análisis de salud asociados a cada imagen, incluirlos en el contexto enviado a la IA.
- [ ] Agregar ejemplos de preguntas y respuestas evolutivas en el prompt (few-shot).
- [ ] Validar que la IA pueda responder preguntas como:
  - ¿Cómo ha cambiado mi planta en los últimos 3 meses?
  - ¿Notas alguna mejora o empeoramiento entre la primera y la última imagen?
  - ¿Cuál fue el mejor momento de salud de mi planta según las fotos?
- [ ] (Opcional) Visualizar en la UI la galería de imágenes y fechas para el usuario.

## Fase 3: Backend y Control de Calidad
- [ ] Actualizar la función Edge para aceptar y usar el nuevo prompt estructurado.
- [ ] Implementar validación de respuestas: Si la IA responde con "no sé" o algo genérico, pedirle que lo intente de nuevo.
- [ ] Agregar tests automáticos de calidad de respuesta (golden tests).

## Fase 4: Personalización Avanzada
- [ ] Permitir al usuario elegir el tono/persona de la IA (ej: formal, divertida, científica).
- [ ] Soporte para clima/localización real (si el usuario lo permite).
- [ ] Aprendizaje de preferencias del usuario (guardar historial de preguntas frecuentes, etc).

## Fase 5: Experiencia de Usuario
- [ ] Feedback de usuario sobre la utilidad de la respuesta (botón "¿Te fue útil esta respuesta?").
- [ ] Mostrar fuentes o links confiables cuando la IA lo sugiera.
- [ ] Mejorar la visualización de respuestas largas o estructuradas (listas, tablas, etc).

---

## Garantía de No Afectar Otras Funcionalidades
- Todos los cambios se limitan a la construcción y envío de prompts a la IA y al procesamiento de sus respuestas.
- No se modifica la lógica de almacenamiento, creación de plantas, ni el store global.
- Se recomienda hacer los cambios de forma incremental y probar exhaustivamente el chat de jardín y de planta tras cada cambio.

---

## Estado Actual
- [ ] Diagnóstico inicial
- [ ] Implementación de quick wins
- [ ] Rediseño de prompts
- [ ] Actualización backend
- [ ] Personalización avanzada
- [ ] Mejoras UX 