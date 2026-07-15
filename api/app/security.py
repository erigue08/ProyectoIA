# ============================================================
# security.py
# Funciones utilitarias para el hashing y verificación de
# contraseñas usando passlib + bcrypt.
# ============================================================
from passlib.context import CryptContext

# Contexto de encriptación configurado con el esquema bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashear_contrasena(contrasena_plana: str) -> str:
    """Genera el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(contrasena_plana)


def verificar_contrasena(contrasena_plana: str, contrasena_hash: str) -> bool:
    """Verifica que una contraseña en texto plano coincida con su hash."""
    return pwd_context.verify(contrasena_plana, contrasena_hash)
