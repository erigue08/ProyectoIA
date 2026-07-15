# ============================================================
# repositories/usuario_repository.py
# ============================================================
from sqlalchemy.orm import Session
from app.models.models import Usuario

def obtener_usuario_por_credenciales(db: Session, nombre_usuario: str, correo_electronico: str):
    return (
        db.query(Usuario)
        .filter(
            (Usuario.nombre_usuario == nombre_usuario)
            | (Usuario.correo_electronico == correo_electronico)
        )
        .first()
    )

def guardar_nuevo_usuario(db: Session, nuevo_usuario: Usuario):
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def obtener_usuario_por_nombre(db: Session, nombre_usuario: str):
    return (
        db.query(Usuario)
        .filter(Usuario.nombre_usuario == nombre_usuario)
        .first()
    )

def obtener_usuario_por_id(db: Session, id_usuario: int):
    return db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

def confirmar_actualizacion(db: Session, usuario: Usuario):
    db.commit()
    db.refresh(usuario)
    return usuario