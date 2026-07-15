# ============================================================
# models.py
# Modelos ORM (SQLAlchemy) que mapean las tablas YA EXISTENTES
# en la base de datos CacaoDB (SQL Server). No se crean tablas
# nuevas: estos modelos solo describen la estructura para poder
# hacer consultas e inserciones desde la API.
# ============================================================
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "Usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    nombre_usuario = Column(String(50), unique=True, nullable=False, index=True)
    correo_electronico = Column(String(150), unique=True, nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)
    url_foto_perfil = Column(String(500), nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())

    analisis = relationship("AnalisisMedia", back_populates="usuario")


class AnalisisMedia(Base):
    __tablename__ = "Analisis_Media"

    id_analisis = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("Usuarios.id_usuario"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    ruta_archivo_procesado = Column(String, nullable=True)
    tipo_media = Column(String(20), nullable=False)  # ej: "imagen" | "video"
    estado_procesamiento = Column(String(30), nullable=False, default="Pendiente")
    fecha_subida = Column(DateTime, server_default=func.now())
    fecha_completado = Column(DateTime, nullable=True)

    usuario = relationship("Usuario", back_populates="analisis")
    resumen = relationship("ResultadoResumen", back_populates="analisis", uselist=False)
    detecciones = relationship("DeteccionYolo", back_populates="analisis")


class ResultadoResumen(Base):
    __tablename__ = "Resultados_Resumen"

    id_resultado = Column(Integer, primary_key=True, index=True)
    id_analisis = Column(Integer, ForeignKey("Analisis_Media.id_analisis"), nullable=False)
    total_frutos_detectados = Column(Integer, default=0)
    porcentaje_sanos = Column(Float, default=0.0)
    porcentaje_enfermos = Column(Float, default=0.0)
    etapa_predominante = Column(String(50), nullable=True)

    analisis = relationship("AnalisisMedia", back_populates="resumen")


class DeteccionYolo(Base):
    __tablename__ = "Detecciones_YOLO"

    id_deteccion = Column(Integer, primary_key=True, index=True)
    id_analisis = Column(Integer, ForeignKey("Analisis_Media.id_analisis"), nullable=False)
    numero_frame = Column(Integer, nullable=False)
    clase_detectada = Column(String(50), nullable=False)
    confianza = Column(Float, nullable=False)
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_width = Column(Float, nullable=False)
    bbox_height = Column(Float, nullable=False)

    analisis = relationship("AnalisisMedia", back_populates="detecciones")
