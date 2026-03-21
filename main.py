from __future__ import annotations

import os
import time
import uuid
from typing import Optional

import boto3
from botocore.config import Config
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import DateTime, String, Text, create_engine, func, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column
from fastapi.middleware.cors import CORSMiddleware

# =========================
# CONFIG
# =========================


load_dotenv()

def load_config():
    config = {
        "R2_ACCOUNT_ID": os.getenv("R2_ACCOUNT_ID", ""),
        "R2_ACCESS_KEY_ID": os.getenv("R2_ACCESS_KEY_ID", ""),
        "R2_SECRET_ACCESS_KEY": os.getenv("R2_SECRET_ACCESS_KEY", ""),
        "R2_BUCKET": os.getenv("R2_BUCKET", ""),
        "R2_ENDPOINT": os.getenv("R2_ENDPOINT", ""),
        "PORT": int(os.getenv("PORT", "8787")),
        "CORS_ORIGIN": os.getenv("CORS_ORIGIN", "*"),
        "DATABASE_URL": os.getenv("DATABASE_URL", "sqlite:///./app.db"),
    }

    missing = [k for k, v in config.items() if not v and "R2" in k]

    print("\n=== CONFIG DEBUG ===")
    for k, v in config.items():
        if "SECRET" in k:
            print(f"{k}: ***")
        else:
            print(f"{k}: {v}")
    print("Missing:", missing)
    print("====================\n")

    return config, missing


CONFIG, MISSING = load_config()

# =========================
# S3 (R2)
# =========================



def create_s3_client():
    print("=== INITIALIZING S3 CLIENT ===")
    print("Endpoint:", CONFIG["R2_ENDPOINT"])
    print("Access Key ID:", CONFIG["R2_ACCESS_KEY_ID"])
    print("Bucket:", CONFIG["R2_BUCKET"])
    print("===============================")

    client = boto3.client(
        "s3",
        endpoint_url=CONFIG["R2_ENDPOINT"],
        aws_access_key_id=CONFIG["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=CONFIG["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            s3={
                "addressing_style": "path"  # Crucial para Cloudflare R2
            }
        ),
    )

    print("S3 client ready ✅\n")
    return client

s3 = create_s3_client()

# =========================
# DATABASE
# =========================

class Base(DeclarativeBase):
    pass


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    edad: Mapped[Optional[str]] = mapped_column(String(16))
    sexo: Mapped[Optional[str]] = mapped_column(String(32))
    tipo_voz: Mapped[Optional[str]] = mapped_column(String(32))
    estilo: Mapped[Optional[str]] = mapped_column(String(32))
    estilo_otro: Mapped[Optional[str]] = mapped_column(String(64))
    phrase_text: Mapped[Optional[str]] = mapped_column(Text)
    audio_key: Mapped[str] = mapped_column(String(256))
    audio_bucket: Mapped[str] = mapped_column(String(128))
    audio_content_type: Mapped[str] = mapped_column(String(128))
    audio_size_bytes: Mapped[int] = mapped_column(Integer, default=0)


def init_db():
    print("Initializing DB...")
    connect_args = {"check_same_thread": False} if CONFIG["DATABASE_URL"].startswith("sqlite") else {}
    engine = create_engine(CONFIG["DATABASE_URL"], connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    print("DB ready\n")
    return engine


engine = init_db()

# =========================
# APP
# =========================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://erjavectaibi.github.io"],  # tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# HELPERS
# =========================

def generate_key(content_type: str) -> str:
    ext = "webm" if "webm" in content_type else "bin"
    return f"uploads/{int(time.time())}-{uuid.uuid4()}.{ext}"


async def upload_to_r2(file: UploadFile, key: str):
    print("\n=== UPLOAD DEBUG ===")
    print("Filename:", file.filename)
    print("Content-Type:", file.content_type)

    body = await file.read()
    print("Size (bytes):", len(body))

    try:
        s3.put_object(
            Bucket=CONFIG["R2_BUCKET"],
            Key=key,
            Body=body,
            ContentType=file.content_type or "application/octet-stream",
        )
        print("Upload SUCCESS")
    except Exception as e:
        print("Upload FAILED:", str(e))
        raise e

    print("====================\n")

    return body


def save_submission(data: dict, key: str, content_type: str, size: int):
    print("Saving to DB...")

    submission_id = str(uuid.uuid4())

    with Session(engine) as session:
        submission = Submission(
            id=submission_id,
            edad=data.get("edad"),
            sexo=data.get("sexo"),
            tipo_voz=data.get("tipo_voz"),
            estilo=data.get("estilo"),
            estilo_otro=data.get("estilo_otro"),
            phrase_text=data.get("phrase_text"),
            audio_key=key,
            audio_bucket=CONFIG["R2_BUCKET"],
            audio_content_type=content_type,
            audio_size_bytes=size,
        )
        session.add(submission)
        session.commit()

    print("DB saved:", submission_id, "\n")
    return submission_id


# =========================
# ROUTES
# =========================

@app.get("/api/health")
async def health():
    return {"ok": True}


@app.post("/api/upload")
async def upload(
    audio: UploadFile = File(...),
    edad: Optional[str] = Form(None),
    sexo: Optional[str] = Form(None),
    tipo_voz: Optional[str] = Form(None),
    estilo: Optional[str] = Form(None),
    estilo_otro: Optional[str] = Form(None),
    phrase_text: Optional[str] = Form(None),
):
    print("\n=== NEW REQUEST ===")

    if MISSING:
        print("Missing env:", MISSING)
        return JSONResponse(status_code=500, content={"error": "missing_env", "missing": MISSING})

    if not audio:
        print("No audio received")
        return JSONResponse(status_code=400, content={"error": "missing_audio"})

    key = generate_key(audio.content_type or "")
    print("Generated key:", key)

    try:
        body = await upload_to_r2(audio, key)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    submission_id = save_submission(
        {
            "edad": edad,
            "sexo": sexo,
            "tipo_voz": tipo_voz,
            "estilo": estilo,
            "estilo_otro": estilo_otro,
            "phrase_text": phrase_text,
        },
        key,
        audio.content_type or "",
        len(body),
    )

    return {
        "ok": True,
        "id": submission_id,
        "key": key,
    }


# =========================
# STATIC
# =========================

app.mount("/", StaticFiles(directory=".", html=True), name="static")


# =========================
# RUN
# =========================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=CONFIG["PORT"], reload=True)