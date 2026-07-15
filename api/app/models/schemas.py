# ============================================================
# schemas.py
# Esquemas Pydantic usados para validar los datos que entran
# y salen de la API (separados de los modelos ORM siguiendo el
# principio de responsabilidad única - SOLID).
# ============================================================
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict


# ------------------------- Usuarios -------------------------
class UsuarioRegistro(BaseModel):
    nombre_completo: str
    nombre_usuario: str
    correo_electronico: EmailStr
    contrasena: str


class UsuarioLogin(BaseModel):
    nombre_usuario: str
    contrasena: str


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    nombre_completo: str
    nombre_usuario: str
    correo_electronico: EmailStr
    url_foto_perfil: Optional[str] = None
    fecha_creacion: datetime


# ------------------------- Análisis -------------------------
class AnalisisHistorialItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_analisis: int
    nombre_archivo: str
    estado_procesamiento: str
    fecha_subida: datetime
    ruta_archivo_procesado: Optional[str] = None


class ResumenResultado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_frutos_detectados: int
    porcentaje_sanos: float
    porcentaje_enfermos: float
    etapa_predominante: Optional[str] = None


class DeteccionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    numero_frame: int
    clase_detectada: str
    confianza: float
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float


class ResultadosCompletos(BaseModel):
    """Combina el resumen de métricas con el detalle de detecciones YOLO."""
    resumen: Optional[ResumenResultado] = None
    detecciones: List[DeteccionItem] = []
    ruta_archivo_procesado: Optional[str] = None
