// Sube los videos del manifiesto a Cloudflare R2 (API compatible con S3).
//
// Uso (PowerShell):
//   $env:R2_ACCESS_KEY_ID = "..."
//   $env:R2_SECRET_ACCESS_KEY = "..."
//   node scripts/upload-to-r2.mjs
//
// Reanudable: salta los objetos que ya existen con el mismo tamaño.

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = "a55510681b436c417cb38b942b1717de";
const BUCKET = process.env.R2_BUCKET || "cert-ashtanga-2025";
const MANIFEST = new URL("../certification-video-upload-manifest.json", import.meta.url);

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!accessKeyId || !secretAccessKey) {
  console.error("Faltan R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY en el entorno.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const { uploads } = JSON.parse(readFileSync(MANIFEST, "utf8"));
console.log(`${uploads.length} videos en el manifiesto → bucket "${BUCKET}"`);

let done = 0;
let skipped = 0;
let uploadedMb = 0;
const failed = [];

for (const [i, item] of uploads.entries()) {
  const label = `[${i + 1}/${uploads.length}] ${item.remoteKey}`;
  if (!existsSync(item.localPath)) {
    console.error(`${label} — NO EXISTE el archivo local: ${item.localPath}`);
    failed.push(item.remoteKey);
    continue;
  }
  const size = statSync(item.localPath).size;

  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: item.remoteKey }));
    if (head.ContentLength === size) {
      skipped++;
      console.log(`${label} — ya existe, saltado`);
      continue;
    }
  } catch {
    // No existe todavía: subir.
  }

  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: item.remoteKey,
          Body: createReadStream(item.localPath),
          ContentLength: size,
          ContentType: "video/mp4",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      ok = true;
    } catch (error) {
      console.error(`${label} — intento ${attempt} falló: ${error.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (ok) {
    done++;
    uploadedMb += size / (1024 * 1024);
    console.log(`${label} — subido (${(size / (1024 * 1024)).toFixed(1)} MB, acumulado ${uploadedMb.toFixed(0)} MB)`);
  } else {
    failed.push(item.remoteKey);
  }
}

console.log(`\nListo: ${done} subidos (${uploadedMb.toFixed(0)} MB), ${skipped} ya estaban, ${failed.length} fallidos.`);
if (failed.length) {
  console.log("Fallidos (vuelve a correr el script para reintentar):");
  for (const key of failed) console.log(`  - ${key}`);
  process.exit(1);
}
