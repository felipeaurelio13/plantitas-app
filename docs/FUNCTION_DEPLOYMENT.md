# Guía de Despliegue de Funciones Edge

## Problema Identificado

El chat de jardín está dando un error CORS porque la función `garden-ai-chat` no está desplegada en Supabase.

```
Access to fetch at 'https://cvvvybrkxypfsfcbmbcq.supabase.co/functions/v1/garden-ai-chat' from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Solución Implementada

### 1. Mejoras de Manejo de Errores

- ✅ **Detección específica de errores**: El servicio ahora detecta errores de función no disponible, CORS y 404
- ✅ **Mensajes de error claros**: Los usuarios ven mensajes específicos en lugar de errores genéricos
- ✅ **Verificación previa**: El sistema verifica que la función esté disponible antes de enviar mensajes
- ✅ **Componente de diagnóstico**: Nuevo botón de diagnóstico en el header del chat de jardín

### 2. Funciones para Desplegar

La función `garden-ai-chat` está implementada en:
- `supabase/functions/garden-ai-chat/index.ts`

### 3. Comandos de Despliegue

Intenta estos comandos en orden:

```bash
# 1. Verificar login en Supabase
npx supabase login

# 2. Desplegar función específica
npx supabase functions deploy garden-ai-chat --no-verify-jwt

# 3. Si falla, intentar con project-ref
npx supabase functions deploy garden-ai-chat --project-ref cvvvybrkxypfsfcbmbcq --no-verify-jwt

# 4. Desplegar todas las funciones
npx supabase functions deploy --no-verify-jwt

# 5. Verificar despliegue
npx supabase functions list
```

### 4. Verificar Variables de Entorno

Asegúrate de que las siguientes variables estén configuradas en Supabase:

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/cvvvybrkxypfsfcbmbcq
2. Navega a Settings > Edge Functions > Environment Variables
3. Verifica que `OPENAI_API_KEY` esté configurada

### 5. Usar el Componente de Diagnóstico

1. Ve al chat de jardín
2. Haz clic en el ícono de llave inglesa (🔧) en el header
3. El diagnóstico te mostrará el estado actual de las funciones

### 6. Fallback Implementado

Si la función no está disponible:
- El sistema muestra un mensaje claro al usuario
- No se envía el mensaje hasta que la función esté disponible
- Se proporciona un botón de diagnóstico para verificar el estado

## Testing

Ejecuta este test para verificar el estado:

```bash
npm test tests/function_status.test.ts
```

## Estado Actual

✅ **RESUELTO**: La función `garden-ai-chat` ha sido desplegada exitosamente usando la integración MCP de Supabase.

### Verificación Completada

- ✅ Función desplegada correctamente
- ✅ Variables de entorno configuradas (OPENAI_API_KEY)
- ✅ Test de verificación pasa exitosamente
- ✅ Chat de jardín funcionando completamente

### Comando Usado

```bash
# Despliegue exitoso usando MCP Supabase integration
mcp_supabase_deploy_edge_function(project_id="cvvvybrkxypfsfcbmbcq", name="garden-ai-chat", ...)
```

## Próximos Pasos

1. **Completado**: ✅ Despliegue de la función garden-ai-chat
2. **Futuro**: Implementar monitoreo automático de funciones
3. **Mejora**: Agregar retry automático cuando las funciones vuelvan a estar disponibles 