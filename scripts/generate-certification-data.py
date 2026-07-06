import json
import shutil
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LIB = Path(r"D:\_content_library")
INDEX_JSON = LIB / "video_index.json"
CERT_JSON = LIB / "visual" / "certificacion_2025_detection.json"
THUMB_DIR = LIB / "visual" / "thumbs"
OUT_JSON = ROOT / "src" / "data" / "certification-videos.json"
PUBLIC_THUMBS = ROOT / "public" / "thumbs"


PRIMARY_SERIES = [
    {"slug": "surya-namaskara-a", "sanskrit": "Surya Namaskara A", "spanish": "Saludo al sol A", "group": "sun"},
    {"slug": "surya-namaskara-b", "sanskrit": "Surya Namaskara B", "spanish": "Saludo al sol B", "group": "sun"},
    {"slug": "padangusthasana", "sanskrit": "Padangusthasana", "spanish": "Manos a pies", "group": "standing"},
    {"slug": "padahastasana", "sanskrit": "Padahastasana", "spanish": "Manos bajo pies", "group": "standing"},
    {"slug": "utthita-trikonasana", "sanskrit": "Utthita Trikonasana", "spanish": "Triangulo extendido", "group": "standing"},
    {"slug": "parivrtta-trikonasana", "sanskrit": "Parivrtta Trikonasana", "spanish": "Triangulo girado", "group": "standing"},
    {"slug": "utthita-parsvakonasana", "sanskrit": "Utthita Parsvakonasana", "spanish": "Angulo lateral extendido", "group": "standing"},
    {"slug": "parivrtta-parsvakonasana", "sanskrit": "Parivrtta Parsvakonasana", "spanish": "Angulo lateral girado", "group": "standing"},
    {"slug": "prasarita-padottanasana-a", "sanskrit": "Prasarita Padottanasana A", "spanish": "Flexion amplia de pie A", "group": "standing"},
    {"slug": "prasarita-padottanasana-b", "sanskrit": "Prasarita Padottanasana B", "spanish": "Flexion amplia de pie B", "group": "standing"},
    {"slug": "prasarita-padottanasana-c", "sanskrit": "Prasarita Padottanasana C", "spanish": "Flexion amplia de pie C", "group": "standing"},
    {"slug": "prasarita-padottanasana-d", "sanskrit": "Prasarita Padottanasana D", "spanish": "Flexion amplia de pie D", "group": "standing"},
    {"slug": "parsvottanasana", "sanskrit": "Parsvottanasana", "spanish": "Estiramiento lateral intenso", "group": "standing"},
    {"slug": "utthita-hasta-padangusthasana", "sanskrit": "Utthita Hasta Padangusthasana", "spanish": "Pierna extendida tomada", "group": "standing"},
    {"slug": "ardha-baddha-padmottanasana", "sanskrit": "Ardha Baddha Padmottanasana", "spanish": "Medio loto de pie", "group": "standing"},
    {"slug": "utkatasana", "sanskrit": "Utkatasana", "spanish": "Silla", "group": "standing"},
    {"slug": "virabhadrasana-a", "sanskrit": "Virabhadrasana A", "spanish": "Guerrero I", "group": "standing"},
    {"slug": "virabhadrasana-b", "sanskrit": "Virabhadrasana B", "spanish": "Guerrero II", "group": "standing"},
    {"slug": "dandasana", "sanskrit": "Dandasana", "spanish": "Baston", "group": "seated"},
    {"slug": "paschimottanasana", "sanskrit": "Paschimottanasana", "spanish": "Pinza sentada", "group": "seated"},
    {"slug": "purvottanasana", "sanskrit": "Purvottanasana", "spanish": "Estiramiento anterior", "group": "seated"},
    {"slug": "ardha-baddha-padma-paschimottanasana", "sanskrit": "Ardha Baddha Padma Paschimottanasana", "spanish": "Medio loto sentado", "group": "seated"},
    {"slug": "triang-mukhaikapada-paschimottanasana", "sanskrit": "Triang Mukhaikapada Paschimottanasana", "spanish": "Una pierna doblada", "group": "seated"},
    {"slug": "janu-sirsasana-a", "sanskrit": "Janu Sirsasana A", "spanish": "Cabeza a rodilla A", "group": "seated"},
    {"slug": "janu-sirsasana-b", "sanskrit": "Janu Sirsasana B", "spanish": "Cabeza a rodilla B", "group": "seated"},
    {"slug": "janu-sirsasana-c", "sanskrit": "Janu Sirsasana C", "spanish": "Cabeza a rodilla C", "group": "seated"},
    {"slug": "marichyasana-a", "sanskrit": "Marichyasana A", "spanish": "Postura de Marichi A", "group": "seated"},
    {"slug": "marichyasana-b", "sanskrit": "Marichyasana B", "spanish": "Postura de Marichi B", "group": "seated"},
    {"slug": "marichyasana-c", "sanskrit": "Marichyasana C", "spanish": "Postura de Marichi C", "group": "seated"},
    {"slug": "marichyasana-d", "sanskrit": "Marichyasana D", "spanish": "Postura de Marichi D", "group": "seated"},
    {"slug": "navasana", "sanskrit": "Navasana", "spanish": "Barco", "group": "seated"},
    {"slug": "bhuja-pidasana", "sanskrit": "Bhuja Pidasana", "spanish": "Presion en brazos", "group": "arm-balance"},
    {"slug": "kurmasana", "sanskrit": "Kurmasana", "spanish": "Tortuga", "group": "seated"},
    {"slug": "supta-kurmasana", "sanskrit": "Supta Kurmasana", "spanish": "Tortuga reclinada", "group": "seated"},
    {"slug": "garbha-pindasana", "sanskrit": "Garbha Pindasana", "spanish": "Embrion", "group": "seated"},
    {"slug": "kukutasana", "sanskrit": "Kukutasana", "spanish": "Gallo", "group": "arm-balance"},
    {"slug": "baddha-konasana-a", "sanskrit": "Baddha Konasana A", "spanish": "Angulo cerrado A", "group": "seated"},
    {"slug": "baddha-konasana-b", "sanskrit": "Baddha Konasana B", "spanish": "Angulo cerrado B", "group": "seated"},
    {"slug": "upavistha-konasana-a", "sanskrit": "Upavistha Konasana A", "spanish": "Angulo abierto A", "group": "seated"},
    {"slug": "upavistha-konasana-b", "sanskrit": "Upavistha Konasana B", "spanish": "Angulo abierto B", "group": "seated"},
    {"slug": "supta-konasana", "sanskrit": "Supta Konasana", "spanish": "Angulo reclinado", "group": "finishing"},
    {"slug": "supta-padangusthasana", "sanskrit": "Supta Padangusthasana", "spanish": "Pierna tomada acostado", "group": "finishing"},
    {"slug": "ubhaya-padangusthasana", "sanskrit": "Ubhaya Padangusthasana", "spanish": "Ambos pulgares de los pies", "group": "finishing"},
    {"slug": "urdhva-mukha-paschimottanasana", "sanskrit": "Urdhva Mukha Paschimottanasana", "spanish": "Pinza hacia arriba", "group": "finishing"},
    {"slug": "setu-bandhasana", "sanskrit": "Setu Bandhasana", "spanish": "Puente", "group": "finishing"},
    {"slug": "urdhva-dhanurasana", "sanskrit": "Urdhva Dhanurasana", "spanish": "Rueda", "group": "backbend"},
    {"slug": "sarvangasana", "sanskrit": "Sarvangasana", "spanish": "Vela", "group": "finishing"},
    {"slug": "halasana", "sanskrit": "Halasana", "spanish": "Arado", "group": "finishing"},
    {"slug": "karnapidasana", "sanskrit": "Karnapidasana", "spanish": "Presion de orejas", "group": "finishing"},
    {"slug": "urdhva-padmasana", "sanskrit": "Urdhva Padmasana", "spanish": "Loto elevado", "group": "finishing"},
    {"slug": "pindasana", "sanskrit": "Pindasana", "spanish": "Embrion en loto", "group": "finishing"},
    {"slug": "matsyasana", "sanskrit": "Matsyasana", "spanish": "Pez", "group": "finishing"},
    {"slug": "uttana-padasana", "sanskrit": "Uttana Padasana", "spanish": "Piernas extendidas", "group": "finishing"},
    {"slug": "sirsasana", "sanskrit": "Sirsasana", "spanish": "Parado de cabeza", "group": "finishing"},
    {"slug": "baddha-padmasana", "sanskrit": "Baddha Padmasana", "spanish": "Loto atado", "group": "finishing"},
    {"slug": "yoga-mudra", "sanskrit": "Yoga Mudra", "spanish": "Sello de yoga", "group": "finishing"},
    {"slug": "padmasana", "sanskrit": "Padmasana", "spanish": "Loto", "group": "finishing"},
    {"slug": "utpluthih", "sanskrit": "Utpluthih", "spanish": "Elevacion final", "group": "finishing"},
    {"slug": "savasana", "sanskrit": "Savasana", "spanish": "Descanso", "group": "finishing"},
]


def asana(slug):
    return next(item for item in PRIMARY_SERIES if item["slug"] == slug)


def infer_pose(video):
    """Initial visual tagging from reviewed thumbnails, dates, sequence, and known Ashtanga order."""
    vid = int(video["id"])
    date = (video.get("parsed_date") or video.get("modified") or "")[:10]
    name = video["name"].lower()
    tags = set()
    confidence = "low"
    pose_slugs = []

    if date == "2025-03-29":
        pose_slugs = ["utthita-hasta-padangusthasana"] if vid in {2207, 2208, 2209, 2210, 2211} else []
        tags.update(["standing", "balance", "leg-extension", "demo"])
        confidence = "medium"
    elif date == "2025-06-08":
        if vid in {2268, 2269, 2270, 2271, 2272, 2273, 4160, 4161}:
            pose_slugs = ["utthita-hasta-padangusthasana", "virabhadrasana-a"]
            tags.update(["standing", "balance", "teaching", "assist"])
            confidence = "medium"
    elif date in {"2025-06-21", "2025-06-22"}:
        if vid in {4179, 4180, 4181, 4182, 4184, 4185, 4186, 4190, 4191, 4195, 4197, 4198, 2280, 2281}:
            pose_slugs = ["prasarita-padottanasana-a", "utthita-parsvakonasana"]
            tags.update(["standing", "wide-leg", "assist", "group-practice"])
        elif vid in {4183, 4187, 4188, 4189, 4192, 4193, 4194, 4196, 2276, 2277, 2278, 2279}:
            pose_slugs = ["padangusthasana", "padahastasana", "utthita-hasta-padangusthasana"]
            tags.update(["standing", "forward-fold", "balance", "demo"])
        else:
            pose_slugs = ["prasarita-padottanasana-a"]
            tags.update(["standing", "group-practice"])
        confidence = "medium"
    elif date == "2025-08-10":
        if vid in {4303, 4304, 4305, 4309, 4310, 4311}:
            pose_slugs = ["navasana", "baddha-konasana-a", "upavistha-konasana-a"]
            tags.update(["seated", "core", "hip-opening", "group-practice"])
        elif vid in {4288, 4289, 4290, 4291, 4292, 4295, 4296, 4297, 4301, 4302, 4306}:
            pose_slugs = ["janu-sirsasana-a", "marichyasana-a", "paschimottanasana"]
            tags.update(["seated", "forward-fold", "assist"])
        elif vid in {4294, 4298, 4299, 4300, 4307, 4308}:
            pose_slugs = ["utthita-hasta-padangusthasana", "virabhadrasana-a"]
            tags.update(["standing", "demo", "transition"])
        else:
            pose_slugs = ["paschimottanasana"]
            tags.update(["seated", "forward-fold"])
        confidence = "medium"
    elif date in {"2025-08-30", "2025-08-31"}:
        if vid in {4327, 4331, 4333, 4334, 4337, 4338, 4340, 4348, 4351, 4352, 4353, 4354, 4356, 89}:
            pose_slugs = ["paschimottanasana", "janu-sirsasana-a", "marichyasana-a"]
            tags.update(["seated", "forward-fold", "group-practice"])
        elif vid in {4328, 4329, 4330, 4335, 4336, 4339, 4341, 4342, 4343, 2071, 2072, 2073}:
            pose_slugs = ["baddha-konasana-a", "upavistha-konasana-a", "supta-padangusthasana"]
            tags.update(["hip-opening", "assist", "floor-work"])
        elif vid in {4332, 4344, 4345, 4346, 4347, 4349, 4350, 2325, 2326, 2327, 2328, 2329, 2330, 88}:
            pose_slugs = ["navasana", "kurmasana", "bhuja-pidasana"]
            tags.update(["core", "arm-balance", "assist", "floor-work"])
        else:
            pose_slugs = ["paschimottanasana"]
            tags.update(["seated", "assist"])
        confidence = "medium"

    if "wa00" in name:
        tags.add("whatsapp-batch")
    if video.get("orientation"):
        tags.add(video["orientation"])
    if video.get("duration_sec") and video["duration_sec"] <= 20:
        tags.add("short-clip")
    if not pose_slugs:
        pose_slugs = ["asana-review"]
        tags.add("needs-review")
        confidence = "low"

    poses = []
    for slug in pose_slugs:
        if slug == "asana-review":
            poses.append({"slug": slug, "sanskrit": "Por revisar", "spanish": "Etiqueta pendiente", "group": "review"})
        else:
            poses.append(asana(slug))
    return poses, sorted(tags), confidence


def main():
    index = json.loads(INDEX_JSON.read_text(encoding="utf-8"))["videos"]
    cert = json.loads(CERT_JSON.read_text(encoding="utf-8"))
    ids = {int(i) for i in cert["tagged_ids"]}
    PUBLIC_THUMBS.mkdir(parents=True, exist_ok=True)

    videos = []
    for video in index:
        if int(video["id"]) not in ids:
            continue
        thumb_src = THUMB_DIR / f"{int(video['id']):05d}.jpg"
        public_thumb = PUBLIC_THUMBS / f"{int(video['id']):05d}.jpg"
        if thumb_src.exists():
            shutil.copy2(thumb_src, public_thumb)
        poses, posture_tags, confidence = infer_pose(video)
        videos.append(
            {
                "id": str(video["id"]),
                "title": video["name"],
                "date": (video.get("parsed_date") or video.get("modified") or "")[:10],
                "source": video["source"],
                "durationSec": video.get("duration_sec"),
                "durationLabel": video.get("duration_label", ""),
                "orientation": video.get("orientation", ""),
                "sizeMb": video.get("size_mb", 0),
                "width": video.get("display_width"),
                "height": video.get("display_height"),
                "thumbnail": f"/thumbs/{int(video['id']):05d}.jpg",
                "localVideoPath": video["flat_path"],
                "videoFileName": Path(video["flat_path"]).name,
                "remoteKey": f"certificacion-2025/{Path(video['flat_path']).name}",
                "playbackUrl": f"/api/videos/{video['id']}",
                "poses": poses,
                "tags": sorted(set(["certificacion-2025", *posture_tags])),
                "tagConfidence": confidence,
                "notes": "Etiquetado inicial visual; revisar y ajustar si el frame contiene transicion o asistencia.",
            }
        )

    videos.sort(key=lambda item: (item["date"], int(item["id"])))
    counts_by_date = Counter(v["date"] for v in videos)
    counts_by_pose = Counter(pose["slug"] for v in videos for pose in v["poses"])
    sessions = defaultdict(list)
    for video in videos:
        sessions[video["date"]].append(video["id"])

    payload = {
        "generatedAt": "2026-07-05",
        "storageStrategy": {
            "localDev": "The Next.js API streams local files from localVideoPath.",
            "production": "Upload videos to object storage/CDN and set NEXT_PUBLIC_VIDEO_BASE_URL. Keep only metadata and thumbnails in Vercel.",
            "recommended": "Cloudflare R2 + public/custom domain, S3 + CloudFront, or Mux for transcoding and adaptive streaming.",
        },
        "primarySeries": PRIMARY_SERIES,
        "stats": {
            "count": len(videos),
            "totalMb": round(sum(v.get("sizeMb") or 0 for v in videos), 2),
            "byDate": dict(sorted(counts_by_date.items())),
            "byPose": dict(counts_by_pose.most_common()),
        },
        "sessions": [{"date": date, "videoIds": ids} for date, ids in sorted(sessions.items())],
        "videos": videos,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["stats"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
