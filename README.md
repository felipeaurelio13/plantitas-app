# 🌱 Plantitas — Tu jardín inteligente con cariño minimalista

Plantitas es una aplicación web progresiva creada para acompañar a cada persona en el cuidado cotidiano de sus plantas. La experiencia está pensada mobile-first y utiliza una estética natural y serena para que revisar el estado del jardín sea tan sencillo como agradable.

## ✨ Experiencia principal

- **Resumen diario empático**: al abrir la app ves un saludo humano y un mensaje que te orienta sobre qué plantas necesitan atención hoy.
- **Indicadores en un vistazo**: tarjetas minimalistas muestran la cantidad de plantas registradas, el estado de salud promedio y el próximo riego planificado.
- **Acciones rápidas**: accesos directos para capturar una nueva planta con la cámara o conversar con la IA del jardín desde cualquier lugar.
- **Listado mindful de plantas**: cada tarjeta destaca ubicación, necesidades de luz, recomendaciones de riego y salud actual sin saturar al usuario.
- **Búsqueda natural**: filtra plantas por nombre, apodo, especie o ubicación con un buscador ligero integrado en la sección principal.

Todo el contenido proviene de Supabase; no se utilizan datos mock. Las acciones con IA requieren las claves configuradas en la plataforma correspondiente.

## 🧱 Arquitectura y stack

- **Framework**: React + TypeScript con Vite.
- **Estado de servidor**: TanStack Query para sincronizar la información de Supabase.
- **Estilos**: Tailwind CSS 4.x con un tema de verdes y neutros pensado para luz natural.
- **Gestión de estado local**: Zustand.
- **Validaciones**: Zod.
- **Notificaciones y toasts**: Sonner.
- **Testing**: Vitest + Testing Library.
- **IA y almacenamiento**: Supabase + OpenAI (configurados vía variables de entorno). Las secret keys se administran desde GitHub.

## 🚀 Puesta en marcha

```bash
# Instalar dependencias
npm install

# Copiar la configuración de entorno
cp .env.example .env
# Completar con las claves de Supabase y OpenAI correspondientes

# Servidor de desarrollo (mobile-first, hot reload)
npm run dev
```

> ⚠️ Recuerda que la app no funcionará correctamente sin credenciales reales de Supabase y OpenAI. Las llaves se gestionan desde GitHub Secrets para los entornos productivos.

## 🧪 Testing y calidad

```bash
# Ejecutar la suite completa
npm run test

# Cobertura
npm run test:coverage

# Linting estricto
npm run lint
```

## 📦 Build y deploy

```bash
# Generar la versión de producción
npm run build

# Vista previa del build
npm run preview

# Publicar en GitHub Pages (requiere tener gh-pages configurado)
npm run deploy
```

Durante `npm run build` se actualiza automáticamente la versión visible en el footer mediante `npm run update-version`, manteniendo la trazabilidad de cada entrega.

## 🗺️ Estructura de carpetas destacada

```
src/
├── components/        # UI y piezas reutilizables (PlantCard, navegación, etc.)
├── pages/             # Páginas principales, como el Dashboard renovado
├── hooks/             # Lógica reutilizable (auth, plantas, etc.)
├── services/          # Integraciones con Supabase y servicios externos
├── config/            # Configuraciones como versión y rendimiento
└── lib/               # Utilidades y helpers compartidos
```

## ❤️ Filosofía de diseño

- **Mobile-first y accesible**: controles grandes, tipografía legible, colores con alto contraste.
- **Naturalmente minimalista**: tonos verdes y neutros que acompañan sin distraer.
- **Sin fricción**: cada decisión de interfaz busca reducir el estrés y ofrecer claridad inmediata.

Si quieres contribuir, crea una rama, asegura que los tests pasan y envía tu PR. ¡Que tus plantas prosperen! 🌿
