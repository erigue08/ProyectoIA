# ============================================================
# main.py
# Punto de entrada de la API "Cacao Analysis".
# Este contenedor actúa como el enrutador principal de la
# plataforma: no ejecuta modelos de IA, sino que gestiona
# usuarios, sube/consulta análisis y genera reportes.
# ============================================================
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import usuarios, analisis

# ------------------------------------------------------------
# Directorio físico de uploads (compartido como volumen Docker
# entre este contenedor y, potencialmente, el de Modelos IA).
# ------------------------------------------------------------
DIRECTORIO_UPLOADS = "/uploads"
os.makedirs(DIRECTORIO_UPLOADS, exist_ok=True)

app = FastAPI(
    title="Cacao Analysis - API",
    description="Servicio de enrutamiento, gestión de usuarios, análisis y reportes de la plataforma Cacao Analysis.",
    version="1.0.0",
)

# ------------------------------------------------------------
# CORS: se permite cualquier origen para facilitar la
# integración con el Frontend en React durante el desarrollo.
# En producción se recomienda restringir 'allow_origins' a los
# dominios reales del Frontend.
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Montaje de archivos estáticos: permite que el Frontend acceda
# directamente a las imágenes/videos subidos mediante una URL,
# por ejemplo: http://api/static/uploads/analisis/archivo.mp4
# ------------------------------------------------------------
app.mount("/static/uploads", StaticFiles(directory=DIRECTORIO_UPLOADS), name="uploads")

# ------------------------------------------------------------
# Registro de routers modulares
# ------------------------------------------------------------
app.include_router(usuarios.router)
app.include_router(analisis.router)


@app.get("/", tags=["Estado del servicio"])
def verificar_estado():
    """Endpoint de verificación básica de que la API está en línea."""
    return {"servicio": "Cacao Analysis API", "estado": "operativo"}
