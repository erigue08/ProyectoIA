# ============================================================
# controllers/usuarios.py
# Endpoints del módulo de Usuarios: registro, login y
# actualización de perfil (incluyendo foto de perfil).
# ============================================================
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import UsuarioRegistro, UsuarioLogin, UsuarioRespuesta
from app.services import usuario_service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioRegistro, db: Session = Depends(get_db)):
    """Registra un nuevo usuario, hasheando su contraseña antes de guardarla."""
    return usuario_service.procesar_registro(datos, db)

@router.post("/login", response_model=UsuarioRespuesta)
def iniciar_sesion(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
    """Valida las credenciales del usuario y devuelve sus datos si son correctas."""
    return usuario_service.procesar_login(credenciales, db)

@router.put("/perfil", response_model=UsuarioRespuesta)
def actualizar_perfil(
    id_usuario: int = Form(...),
    nombre_completo: str | None = Form(None),
    correo_electronico: str | None = Form(None),
    foto_perfil: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    """
    Actualiza el perfil de un usuario. Acepta campos de texto (nombre,
    correo) y opcionalmente un archivo de imagen para la foto de perfil.
    El archivo se guarda físicamente en disco y solo se almacena la
    ruta (string) en la base de datos.
    """
    return usuario_service.procesar_actualizacion_perfil(
        id_usuario, nombre_completo, correo_electronico, foto_perfil, db
    )