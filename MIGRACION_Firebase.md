# Migración de Supabase a Firebase Spark (gratis)

## 1. ¿Por qué Firebase Spark?  
- **Auth** ilimitado (email/password, Google, Facebook…)  
- **Cloud Firestore** gratis: 1 GB de datos + 50 000 lecturas/día + 20 000 escrituras/día  
- **Hosting**: tu front sigue en GitHub Pages, solo llamas al SDK JS  
- **Sin infra extra**: cero funciones serverless, todo en el navegador  

## 2. Pasos de configuración

1. **Crear proyecto**  
   - Entra a https://console.firebase.google.com → **Add project**.  
   - Anota `projectId` y `apiKey` (los usarás en el front).

2. **Habilitar proveedores de Auth**  
   - Ve a **Authentication → Sign‑in method**.  
   - Activa Email/Password y/o OAuth (Google, GitHub…).

3. **Configurar Firestore**  
   - Ve a **Firestore Database → Create database**.  
   - Elige modo _Start in locked mode_ y tu ubicación.

4. **Definir reglas de seguridad**  
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       // Usuario sólo accede a su perfil
       match /usuarios/{userId} {
         allow read, write: if request.auth.uid == userId;
       }
       // Posts públicos: cualquiera lee, autor escribe
       match /usuarios/{userId}/posts/{postId} {
         allow read: if true;
         allow write: if request.auth.uid == userId;
       }
     }
   }
````

## 3. Migración de datos desde Supabase

1. **Exportar datos**

   ```bash
   pg_dump \
     --data-only \
     --table=usuarios \
     --format=json \
     > usuarios.json
   ```
2. **Script de migración (Node.js)**

   ```js
   // migrate.js
   import admin from 'firebase-admin';
   import fs    from 'fs';

   admin.initializeApp({
     credential: admin.credential.applicationDefault()
   });
   const db = admin.firestore();
   const usuarios = JSON.parse(fs.readFileSync('usuarios.json'));

   for (const u of usuarios) {
     await db
       .collection('usuarios')
       .doc(u.id.toString())
       .set({
         nombre:    u.nombre,
         email:     u.email,
         createdAt: new Date(u.created_at)
       });
   }
   console.log('Migración completa');
   ```
3. Ejecuta:

   ```bash
   node migrate.js
   ```

## 4. Integración en tu front (GitHub Pages)

1. **Incluir SDK Firebase**

   ```html
   <!-- antes de </body> -->
   <script src="https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js"></script>
   <script>
     const firebaseConfig = {
       apiKey:      "TU_API_KEY",
       authDomain:  "TU_PROYECTO.firebaseapp.com",
       projectId:   "TU_PROYECTO",
     };
     firebase.initializeApp(firebaseConfig);
     const auth = firebase.auth();
     const db   = firebase.firestore();
   </script>
   ```

2. **Auth: registro/login**

   ```js
   // Registro
   auth.createUserWithEmailAndPassword(email, pass)
     .then(u => console.log('Usuario OK:', u))
     .catch(e => console.error(e));

   // Login
   auth.signInWithEmailAndPassword(email, pass)
     .then(u => console.log('Bienvenido:', u))
     .catch(e => console.error(e));
   ```

3. **Operaciones CRUD en Firestore**

   ```js
   // Crear o actualizar perfil
   db.collection('usuarios')
     .doc(uid)
     .set({ nombre, email });

   // Leer doc
   db.collection('usuarios')
     .doc(uid)
     .get()
     .then(doc => console.log(doc.data()));

   // Consultas
   db.collection('usuarios')
     .where('activo', '==', true)
     .get()
     .then(sn => sn.docs.forEach(d => console.log(d.id, d.data())));
   ```

## 5. Ventajas finales

* **0 USD/mes** hasta que explotes las cuotas.
* **Escala automática**: Firestore crece solo.
* **Desarrollo ultrarrápido**: sin backend propio.

> ¡Listo! Tienes auth y DB 100 % gratis y tu front en GitHub Pages sin cambios.
