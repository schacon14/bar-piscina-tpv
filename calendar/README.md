# Nosotros · Calendario compartido 💑

App PWA de calendario y tareas para parejas, con sincronización en tiempo real.

## Funciones

- **Sincronización en tiempo real** — ambos ven los cambios al instante (Firebase Firestore)
- **Dashboard** — eventos de hoy + próximos 7 días
- **Calendario** — vista mensual con puntos de colores por categoría
- **Tareas** — lista filtrable (hoy / semana / completadas)
- **10 categorías** — Comidas, Salud, Dentista, Hogar, Trabajo, Compras, Familia, Ocio, Farmacia, Otros
- **Recordatorios** — notificaciones nativas del navegador
- **PWA** — se instala en móvil y funciona offline (excepto la sincronización)
- **Responsive** — móvil, tablet y escritorio

---

## Puesta en marcha

### 1. Crear proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un proyecto (p.ej. `nosotros-calendario`)
3. En el proyecto, haz clic en **⚙️ Configuración del proyecto → Tus apps → `</>`** (web)
4. Dale un nombre (p.ej. `nosotros-web`) y haz clic en **Registrar app**
5. Copia el objeto `firebaseConfig` que aparece

### 2. Configurar la app

Abre `calendar/firebase-config.js` y sustituye los valores:

```js
export const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "nosotros-calendario.firebaseapp.com",
  projectId:         "nosotros-calendario",
  storageBucket:     "nosotros-calendario.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abc123"
};
```

### 3. Activar Authentication

En Firebase Console → **Authentication → Sign-in method → Correo/contraseña → Activar**

### 4. Crear base de datos Firestore

En Firebase Console → **Firestore Database → Crear base de datos → Modo producción**

### 5. Reglas de seguridad Firestore

En **Firestore → Reglas**, pega esto y haz clic en **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    match /couples/{coupleId} {
      allow read:   if request.auth != null
                    && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null
                    && request.auth.uid in resource.data.members;
      allow delete: if request.auth != null
                    && request.auth.uid in resource.data.members;
    }

    match /events/{eventId} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid))
             .data.coupleId == resource.data.coupleId;
      allow create: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid))
             .data.coupleId == request.resource.data.coupleId;
    }
  }
}
```

### 6. Desplegar

**GitHub Pages (recomendado):**
```
Settings → Pages → Source: Deploy from branch → main → /calendar → Save
```
La app estará en: `https://TU-USUARIO.github.io/bar-piscina-tpv/calendar/`

**En local:**
```bash
cd bar-piscina-tpv
python3 -m http.server 3456
# Abre http://localhost:3456/calendar/
```

---

## Uso por la pareja

1. **Persona A** crea una cuenta → va automáticamente a la pantalla de vinculación
2. **Persona A** comparte su código de invitación
3. **Persona B** crea su cuenta → introduce el código de Persona A → quedan vinculadas
4. A partir de ahí, ambas ven el mismo calendario en tiempo real

---

## Estructura de archivos

```
calendar/
├── index.html          ← App principal (HTML)
├── styles.css          ← Estilos
├── app.js              ← Lógica (Firebase, UI, eventos)
├── sw.js               ← Service Worker (PWA/offline)
├── manifest.json       ← Configuración PWA
├── firebase-config.js  ← Tus credenciales Firebase ← EDITAR ESTO
└── README.md           ← Esta guía
```
