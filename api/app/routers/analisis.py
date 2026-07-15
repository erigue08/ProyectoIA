# ============================================================
# routers/analisis.py
# Endpoints del módulo de Análisis de Cacao: subida de archivos,
# historial, eliminación, consulta de resultados y exportación
# de reportes en PDF/Excel.
# ============================================================
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnalisisMedia, ResultadoResumen, DeteccionYolo
from app.schemas import AnalisisHistorialItem, ResultadosCompletos, ResumenResultado, DeteccionItem
from app.reports import generar_pdf_reporte, generar_excel_reporte

router = APIRouter(prefix="/analisis", tags=["Análisis de Cacao"])

# Directorio físico donde se guardan los archivos multimedia de análisis.
DIRECTORIO_ANALISIS = "/uploads/analisis"
os.makedirs(DIRECTORIO_ANALISIS, exist_ok=True)

# Extensiones permitidas para clasificar el tipo de media
EXTENSIONES_VIDEO = {".mp4", ".avi", ".mov", ".mkv"}


def _obtener_analisis_o_404(id_analisis: int, db: Session) -> AnalisisMedia:
    """Función auxiliar para recuperar un análisis o lanzar un 404."""
    analisis = db.query(AnalisisMedia).filter(AnalisisMedia.id_analisis == id_analisis).first()
    if not analisis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Análisis no encontrado.")
    return analisis


@router.post("/subir", status_code=status.HTTP_201_CREATED)
def subir_analisis(
    id_usuario: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Recibe un archivo multimedia (video o imagen), lo guarda
    físicamente en disco y crea el registro correspondiente en
    la tabla Analisis_Media con estado "Pendiente".
    """
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
    db.add(nuevo_analisis)
    db.commit()
    db.refresh(nuevo_analisis)

    return {
        "mensaje": "Archivo subido correctamente. Pendiente de procesamiento.",
        "id_analisis": nuevo_analisis.id_analisis,
        "ruta_archivo": nuevo_analisis.ruta_archivo,
    }


@router.get("/historial/{id_usuario}", response_model=list[AnalisisHistorialItem])
def obtener_historial(id_usuario: int, db: Session = Depends(get_db)):
    """Devuelve el listado de análisis de un usuario para el dashboard."""
    historial = (
        db.query(AnalisisMedia)
        .filter(AnalisisMedia.id_usuario == id_usuario)
        .order_by(AnalisisMedia.fecha_subida.desc())
        .all()
    )
    return historial


@router.delete("/{id_analisis}", status_code=status.HTTP_200_OK)
def eliminar_analisis(id_analisis: int, db: Session = Depends(get_db)):
    """Elimina el registro de un análisis de la base de datos."""
    analisis = _obtener_analisis_o_404(id_analisis, db)
    db.delete(analisis)
    db.commit()
    return {"mensaje": f"Análisis {id_analisis} eliminado correctamente."}


@router.get("/{id_analisis}/resultados", response_model=ResultadosCompletos)
def obtener_resultados(id_analisis: int, db: Session = Depends(get_db)):
    """
    Devuelve un JSON anidado combinando el resumen de métricas
    (Resultados_Resumen) y el detalle de bounding boxes (Detecciones_YOLO).
    """
    _obtener_analisis_o_404(id_analisis, db)

    resumen_db = (
        db.query(ResultadoResumen)
        .filter(ResultadoResumen.id_analisis == id_analisis)
        .first()
    )
    detecciones_db = (
        db.query(DeteccionYolo)
        .filter(DeteccionYolo.id_analisis == id_analisis)
        .all()
    )

    return ResultadosCompletos(
        resumen=ResumenResultado.model_validate(resumen_db) if resumen_db else None,
        detecciones=[DeteccionItem.model_validate(d) for d in detecciones_db],
    )


@router.get("/{id_analisis}/exportar")
def exportar_reporte(
    id_analisis: int,
    formato: str = Query(..., pattern="^(pdf|excel)$", description="Formato de exportación: pdf o excel"),
    db: Session = Depends(get_db),
):
    """
    Genera dinámicamente un archivo PDF o Excel con los resultados
    del análisis y lo devuelve como descarga directa al navegador.
    """
    analisis = _obtener_analisis_o_404(id_analisis, db)

    resumen = (
        db.query(ResultadoResumen)
        .filter(ResultadoResumen.id_analisis == id_analisis)
        .first()
    )
    detecciones = (
        db.query(DeteccionYolo)
        .filter(DeteccionYolo.id_analisis == id_analisis)
        .all()
    )

    if formato == "pdf":
        buffer = generar_pdf_reporte(analisis, resumen, detecciones)
        nombre_archivo = f"reporte_analisis_{id_analisis}.pdf"
        media_type = "application/pdf"
    else:  # formato == "excel"
        buffer = generar_excel_reporte(analisis, resumen, detecciones)
        nombre_archivo = f"reporte_analisis_{id_analisis}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )
