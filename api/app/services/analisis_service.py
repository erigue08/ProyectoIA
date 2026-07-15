# ============================================================
# services/analisis_service.py
# ============================================================
import os
import shutil
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.models import AnalisisMedia
from app.services.report_service import generar_pdf_reporte, generar_excel_reporte
from app.repositories import analisis_repository

# Directorio físico donde se guardan los archivos multimedia de análisis.
DIRECTORIO_ANALISIS = "/uploads/analisis"
os.makedirs(DIRECTORIO_ANALISIS, exist_ok=True)

# Extensiones permitidas para clasificar el tipo de media
EXTENSIONES_VIDEO = {".mp4", ".avi", ".mov", ".mkv"}

def procesar_subida(id_usuario: int, archivo: UploadFile, db: Session):
    extension = os.path.splitext(archivo.filename)[1].lower()
    tipo_media = "video" if extension in EXTENSIONES_VIDEO else "imagen"

    nombre_archivo_unico = f"{uuid.uuid4().hex}{extension}"
    ruta_destino = os.path.join(DIRECTORIO_ANALISIS, nombre_archivo_unico)

    with open(ruta_destino, "wb") as buffer_destino:
        shutil.copyfileobj(archivo.file, buffer_destino)

    nuevo_analisis = AnalisisMedia(
        id_usuario=id_usuario,
        nombre_archivo=archivo.filename,
        ruta_archivo=ruta_destino,
        tipo_media=tipo_media,
        estado_procesamiento="Pendiente",
    )
    return analisis_repository.guardar_nuevo_analisis(db, nuevo_analisis)

def procesar_exportacion(id_analisis: int, formato: str, db: Session):
    analisis = analisis_repository._obtener_analisis_o_404(id_analisis, db)
    resumen = analisis_repository.obtener_resumen_db(id_analisis, db)
    detecciones = analisis_repository.obtener_detecciones_db(id_analisis, db)

    if formato == "pdf":
        buffer = generar_pdf_reporte(analisis, resumen, detecciones)
        nombre_archivo = f"reporte_analisis_{id_analisis}.pdf"
        media_type = "application/pdf"
    else:  # formato == "excel"
        buffer = generar_excel_reporte(analisis, resumen, detecciones)
        nombre_archivo = f"reporte_analisis_{id_analisis}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return buffer, nombre_archivo, media_type