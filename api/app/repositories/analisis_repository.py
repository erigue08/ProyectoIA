# ============================================================
# repositories/analisis_repository.py
# ============================================================
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import AnalisisMedia, ResultadoResumen, DeteccionYolo

def _obtener_analisis_o_404(id_analisis: int, db: Session) -> AnalisisMedia:
    """Función auxiliar para recuperar un análisis o lanzar un 404."""
    analisis = db.query(AnalisisMedia).filter(AnalisisMedia.id_analisis == id_analisis).first()
    if not analisis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Análisis no encontrado.")
    return analisis

def guardar_nuevo_analisis(db: Session, nuevo_analisis: AnalisisMedia):
    db.add(nuevo_analisis)
    db.commit()
    db.refresh(nuevo_analisis)
    return nuevo_analisis

def obtener_historial_usuario(id_usuario: int, db: Session):
    return (
        db.query(AnalisisMedia)
        .filter(AnalisisMedia.id_usuario == id_usuario)
        .order_by(AnalisisMedia.fecha_subida.desc())
        .all()
    )

def eliminar_analisis_db(id_analisis: int, db: Session):
    analisis = _obtener_analisis_o_404(id_analisis, db)
    db.delete(analisis)
    db.commit()

def obtener_resumen_db(id_analisis: int, db: Session):
    return (
        db.query(ResultadoResumen)
        .filter(ResultadoResumen.id_analisis == id_analisis)
        .first()
    )

def obtener_detecciones_db(id_analisis: int, db: Session):
    return (
        db.query(DeteccionYolo)
        .filter(DeteccionYolo.id_analisis == id_analisis)
        .all()
    )