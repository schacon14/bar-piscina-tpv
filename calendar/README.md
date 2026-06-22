# Nosotros ♥ · Calendario compartido para parejas

App PWA de calendario, tareas con fotos, lista de la compra, menú semanal y sistema de puntos para parejas. Sincronización en tiempo real con Firebase.

## Funciones

- **5 secciones**: Inicio/Dashboard · Tareas · Comida · Agenda · Nosotros
- **Sistema de puntos gamificado**: tareas +15 pts, con foto +30 pts, reacciones partner +5 pts
- **Ranking semanal** con barra de duelo en tiempo real
- **Tienda de recompensas** personalizable (besos, masajes, salidas, etc.)
- **Fotos de tareas** con compresión automática y reacciones emoji
- **Lista de la compra** con categorías
- **Menú semanal** (desayuno/comida/cena por día)
- **Recetario compartido**
- **Calendário + eventos** con categorías
- **Recordatorios** recurrentes
- **Sincronización en tiempo real** (Firebase Firestore)
- **PWA** — instalable, funciona offline

---

## Configuración en 6 pasos

### 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **Crear proyecto** → nombre ej: `nosotros-app`
3. **Configuración → Tus apps → `</>`** (web) → nombre ej: `nosotros-web` → **Registrar**
4. Copia el objeto `firebaseConfig`

### 2. Editar firebase-config.js

```js
export const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "nosotros-app.firebaseapp.com",
  projectId:         "nosotros-app",
  storageBucket:     "nosotros-app.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};
```

### 3. Activar Authentication

**Authentication → Sign-in method → Correo/contraseña → Activar ✓**

### 4. Crear base de datos Firestore

**Firestore Database → Crear base de datos → Modo producción**

### 5. Activar Firebase Storage (para fotos de tareas)

**Storage → Comenzar → Modo producción**

### 6. Reglas de Firestore y Storage

**Firestore → Reglas** — pegar y publicar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /couples/{coupleId} {
      allow read:   if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid in resource.data.members;
      allow delete: if request.auth != null && request.auth.uid in resource.data.members;
    }
    function coupleId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId;
    }
    match /tasks/{id}        { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /events/{id}       { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /shoppingItems/{id}{ allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /recipes/{id}      { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /reminders/{id}    { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /rewards/{id}      { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /redemptions/{id}  { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
    match /weeklyMenu/{id}   { allow read,write: if request.auth!=null && (resource==null || resource.data.coupleId==coupleId()); allow create: if request.auth!=null && request.resource.data.coupleId==coupleId(); }
  }
}
```

**Storage → Reglas**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{coupleId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Despliegue en GitHub Pages

```
Settings → Pages → Source: Deploy from branch → main → /calendar → Save
```

URL: `https://TU-USUARIO.github.io/bar-piscina-tpv/calendar/`

**En local:**
```bash
python3 -m http.server 3456
# Abre http://localhost:3456/calendar/
```

---

## Sistema de puntos

| Acción | Puntos |
|---|---|
| Completar tarea | +15 ⭐ |
| Completar tarea con foto | +30 ⭐ |
| Reacción de tu pareja a tu foto | +5 ⭐ |
| Recompensas (configurables) | -20 a -150 ⭐ |

Los puntos se resetean cada lunes. El historial total siempre crece.

---

## Archivos

```
calendar/
├── index.html          ← HTML (5 secciones + modals)
├── styles.css          ← Estilos (diseño game colorido)
├── app.js              ← Lógica completa (Firebase, puntos, fotos, UI)
├── sw.js               ← Service Worker (PWA)
├── manifest.json       ← Config PWA
├── firebase-config.js  ← ⚠️ EDITAR CON TUS CREDENCIALES
└── README.md
```
