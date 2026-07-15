# ============================================================
# database.py
# Configuración de la conexión a SQL Server mediante SQLAlchemy
# usando el driver ODBC 18 de Microsoft y pyodbc.
# ============================================================
import os
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ------------------------------------------------------------
# Parámetros de conexión.
# Se leen desde variables de entorno para no exponer credenciales
# directamente en el código (buenas prácticas de Clean Code /
# 12-factor app). En docker-compose se inyectarían estos valores.
# ------------------------------------------------------------
DB_SERVER = os.getenv("DB_SERVER", "cacao_db")  # nombre del servicio en docker-compose
DB_PORT = os.getenv("DB_PORT", "1433")
DB_NAME = os.getenv("DB_NAME", "CacaoDB")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "changeme")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")

# TrustServerCertificate=yes se usa porque en entornos de desarrollo
# el contenedor de SQL Server suele usar certificados autofirmados.
# En producción se recomienda usar un certificado válido y quitar esta bandera.
_odbc_params = urllib.parse.quote_plus(
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER},{DB_PORT};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    f"TrustServerCertificate=yes;"
)

SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={_odbc_params}"

# pool_pre_ping revisa que la conexión siga viva antes de usarla,
# evitando errores por conexiones caídas en conexiones de larga duración.
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependencia de FastAPI que entrega una sesión de base de datos
    por cada request y la cierra automáticamente al finalizar.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
