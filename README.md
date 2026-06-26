<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8a73f5ac-f82e-4ea7-b83b-3742e9269413

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Integración Siigo Nube (Contabilidad — SOLO LECTURA)

La app extrae la contabilización de **Siigo Nube** y la usa para generar informes
en la vista **Contabilidad** (`/contabilidad`). La integración es **estrictamente de
solo lectura**: extrae datos de Siigo hacia una caché en Firestore y **nunca** crea,
edita o elimina información en Siigo.

### Arquitectura

```
Siigo API (GET) → Cloud Functions (auth + sync) → Firestore (caché siigo_*) → App (lectura)
```

El backend (carpeta `functions/`) es necesario porque la API de Siigo bloquea las
llamadas directas del navegador (CORS), la `access_key` no puede viajar en el bundle,
y el token JWT (24h) se cachea del lado servidor.

### Requisitos

- Plan **Blaze (pago por uso)** de Firebase (las Cloud Functions y las llamadas
  salientes a Siigo no están disponibles en el plan gratuito Spark).
- Credenciales API de Siigo: en el portal de Siigo, menú *Alianzas → Mi credencial API*.
  Si Siigo permite una credencial de **solo consulta**, úsala.

### Configuración de secretos (nunca en el bundle del cliente)

```bash
firebase functions:secrets:set SIIGO_USERNAME      # usuario de la credencial API
firebase functions:secrets:set SIIGO_ACCESS_KEY    # access_key de la credencial API
firebase functions:secrets:set SIIGO_PARTNER_ID    # nombre de la app, p.ej. IngenieriaYAlquiler
```

### Despliegue

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions,firestore:rules,firestore:indexes
```

Las funciones desplegadas son:
- `scheduledSiigoSync`: sincronización automática incremental cada 6h (zona `America/Bogota`).
- `manualSiigoSync`: callable que dispara el botón **Sincronizar ahora** (requiere el
  permiso `SINCRONIZAR_SIIGO`).

### Permisos

- `VER_CONTABILIDAD`: acceso a la vista de informes.
- `SINCRONIZAR_SIIGO`: permite ejecutar la sincronización manual.

> Nota: tanto `firebase.json` como el Admin SDK apuntan a la base de datos Firestore
> **con nombre** (`ai-studio-fe7d4ea6-...`); no a `(default)`.
