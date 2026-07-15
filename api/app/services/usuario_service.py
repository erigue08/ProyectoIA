# ============================================================
# services/usuario_service.py
# ============================================================
import os
import shutil
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Usuario
from app.models.schemas import UsuarioRegistro, UsuarioLogin
from app.core.security import hashear_contrasena, verificar_contrasena
from app.repositories import usuario_repository

# Directorio físico donde se guardan las fotos de perfil.
# Debe coincidir con el volumen montado en Docker (/uploads/perfiles).
DIRECTORIO_FOTOS_PERFIL = "/uploads/perfiles"
os.makedirs(DIRECTORIO_FOTOS_PERFIL, exist_ok=True)


def procesar_registro(datos: UsuarioRegistro, db: Session):
    usuario_existente = usuario_repository.obtener_usuario_por_credenciales(db, datos.nombre_usuario, datos.correo_electronico)
    
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
    
    return usuario_repository.guardar_nuevo_usuario(db, nuevo_usuario)


def procesar_login(credenciales: UsuarioLogin, db: Session):
    usuario = usuario_repository.obtener_usuario_por_nombre(db, credenciales.nombre_usuario)
    
    if not usuario or not verificar_contrasena(credenciales.contrasena, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos.",
        )
        
    return usuario


def procesar_actualizacion_perfil(id_usuario, nombre_completo, correo_electronico, foto_perfil, db: Session):
    usuario = usuario_repository.obtener_usuario_por_id(db, id_usuario)
    
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

    return usuario_repository.confirmar_actualizacion(db, usuario)