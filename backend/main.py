# ============================================================
# backend/main.py
# Bucle de orquestación para el procesamiento en segundo plano
# ============================================================
import time
from sqlalchemy.orm import Session

# Importamos desde las carpetas compartidas por Docker
from app.core.database import SessionLocal, engine, Base
from app.models import models
# Importamos la lógica local del backend
from services import db_service, runpod_service

# Asegurar que las tablas existan (opcional si ya lo hace init.sql)
models.Base.metadata.create_all(bind=engine)

TIEMPO_ESPERA_SEGUNDOS = 5

def iniciar_worker():
    print("Iniciando Worker de Theobrama... Esperando tareas.")
    
    while True:
        # Se abre y se cierra una sesión limpia en cada ciclo
        with SessionLocal() as db:
            tarea_pendiente = db_service.obtener_analisis_pendiente(db)
            
            if tarea_pendiente:
                print(f"[*] Tarea detectada: Análisis ID {tarea_pendiente.id_analisis}")
                
                try:
                    # 1. Marcar como "Procesando" para evitar duplicidades
                    db_service.actualizar_estado(db, tarea_pendiente.id_analisis, "Procesando")
                    
                    # 2. Enviar a GPU en la nube (Llamada al servicio RunPod)
                    resultados = runpod_service.ejecutar_inferencia(tarea_pendiente)
                    
                    # 3. Guardar resultados y marcar como "Terminado"
                    db_service.guardar_resultados_y_terminar(db, tarea_pendiente.id_analisis, resultados)
                    print(f"[+] Análisis ID {tarea_pendiente.id_analisis} completado con éxito.")
                    
                except Exception as e:
                    print(f"[-] Error en Análisis ID {tarea_pendiente.id_analisis}: {str(e)}")
                    db_service.actualizar_estado(db, tarea_pendiente.id_analisis, "Error")
            
        # Pausa para no saturar la CPU ni la base de datos
        time.sleep(TIEMPO_ESPERA_SEGUNDOS)

if __name__ == "__main__":
    iniciar_worker()