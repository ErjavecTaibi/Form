from __future__ import annotations

import os
import time
import uuid
from typing import Optional

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import DateTime, String, Text, create_engine, func, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

load_dotenv()

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.getenv("R2_BUCKET", "")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
PORT = int(os.getenv("PORT", "8787"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

missing = [
    key
    for key, value in [
        ("R2_ACCOUNT_ID", R2_ACCOUNT_ID),
        ("R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID),
        ("R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY),
        ("R2_BUCKET", R2_BUCKET),
        ("R2_ENDPOINT", R2_ENDPOINT),
    ]
    if not value
]

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT or None,
    aws_access_key_id=R2_ACCESS_KEY_ID or None,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY or None,
    region_name="auto",
)


class Base(DeclarativeBase):
    pass


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    edad: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    sexo: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    tipo_voz: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    estilo: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    estilo_otro: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    phrase_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audio_key: Mapped[str] = mapped_column(String(256))
    audio_bucket: Mapped[str] = mapped_column(String(128))
    audio_content_type: Mapped[str] = mapped_column(String(128))
    audio_size_bytes: Mapped[int] = mapped_column(Integer, default=0)


connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN] if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    if missing:
        return JSONResponse(
            status_code=500, content={"error": "missing_env", "missing": missing}
        )

    if not audio:
        return JSONResponse(status_code=400, content={"error": "missing_audio"})

    content_type = audio.content_type or "application/octet-stream"
    extension = "webm" if content_type == "audio/webm" else "bin"
    key = f"uploads/{int(time.time())}-{uuid.uuid4()}.{extension}"

    body = await audio.read()

    s3.put_object(
        Bucket=R2_BUCKET,
        Key=key,
        Body=body,
        ContentType=content_type,
        Metadata={
            "edad": str(edad or ""),
            "sexo": str(sexo or ""),
            "tipo_voz": str(tipo_voz or ""),
            "estilo": str(estilo or ""),
            "estilo_otro": str(estilo_otro or ""),
            "phrase": str(phrase_text or ""),
        },
    )

    submission_id = str(uuid.uuid4())
    with Session(engine) as session:
        submission = Submission(
            id=submission_id,
            edad=edad,
            sexo=sexo,
            tipo_voz=tipo_voz,
            estilo=estilo,
            estilo_otro=estilo_otro,
            phrase_text=phrase_text,
            audio_key=key,
            audio_bucket=R2_BUCKET,
            audio_content_type=content_type,
            audio_size_bytes=len(body),
        )
        session.add(submission)
        session.commit()

    return {"ok": True, "id": submission_id, "key": key, "bucket": R2_BUCKET}


# Optional: serve the frontend locally
app.mount("/", StaticFiles(directory=".", html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
