# ============================================================
# routers/usuarios.py
# Endpoints del módulo de Usuarios: registro, login y
# actualización de perfil (incluyendo foto de perfil).
# ============================================================
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioRegistro, UsuarioLogin, UsuarioRespuesta
from app.security import hashear_contrasena, verificar_contrasena

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# Directorio físico donde se guardan las fotos de perfil.
# Debe coincidir con el volumen montado en Docker (/uploads/perfiles).
DIRECTORIO_FOTOS_PERFIL = "/uploads/perfiles"
os.makedirs(DIRECTORIO_FOTOS_PERFIL, exist_ok=True)


@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioRegistro, db: Session = Depends(get_db)):
    """Registra un nuevo usuario, hasheando su contraseña antes de guardarla."""
    usuario_existente = (
        db.query(Usuario)
        .filter(
            (Usuario.nombre_usuario == datos.nombre_usuario)
            | (Usuario.correo_electronico == datos.correo_electronico)
        )
        .first()
    )
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario o correo electrónico ya está registrado.",
        )

    nuevo_usuario = Usuario(
        nombre_completo=datos.nombre_completo,
        nombre_usuario=datos.nombre_usuario,
        correo_electronico=datos.correo_electronico,
        contrasena_hash=hashear_contrasena(datos.contrasena),
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.post("/login", response_model=UsuarioRespuesta)
def iniciar_sesion(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
    """Valida las credenciales del usuario y devuelve sus datos si son correctas."""
    usuario = (
        db.query(Usuario)
        .filter(Usuario.nombre_usuario == credenciales.nombre_usuario)
        .first()
    )
    if not usuario or not verificar_contrasena(credenciales.contrasena, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
        )
    return usuario


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
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if nombre_completo:
        usuario.nombre_completo = nombre_completo
    if correo_electronico:
        usuario.correo_electronico = correo_electronico

    if foto_perfil is not None:
        # Se genera un nombre único para evitar colisiones entre archivos
        extension = os.path.splitext(foto_perfil.filename)[1]
        nombre_archivo_unico = f"{uuid.uuid4().hex}{extension}"
        ruta_destino = os.path.join(DIRECTORIO_FOTOS_PERFIL, nombre_archivo_unico)

        with open(ruta_destino, "wb") as buffer_destino:
            shutil.copyfileobj(foto_perfil.file, buffer_destino)

        # Solo se guarda la ruta (string) en la base de datos, no el binario
        usuario.url_foto_perfil = ruta_destino

    db.commit()
    db.refresh(usuario)
    return usuario
