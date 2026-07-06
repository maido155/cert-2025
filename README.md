# Certificacion 2025 Ashtanga Search

Next.js app para revisar los videos de la certificacion 2025, filtrarlos por postura de la primera serie de Ashtanga y reproducirlos dentro de la interfaz.

## Desarrollo local

```powershell
pnpm install
pnpm dev
```

En local, `/api/videos/[id]` hace streaming desde los archivos en `D:\_content_library\all_videos_flat`, usando Range requests para que el reproductor no cargue el MP4 completo de golpe.

## Datos

El dataset se genera desde `D:\_content_library`:

```powershell
pnpm generate:data
```

Esto actualiza:

- `src/data/certification-videos.json`
- `public/thumbs/*.jpg`

Las etiquetas de posturas son una primera pasada visual basada en los thumbnails revisados. La app marca la confianza como `medium` para que puedas corregir fino después.

## Producción: Vercel + Cloudflare R2

No subas los MP4 a Vercel ni al repo (~1.4 GB). El reparto es:

- **Vercel**: código, metadata y thumbnails. Dominio: `cert-ashtanga-2025.miguel.yoga`.
- **Cloudflare R2**: los MP4, en el bucket `cert-ashtanga-2025` con acceso público (`pub-….r2.dev`).

### Subir videos a R2

```powershell
python scripts/create-upload-manifest.py   # regenera el manifiesto si cambió el dataset
$env:R2_ACCESS_KEY_ID = "..."              # token R2 con Object Read & Write
$env:R2_SECRET_ACCESS_KEY = "..."
node scripts/upload-to-r2.mjs              # reanudable: salta lo ya subido
```

### Variables de entorno en Vercel

```text
NEXT_PUBLIC_VIDEO_BASE_URL=https://pub-<id>.r2.dev   # base pública del bucket
ACCESS_CODE=<palabra de paso compartida>              # activa la puerta de acceso
```

Con `NEXT_PUBLIC_VIDEO_BASE_URL` definida, la app reproduce desde R2 (`{base}/{remoteKey}`); sin ella (dev local) streamea desde `D:\` vía `/api/videos/[id]`.

### Puerta de acceso

Si `ACCESS_CODE` está definida, `src/middleware.ts` exige la palabra de paso (pantalla `/acceso`, cookie de ~180 días). Sin la variable, la app queda abierta (dev local). Nota: los MP4 en R2 quedan en URLs públicas pero no adivinables; la puerta protege la app, no cada archivo.

## Ajuste de posturas

La taxonomía vive en `scripts/generate-certification-data.py`. Ahí puedes corregir reglas por `id`, fecha o tanda, y volver a correr `pnpm generate:data`.
