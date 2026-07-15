# ============================================================
# backend/services/db_service.py
# ============================================================
from sqlalchemy.orm import Session
from datetime import datetime

# Importamos los modelos directamente gracias al volumen compartido de Docker
from app.models.models import AnalisisMedia, ResultadoResumen, DeteccionYolo


def obtener_analisis_pendiente(db: Session):
    """Busca el registro más antiguo que aún esté en estado Pendiente."""
    return (
        db.query(AnalisisMedia)
        .filter(AnalisisMedia.estado_procesamiento == "Pendiente")
        .order_by(AnalisisMedia.fecha_subida.asc())
        .first()
    )


def actualizar_estado(db: Session, id_analisis: int, nuevo_estado: str):
    """Actualiza rápidamente el estado de un análisis (ej. a 'Procesando')."""
    analisis = db.query(AnalisisMedia).filter(AnalisisMedia.id_analisis == id_analisis).first()
    if analisis:
        analisis.estado_procesamiento = nuevo_estado
        db.commit()
        db.refresh(analisis)
    return analisis


def guardar_resultados_y_terminar(db: Session, id_analisis: int, resultados: dict):
    """
    Guarda todas las métricas devueltas por RunPod y marca el análisis 
    como 'Terminado'. Se asume un modelo YOLO multiclases puro.
    """
    # 1. Actualizar el registro principal con la nueva ruta
    analisis = db.query(AnalisisMedia).filter(AnalisisMedia.id_analisis == id_analisis).first()
    if analisis:
        analisis.estado_procesamiento = "Terminado"
        analisis.fecha_completado = datetime.utcnow()
        analisis.ruta_archivo_procesado = resultados.get("ruta_video_final")

    # 2. Guardar el resumen general de la inferencia
    nuevo_resumen = ResultadoResumen(
        id_analisis=id_analisis,
        total_frutos_detectados=resultados.get("total_frutos", 0),
        etapa_predominante=resultados.get("etapa_predominante", "Desconocida")
    )
    db.add(nuevo_resumen)

    # 3. Guardar las detecciones individuales (Bounding Boxes) frame por frame
    for det in resultados.get("detecciones", []):
        nueva_deteccion = DeteccionYolo(
            id_analisis=id_analisis,
            numero_frame=det.get("frame"),
            clase_detectada=det.get("clase"),
            confianza=det.get("confianza"),
            bbox_x=det.get("x"),
            bbox_y=det.get("y"),
            bbox_width=det.get("w"),
            bbox_height=det.get("h")
        )
        db.add(nueva_deteccion)

    # Confirmamos todos los cambios en bloque
    db.commit()