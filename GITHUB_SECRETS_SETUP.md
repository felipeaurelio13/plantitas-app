# 🔐 CONFIGURACIÓN DE SECRETS EN GITHUB

## 📋 **RESUMEN**
Estas instrucciones te permiten configurar tu aplicación Plantitas para que funcione **completamente desde GitHub** sin depender del archivo `.env` local.

---

## 🚀 **PASO 1: ACCEDER A GITHUB SECRETS**

1. Ve a tu repositorio: `https://github.com/felipeaurelio13/plantitas-app`
2. Click en **Settings** (configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**

---

## 🔥 **PASO 2: CONFIGURAR FIREBASE SECRETS**

Necesitas los datos de tu proyecto Firebase `plantitas-app`. Ve a [Firebase Console](https://console.firebase.google.com/project/plantitas-app/settings/general) y copia estos valores:

### **Secret 1: VITE_FIREBASE_API_KEY**
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: Tu Firebase API Key (ej: `AIzaSyBr4k...`)

### **Secret 2: VITE_FIREBASE_AUTH_DOMAIN**
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: `plantitas-app.firebaseapp.com`

### **Secret 3: VITE_FIREBASE_PROJECT_ID**
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: `plantitas-app`

### **Secret 4: VITE_FIREBASE_STORAGE_BUCKET**
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: `plantitas-app.appspot.com`

### **Secret 5: VITE_FIREBASE_MESSAGING_SENDER_ID**
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: Tu Messaging Sender ID (ej: `123456789`)

### **Secret 6: VITE_FIREBASE_APP_ID**
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: Tu App ID (ej: `1:123456789:web:abcdef123456`)

---

## 🤖 **PASO 3: CONFIGURAR OPENAI SECRET**

Ve a [OpenAI API Keys](https://platform.openai.com/api-keys) y crea/copia tu API key:

### **Secret 7: VITE_OPENAI_API_KEY**
- **Name**: `VITE_OPENAI_API_KEY`
- **Value**: Tu OpenAI API Key (ej: `sk-proj-xyz...`)

---

## ✅ **PASO 4: VERIFICAR CONFIGURACIÓN**

Después de agregar todos los secrets, deberías tener estos 7 secrets:

```
✅ VITE_FIREBASE_API_KEY
✅ VITE_FIREBASE_AUTH_DOMAIN  
✅ VITE_FIREBASE_PROJECT_ID
✅ VITE_FIREBASE_STORAGE_BUCKET
✅ VITE_FIREBASE_MESSAGING_SENDER_ID
✅ VITE_FIREBASE_APP_ID
✅ VITE_OPENAI_API_KEY
```

---

## 🚀 **PASO 5: ACTIVAR GITHUB PAGES**

1. En tu repositorio, ve a **Settings**
2. Scroll hasta **Pages** en el menú lateral
3. En **Source**, selecciona **GitHub Actions**
4. ¡Listo! GitHub Pages se configurará automáticamente

---

## 🔄 **PASO 6: DESPLEGAR AUTOMÁTICAMENTE**

Cada vez que hagas `git push` al branch `firebase-v9-migration` o `main`, la aplicación se desplegará automáticamente usando los secrets configurados.

**URL de tu app**: `https://felipeaurelio13.github.io/plantitas-app`

---

## 📱 **FUNCIONAMIENTO**

### **Lo que pasará automáticamente:**
1. ✅ GitHub Actions ejecutará el workflow de deploy
2. ✅ Usará los secrets para configurar Firebase y OpenAI
3. ✅ Construirá la aplicación (`npm run build:skip-tsc`)
4. ✅ Desplegará a GitHub Pages
5. ✅ Tu app estará disponible públicamente

### **Funcionalidades que tendrás:**
- 🔐 **Login/Registro**: Email + contraseña + Google
- 📸 **Análisis IA**: 4 agentes especializados para plantas
- 💬 **Chat inteligente**: Personalidades únicas por planta  
- 📊 **Dashboard**: Métricas reales de tus plantas
- 📱 **PWA**: Instalable como app nativa
- 🌱 **Tema natural**: Diseño beautiful y armonioso

---

## 🛠️ **TROUBLESHOOTING**

### **Si el deploy falla:**
1. Verifica que todos los 7 secrets estén configurados
2. Revisa que los valores no tengan espacios extra
3. Ve a **Actions** tab en GitHub para ver logs de error

### **Si Firebase no funciona:**
1. Confirma que el proyecto `plantitas-app` existe en Firebase
2. Verifica que Authentication y Firestore están habilitados
3. Revisa las reglas de Firestore

### **Si OpenAI no funciona:**
1. Confirma que tienes créditos en tu cuenta OpenAI
2. Verifica que la API key tiene permisos para GPT-4 Vision
3. Revisa los límites de uso

---

## 💡 **TIPS IMPORTANTES**

### **Seguridad:**
- ❌ **NUNCA** pongas secrets reales en código
- ✅ Los secrets solo se usan en GitHub Actions  
- ✅ El `.env` local puede usar valores demo

### **Costos:**
- 🔥 **Firebase**: Gratis hasta 20k lecturas/día
- 🤖 **OpenAI**: ~$0.01 por análisis completo
- 📱 **GitHub Pages**: Completamente gratis

### **Performance:**
- ⚡ **Build time**: ~15-20 segundos
- 🌍 **Deploy time**: ~2-3 minutos total
- 📦 **Bundle size**: 712KB (optimizado)

---

## 🎉 **¡LISTO!**

Una vez configurados los secrets, tu aplicación Plantitas funcionará completamente desde GitHub Pages con:

- ✅ **Firebase real** (no mock data)
- ✅ **OpenAI real** (análisis IA verdadero)
- ✅ **Deploy automático** (sin .env dependencia)
- ✅ **PWA completa** (instalable)
- ✅ **Tema beautiful** (mobile-first)

**🌱 ¡Tu jardín inteligente está listo para crecer!**

