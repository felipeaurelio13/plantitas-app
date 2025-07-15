# 🌱 Guía de Desarrollo para Agentes IA - Plantitas App

## 📋 Información General del Proyecto

**Plantitas** es una aplicación React + TypeScript para el cuidado de plantas con IA, usando Supabase como backend y OpenAI para análisis. Es una PWA optimizada para móviles con arquitectura modular y sistema de caché inteligente.

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **IA**: OpenAI GPT-4o via Edge Functions
- **Estado**: Zustand + React Query
- **Validación**: Zod schemas
- **Testing**: Vitest + Testing Library

---

## 🔒 Reglas de Desarrollo Fundamentales

### 1. **Límite de Líneas por Archivo**
```
⚠️ NUNCA crear archivos con más de 500 líneas de código
```
- Si un archivo excede 500 líneas, DEBE ser refactorizado
- Priorizar separación de responsabilidades
- Crear componentes, hooks o servicios más pequeños

### 2. **Testing Strategy**
```
📁 tests/ - Ubicar todos los tests de funcionalidad individual aquí
```
- **NUNCA usar datos mock**: Siempre usar datos reales
- Si no hay datos reales disponibles, mostrar mensajes destacados indicando que es mock
- Crear tests específicos para cada funcionalidad en la carpeta `tests/`

### 3. **Datos Reales vs Mock**
```
🚨 PROHIBIDO: Usar datos ficticios sin advertencia
✅ PERMITIDO: Datos reales o mock con advertencia clara
```

---

## 🏗️ Arquitectura y Patrones

### Estructura de Carpetas
```
src/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes base (Button, Card, etc.)
│   └── [Feature]/       # Componentes específicos por feature
├── hooks/               # Custom hooks
├── services/            # Lógica de negocio y APIs
├── stores/              # Estado global (Zustand)
├── schemas/             # Validación con Zod
├── lib/                 # Configuraciones y utilities
└── pages/               # Páginas principales
```

### Patrones de Naming
- **Componentes**: PascalCase (`PlantCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`usePlantDetail.ts`)
- **Servicios**: camelCase (`plantService.ts`)
- **Stores**: camelCase con prefijo `use` (`usePlantStore.ts`)

---

## 🔌 Integración con Supabase

### MCP Supabase Integration Disponible
```typescript
// ✅ CONEXIÓN DIRECTA: MCP Supabase está configurado y conectado
// USAR estas funciones MCP como primera opción:
mcp_supabase_deploy_edge_function()
mcp_supabase_list_edge_functions()
mcp_supabase_execute_sql()
mcp_supabase_apply_migration()
mcp_supabase_list_projects()
mcp_supabase_get_anon_key()
// ... y más

// ⚠️ PREFERIR MCP sobre CLI de Supabase cuando esté disponible
// Las credenciales ya están configuradas en el MCP
```

### Edge Functions
- **Ubicación**: `supabase/functions/[function-name]/index.ts`
- **CORS**: Siempre incluir `corsHeaders` desde `_shared/cors.ts`
- **Estructura de respuesta**: Usar JSON con formato consistente
- **Manejo de errores**: Incluir fallbacks elegantes
- **Despliegue**: Preferir MCP integration sobre CLI cuando esté disponible

### Variables de Entorno
```bash
# ✅ Credenciales disponibles en .env
VITE_SUPABASE_URL=           # URL del proyecto
VITE_SUPABASE_ANON_KEY=      # Clave anónima
OPENAI_API_KEY=              # En Supabase Edge Functions settings

# ⚠️ IMPORTANTE: Las credenciales están configuradas en .env
# No necesitas configurar manualmente las variables de entorno
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Tema**: Soporte dark/light mode
- **Colores**: Sistema basado en CSS variables de Tailwind
- **Animaciones**: Framer Motion para transiciones fluidas
- **Responsive**: Mobile-first approach

### Componentes Base
```typescript
// Componentes en src/components/ui/
Button, Card, Input, Toast, Skeleton, Switch, Tabs
```

### Patrones de Loading
```typescript
// ✅ Estados de carga elegantes
const [isLoading, setIsLoading] = useState(false);
// Con skeleton loaders y animaciones
```

---

## 🧠 Sistema de IA y Chat

### Esquemas Zod
```typescript
// SIEMPRE definir esquemas para datos de IA
export const GardenAIResponseSchema = z.object({
  content: z.string(),
  insights: z.array(InsightSchema),
  suggestedActions: z.array(ActionSchema)
});
```

### Edge Functions de IA
- **analyze-image**: Análisis de plantas por imagen
- **garden-ai-chat**: Chat holístico del jardín  
- **generate-plant-response**: Chat individual con plantas
- **analyze-progress-images**: Comparación temporal

### Manejo de Errores de IA
```typescript
// ✅ Verificar disponibilidad antes de llamar
const functionCheck = await service.verifyFunctionAvailability();
if (!functionCheck.available) {
  // Mostrar error específico al usuario
}
```

---

## 💾 Sistema de Caché

### GardenCacheService
```typescript
// Cache con diferentes TTL por tipo de dato
- Contexto jardín: 5 minutos
- Resumen salud: 3 minutos  
- Preguntas sugeridas: 10 minutos
- Datos plantas: 2 minutos
```

### Invalidación Automática
- **Al modificar plantas**: Limpiar caché relacionado
- **Al cerrar sesión**: Limpiar todo el caché del usuario
- **Cleanup automático**: Cada 5 minutos

---

## 🔄 Estado y Gestión de Datos

### Zustand Stores
```typescript
// Patrón de store con Immer
const usePlantStore = create(
  immer<PlantState>((set, get) => ({
    // Estado inicial
    plants: [],
    // Acciones
    addPlant: (plant) => set((state) => {
      state.plants.push(plant);
      // ✅ Invalidar caché al modificar
      gardenCacheService.invalidateUserCache(userId);
    })
  }))
);
```

### React Query
```typescript
// ✅ Para datos del servidor con caché automático
const { data: plants, isLoading } = usePlantsQuery(userId);
```

---

## 🧪 Testing y Debugging

### Estrategia de Testing
```typescript
// tests/[feature].test.ts
describe('Feature Name', () => {
  test('should handle real data scenarios', async () => {
    // ✅ Usar servicios reales cuando sea posible
    // ✅ Mockear solo APIs externas (OpenAI, etc.)
  });
});
```

### Herramientas de Debugging
```typescript
// ✅ Componente de diagnóstico para funciones Edge
<SystemDiagnostics onClose={handleClose} />

// ✅ Console logs estructurados
console.log('[ServiceName] Action:', { data, timestamp });
```

---

## 🚨 Manejo de Errores

### Patrones de Error Handling
```typescript
// ✅ Detección específica de tipos de error
if (error.message?.includes('Failed to send a request to the Edge Function')) {
  return 'La función no está disponible. Verifica el despliegue.';
} else if (error.message?.includes('CORS')) {
  return 'Error de configuración CORS.';
}
```

### Error Boundaries
```typescript
// ✅ Componente ErrorBoundary disponible
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

---

## 📱 PWA y Optimización

### Service Worker
- **Ubicación**: `public/sw.js`
- **Caché**: Estrategia cache-first para assets
- **Offline**: Funcionalidad básica sin conexión

### Performance
- **Lazy Loading**: Componentes y páginas
- **Image Optimization**: LazyImage component
- **Bundle Splitting**: Vite configurado para chunks optimizados

---

## 🔧 Herramientas de Desarrollo

### Vite Configuration
```typescript
// ✅ Base URL condicional para desarrollo vs producción
base: command === 'build' ? '/plantitas-app/' : '/',
```

### Scripts Útiles
```bash
npm run dev          # Desarrollo local
npm run build        # Build para producción
npm run test         # Testing con Vitest
npm run lint         # ESLint
npm run deploy       # 🚀 Despliegue a GitHub Pages (automático)
```

### Despliegue en Producción
```bash
# ✅ DESPLIEGUE: Configurado para GitHub Pages
npm run deploy

# Este comando ejecuta:
# 1. npm run build (genera dist/)
# 2. gh-pages -d dist (despliega a GitHub Pages)
# 
# ⚠️ El despliegue es automático - no necesitas configuración manual
```

---

## 📊 Base de Datos

### Esquema Principal
```sql
-- Tablas principales
users, plants, plant_images, garden_chat_sessions, garden_chat_messages

-- ✅ Políticas RLS siempre activas
-- ✅ Índices optimizados para queries frecuentes
```

### Migraciones
```bash
# ✅ Usar MCP integration cuando esté disponible
mcp_supabase_apply_migration(project_id, name, query)

# Fallback: CLI
npx supabase migration new migration_name
```

---

## 🎯 Consideraciones Especiales

### 1. **Mobile-First**
- Todas las interfaces deben funcionar perfectamente en móvil
- Touch-friendly interactions
- Navegación con gestos

### 2. **Offline Resilience**
- Caché inteligente para funcionalidad básica
- Estados de error claros cuando no hay conexión
- Retry automático cuando se recupera la conexión

### 3. **Performance**
- Lazy loading obligatorio para componentes pesados
- Optimización de imágenes automática
- Virtualization para listas largas

### 4. **Accessibility**
- Aria labels en componentes interactivos
- Soporte para lectores de pantalla
- Contraste adecuado en ambos temas

### 5. **Seguridad**
- RLS policies en todas las tablas
- Validación tanto en frontend como backend
- Sanitización de inputs del usuario

---

## 🚀 Flujo de Desarrollo Recomendado

1. **Planificación**: Definir esquemas Zod primero
2. **Backend**: Crear/actualizar Edge Functions si necesario
3. **Frontend**: Implementar UI con estados de loading/error
4. **Testing**: Crear tests con datos reales
5. **Optimización**: Implementar caché y lazy loading
6. **Documentación**: Actualizar esta guía si introduces nuevos patrones

---

## 🤖 Para Agentes IA

### Al Trabajar en Esta App:

1. **SIEMPRE** revisar límites de líneas antes de editar archivos
2. **USAR MCP PRIMERO**: MCP Supabase está configurado - úsalo sobre CLI
3. **NO TOCAR .env**: Las credenciales ya están configuradas correctamente
4. **DESPLEGAR FÁCIL**: `npm run deploy` para subir a GitHub Pages
5. **INCLUIR** manejo de errores específico y meaningful
6. **TESTEAR** funcionalidad con datos reales cuando sea posible
7. **MANTENER** consistencia con patrones existentes
8. **OPTIMIZAR** para móvil desde el primer momento
9. **DOCUMENTAR** cambios significativos en esta guía

### Recursos Rápidos:
- **Project ID**: `cvvvybrkxypfsfcbmbcq`
- **Credenciales**: Configuradas en `.env` (no tocar)
- **MCP Supabase**: ✅ Conectado y listo para usar
- **Despliegue**: `npm run deploy` → GitHub Pages automático
- **Tests**: Ubicar en `tests/` folder
- **Diagnósticos**: Usar botón 🔧 en chat de jardín

---

*Actualizado: Enero 2025 - Mantener este documento actualizado con nuevos patrones y aprendizajes* 