// ===================================================
// CONFIGURACIÓN DE FIREBASE — RELLENA CON TUS DATOS
// ===================================================
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto (ej: "nosotros-calendario")
// 3. Añade una app web  ⚙️ → "Tus apps" → </>
// 4. Copia los valores que aparecen y pégalos aquí
// 5. En Firebase Console activa:
//    • Authentication → Sign-in method → Correo/contraseña ✓
//    • Firestore Database → Crear base de datos (modo producción)
//    • Reglas de Firestore → pega las reglas del README.md
// ===================================================

export const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO_ID",
  storageBucket:     "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID"
};
