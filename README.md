# 🌱 Plantitas - Tu Jardín Digital Inteligente

> Una aplicación PWA moderna para el cuidado de plantas con IA integrada, diseñada mobile-first con enfoque minimalista y robusto.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

## 🎯 Objetivo de la Aplicación

**Plantitas** es tu compañero digital para crear y mantener un jardín próspero. Combina inteligencia artificial, fotografía inteligente y seguimiento de datos para transformar el cuidado de plantas en una experiencia intuitiva y exitosa.

### 🌟 Visión
Democratizar el conocimiento botánico y hacer que cualquier persona pueda mantener plantas saludables, sin importar su nivel de experiencia.

### 🚀 Misión
- **Simplificar** el cuidado de plantas con tecnología inteligente
- **Educar** a través de IA conversacional personalizada
- **Conectar** a las personas con la naturaleza de forma digital
- **Preservar** el historial y progreso de cada planta

## ✨ Funcionalidades Principales

### 🤖 **Inteligencia Artificial Avanzada**
- **Identificación automática** de especies por fotografía (OpenAI Vision)
- **Análisis de salud** en tiempo real con recomendaciones precisas
- **Chat personalizado** con cada planta según su "personalidad"
- **Asistente de cuidados** con recordatorios inteligentes

### 📱 **Experiencia Mobile-First**
- **PWA nativa** - instalable sin app store
- **Modo offline** completo con sincronización automática
- **Interfaz minimalista** optimizada para una mano
- **Gestos intuitivos** y animaciones fluidas

### 📊 **Historial y Análisis**
- **Línea temporal fotográfica** del crecimiento
- **Métricas de salud** con gráficos evolutivos
- **Recordatorios inteligentes** basados en patrones
- **Exportación de datos** para backup

### 🔧 **Tecnología Robusta**
- **Gestión de estado** con Zustand
- **Validación de datos** con Zod
- **Testing comprehensivo** con Vitest + Testing Library
- **Optimización automática** de imágenes

## 🛠️ Stack Tecnológico Moderno

### **Frontend**
- **React 19** - Concurrent features y optimizaciones
- **TypeScript 5.x** - Type safety completo
- **Vite 7.x** - Build tool ultra-rápido
- **Tailwind CSS 4.x** - Utility-first styling

### **Estado y Datos**
- **Zustand** - Gestión de estado minimalista
- **Zod** - Validación y parsing de datos
- **TanStack Query** - Server state management
- **Supabase** - Backend-as-a-Service

### **IA y Servicios**
- **OpenAI GPT-4** - Chat y análisis de texto
- **OpenAI Vision** - Identificación de plantas
- **Supabase Storage** - Almacenamiento de imágenes
- **Push API** - Notificaciones nativas

### **Testing y Calidad**
- **Vitest** - Test runner moderno
- **Testing Library** - Testing centrado en usuario
- **ESLint + Prettier** - Linting y formato
- **Husky** - Git hooks automáticos

## 🚀 Inicio Rápido

### **Prerequisitos**
- Node.js 20+ y npm/pnpm
- Cuenta en OpenAI (para IA)
- Cuenta en Supabase (para backend)

### **Instalación**
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/plantitas.git
cd plantitas

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves API

# Ejecutar en desarrollo
npm run dev
```

### **Variables de Entorno**
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_OPENAI_API_KEY=tu_openai_api_key
```

## 📱 Funcionalidades por Implementar

### **Fase 1: Modernización Tecnológica** ⚠️ *En Progreso*
- [ ] Actualización a React 19
- [ ] Migración a Vite 7.x
- [ ] Implementación de Zustand
- [ ] Integración de Zod para validaciones
- [ ] Setup de testing moderno

### **Fase 2: UX/UI Minimalista** 📋 *Planificado*
- [ ] Rediseño de componentes con Tailwind 4.x
- [ ] Animaciones con Framer Motion
- [ ] Optimización mobile-first
- [ ] Dark mode mejorado
- [ ] Accessibility (a11y) completo

### **Fase 3: Funcionalidades Avanzadas** 🔮 *Futuro*
- [ ] Modo offline robusto
- [ ] Sincronización multi-dispositivo
- [ ] Exportación/importación de datos
- [ ] Sharing social de plantas
- [ ] Comunidad de usuarios

### **Fase 4: IA Mejorada** 🤖 *Futuro*
- [ ] Modelo de ML local para offline
- [ ] Predicción de problemas
- [ ] Recomendaciones estacionales
- [ ] Integración con sensores IoT

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes UI reutilizables
│   ├── ui/             # Componentes base (Button, Input, etc.)
│   ├── plant/          # Componentes específicos de plantas
│   └── shared/         # Componentes compartidos
├── stores/             # Estado global con Zustand
├── hooks/              # Custom hooks
├── services/           # Servicios externos (API, storage)
├── lib/                # Utilidades y configuraciones
├── pages/              # Páginas/rutas principales
├── types/              # Definiciones TypeScript
└── utils/              # Funciones utilitarias
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests en modo watch
npm run test:watch

# Coverage report
npm run test:coverage

# Tests de integración
npm run test:e2e
```

## 📦 Build y Deploy

```bash
# Build para producción
npm run build

# Preview del build
npm run preview

# Deploy automático (configurar en CI/CD)
npm run deploy
```

## 🔒 Seguridad y Performance

- **Code splitting** automático por rutas
- **Lazy loading** de componentes pesados
- **Image optimization** con WebP/AVIF
- **CSP headers** para seguridad
- **Bundle size monitoring** en CI

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Ejecuta tests (`npm run test`)
4. Commit con conventional commits (`git commit -m 'feat: nueva funcionalidad'`)
5. Push y crea un Pull Request

## 📈 Roadmap Completo

Ver [ROADMAP.md](./ROADMAP.md) para el plan detallado de desarrollo.

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para detalles.

## 🙏 Agradecimientos

- [OpenAI](https://openai.com) por las APIs de IA
- [Supabase](https://supabase.com) por el backend serverless
- [Vercel](https://vercel.com) por el hosting
- La comunidad open source de React

---

Estilo:

1. Paleta de Colores
Primario: Verde bosque (#2A7F3E) para acentos y botones principales.

Secundario: Verde claro (5 % opacidad de primario) para fondos de tags y estados.

Neutros:

Texto principal: #333

Texto secundario/labels: #777

Borde y separadores: #E5E5E5 / #EEE

Fondo expandido: #FAFAFA

2. Tipografía & Jerarquía
Familia: Sans‑serif moderna, pesos 400–600.

Tamaños:

Títulos secciones: 24–28 px, peso 600

Subtítulos/blocs: 16–18 px, peso 500–600

Body text: 14–15 px, peso 400–500

Labels (caps): 12 px, peso 500, letter‑spacing 0.4–0.6px

Interlineado: 1.2–1.4 según contexto.

3. Espaciado & Layout
Grid base: 8 px como unidad mínima.

Padding interno en cards/containers: 16 px.

Gap entre columnas: 16–24 px.

Margin entre secciones: 16 px (vertical).

Bordes y radios:

Bordes suaves 1 px, color #E5E5E5

Radius general: 6–8 px

4. Componentes Clave
Botón principal (“+”)

48×48 px, fondo #2A7F3E, icono blanco, shadow 0 2 4 rgba(0,0,0,0.1), hover shadow 0 4 8 rgba(0,0,0,0.15).

Tags/Chips

Padding 2px × 6px, radius 4 px, fondo suave (5 % opacidad), texto acento.

Inputs & Dropdowns

Borde 1 px #E0E0E0, radius 8 px, placeholder #777, padding vertical 12 px.

Collapsibles

Header con icono + título + caret, borde 1 px, radius 8 px, transition en caret (.2s).

5. Iconografía
Trazo lineal de 2 px, tamaño 20–24 px.

Siempre en color #555 (neutro), salvo estados críticos (rojo para errores) o acentos (verde para bueno).

6. Micro‑interacciones
Hover/Press

Items list: background-color: #F9F9F9 al pasar.

Botones y pills: ligeros cambios de sombra ó fondo para feedback.

Transitions

Carets y cambios de estado en collapsibles: .2s ease.

7. Accesibilidad & Legibilidad
Contraste mínimo 4.5:1 (texto vs. fondo).

Tamaños de fuente legibles (≥14 px).

Áreas clicables ≥44×44 px.