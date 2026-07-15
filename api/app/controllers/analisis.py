# ============================================================
# controllers/analisis.py
# Endpoints del módulo de Análisis de Cacao: subida de archivos,
# historial, eliminación, consulta de resultados y exportación
# de reportes en PDF/Excel.
# ============================================================
from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import AnalisisHistorialItem, ResultadosCompletos, ResumenResultado, DeteccionItem
from app.services import analisis_service
from app.repositories import analisis_repository

router = APIRouter(prefix="/analisis", tags=["Análisis de Cacao"])

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
    nuevo_analisis = analisis_service.procesar_subida(id_usuario, archivo, db)

    return {
        "mensaje": "Archivo subido correctamente. Pendiente de procesamiento.",
        "id_analisis": nuevo_analisis.id_analisis,
        "ruta_archivo": nuevo_analisis.ruta_archivo,
    }

@router.get("/historial/{id_usuario}", response_model=list[AnalisisHistorialItem])
def obtener_historial(id_usuario: int, db: Session = Depends(get_db)):
    """Devuelve el listado de análisis de un usuario para el dashboard."""
    return analisis_repository.obtener_historial_usuario(id_usuario, db)

@router.delete("/{id_analisis}", status_code=status.HTTP_200_OK)
def eliminar_analisis(id_analisis: int, db: Session = Depends(get_db)):
    """Elimina el registro de un análisis de la base de datos."""
    analisis_repository.eliminar_analisis_db(id_analisis, db)
    return {"mensaje": f"Análisis {id_analisis} eliminado correctamente."}

@router.get("/{id_analisis}/resultados", response_model=ResultadosCompletos)
def obtener_resultados(id_analisis: int, db: Session = Depends(get_db)):
    """
    Devuelve un JSON anidado combinando el resumen de métricas
    (Resultados_Resumen) y el detalle de bounding boxes (Detecciones_YOLO).
    """
    analisis = analisis_repository._obtener_analisis_o_404(id_analisis, db)

    resumen_db = analisis_repository.obtener_resumen_db(id_analisis, db)
    detecciones_db = analisis_repository.obtener_detecciones_db(id_analisis, db)

    return ResultadosCompletos(
        resumen=ResumenResultado.model_validate(resumen_db) if resumen_db else None,
        detecciones=[DeteccionItem.model_validate(d) for d in detecciones_db],
        ruta_archivo_procesado=analisis.ruta_archivo_procesado,
        nombre_archivo=analisis.nombre_archivo,
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
    buffer, nombre_archivo, media_type = analisis_service.procesar_exportacion(id_analisis, formato, db)

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )