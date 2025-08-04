# Test Fixes Guide

## Problemas Comunes y Soluciones

### 1. Errores de Importación
**Problema:** `Cannot find module '../../../src/...'`
**Solución:** Cambiar rutas de `../../../src/` a `../../src/`

### 2. Errores de JSX en archivos .ts
**Problema:** `Expected ">" but found "client"`
**Solución:** 
- Cambiar extensión de `.test.ts` a `.test.tsx`
- Usar `React.createElement()` en lugar de JSX
- Agregar `import React from 'react'`

### 3. Errores de Supabase
**Problema:** `Missing Supabase environment variables`
**Solución:** 
- Agregar variables de entorno en CI/CD
- Usar mocks en tests

### 4. Errores de File API
**Problema:** `arrayBuffer is not a function`
**Solución:** Reemplazar `await file.arrayBuffer()` con `new TextEncoder().encode("data").buffer`

### 5. Errores de Navigation
**Problema:** `navigation.plantDetail is not a function`
**Solución:** Usar `navigation.toPlantDetail()` en lugar de `navigation.plantDetail()`

## Scripts Automáticos

### Ejecutar fixes automáticos:
```bash
npm run test:fix
```

### Ejecutar tests con fixes automáticos:
```bash
npm run test:ci
```

## Variables de Entorno Necesarias

Para que los tests funcionen correctamente, necesitas estas variables de entorno:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Comandos Útiles

```bash
# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests de integración
npm run test:integration

# Ejecutar tests e2e
npm run test:e2e
```

## Estructura de Tests

```
tests/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
├── e2e/           # Tests end-to-end
├── mocks/         # Mocks compartidos
└── setup.ts       # Configuración global
```

## Mocks Importantes

### Supabase Mock
```typescript
// tests/mocks/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  })),
  // ... más mocks
};
```

### Auth Store Mock
```typescript
vi.mock('../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));
```

## Troubleshooting

### Si los tests siguen fallando:

1. **Verificar rutas de importación**
2. **Asegurar que los mocks estén correctos**
3. **Verificar que las variables de entorno estén configuradas**
4. **Revisar que los hooks retornen la estructura esperada**

### Logs útiles:
```bash
# Ver logs detallados
npm test -- --reporter=verbose

# Ver solo errores
npm test -- --reporter=basic

# Debug tests específicos
npm test -- --run tests/unit/hooks/useOfflineStatus.test.tsx
```