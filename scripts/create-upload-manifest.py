import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_JSON = ROOT / "src" / "data" / "certification-videos.json"
OUT_JSON = ROOT / "certification-video-upload-manifest.json"


def main():
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    uploads = [
        {
            "id": video["id"],
            "title": video["title"],
            "date": video["date"],
            "localPath": video["localVideoPath"],
            "remoteKey": video["remoteKey"],
            "sizeMb": video["sizeMb"],
        }
        for video in data["videos"]
    ]
    payload = {
        "count": len(uploads),
        "totalMb": round(sum(item["sizeMb"] for item in uploads), 2),
        "targetBaseEnv": "NEXT_PUBLIC_VIDEO_BASE_URL",
        "uploads": uploads,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT_JSON)


if __name__ == "__main__":
    main()
