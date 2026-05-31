# Bar-Piscina "Los Cerezos" · TPV

TPV (punto de venta) web para bar-restaurante de piscina. Pensado para usarse en
tablet o móvil (iPad / Android), sencillo e intuitivo.

Es una **PWA**: se instala en el dispositivo y funciona **sin conexión**. No usa
ninguna librería externa; son solo tres archivos (`index.html`, `styles.css`,
`app.js`) más los iconos.

## Funciones

- **Plano de mesas** visual (barra con taburetes, mesas del salón y piscina) con
  estados: libre / ocupada / cuenta pedida.
- **Pedidos por mesa**, comensales, precio libre, edición de líneas.
- **Cobro** en efectivo / tarjeta / Bizum, con cálculo de cambio.
- **Ticket de factura simplificada** (nombre fiscal, NIF, base imponible, IVA).
- **Unir, separar y renumerar mesas.**
- **Dashboard** de ventas (por día, por producto, por forma de pago).
- **Arqueo de caja** (descuadre entre ventas y efectivo contado).
- **Rectificativas** (tickets en negativo para corregir errores).
- **Productos por categoría** con color de marca o emoji automático.
- **Exportación a Excel** de todos los datos.

## Cómo se usa / despliega

Son archivos estáticos: cualquier servidor web o hosting estático vale.

### GitHub Pages
1. Sube el repositorio a GitHub.
2. `Settings → Pages → Build and deployment → Source: Deploy from a branch`.
3. Branch: `main`, carpeta `/ (root)`. Guarda.
4. En 1-2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

### En local (para desarrollo)
```bash
cd bar-piscina-tpv
python3 -m http.server 3456
# abrir http://localhost:3456
```

## Datos

Los datos (mesas, productos, ventas, arqueos, ajustes) se guardan en el propio
dispositivo (`localStorage` del navegador). **Cada dispositivo es independiente**;
no hay sincronización entre aparatos.

## Actualizaciones

Al cambiar `app.js` o `styles.css`, sube el número de versión en `index.html`
(`?v=N`) y el nombre de caché en `sw.js` (`barpiscina-vN`) para que los
dispositivos descarguen la versión nueva.
