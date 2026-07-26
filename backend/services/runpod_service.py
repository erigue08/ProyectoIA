# ============================================================
# backend/services/runpod_service.py
# Servicio de comunicación con la API AI Thebroma (GPU).
# Soporta DOS flujos según la guía de integración:
#   - Video: POST /upload_video → WebSocket → Descarga
#   - Imagen: POST /upload_image → Respuesta síncrona
# ============================================================
import os
import json
import asyncio
import requests
import websockets

# Variables de entorno para la IP dinámica de RunPod
RUNPOD_API_URL = os.getenv("RUNPOD_API_URL", "http://localhost:8000")
RUNPOD_WS_URL = os.getenv("RUNPOD_WS_URL", "ws://localhost:8000")

# Directorio local montado en Docker
UPLOADS_DIR = "/uploads/analisis"

# Extensiones de video soportadas
EXTENSIONES_VIDEO = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


# ======================== FLUJO DE VIDEO ========================

async def _escuchar_progreso_ws(job_id: str):
    """
    Se conecta al WebSocket de la API de RunPod y escucha los eventos 
    hasta recibir el estado 'done' o 'error'.
    """
    uri = f"{RUNPOD_WS_URL}/ws/progress/{job_id}"
    print(f"[*] Conectando al WebSocket de GPU: {uri}")
    
    async with websockets.connect(uri) as websocket:
        while True:
            mensaje = await websocket.recv()
            data = json.loads(mensaje)
            
            estado = data.get("status")
            
            if estado == "running":
                frame = data.get("frame", 0)
                total = data.get("total_frames", 0)
                print(f"[~] Procesando GPU: Frame {frame}/{total}")
                
            elif estado == "done":
                print("[+] Procesamiento en GPU finalizado exitosamente.")
                return data
                
            elif estado == "error":
                error_msg = data.get("error", "Error desconocido en la GPU")
                raise Exception(f"Fallo en la inferencia YOLO: {error_msg}")


def _descargar_resultado(url_path: str, sufijo: str, id_analisis: int, extension: str = ".mp4") -> str:
    """
    Descarga el archivo procesado desde la API de RunPod hacia el volumen local.
    Soporta tanto videos (.mp4) como imágenes (.jpg).
    """
    url_completa = f"{RUNPOD_API_URL}{url_path}"
    print(f"[*] Descargando resultado desde: {url_completa}")
    
    respuesta = requests.get(url_completa, stream=True)
    respuesta.raise_for_status()
    
    nombre_archivo = f"resultado_{id_analisis}_{sufijo}{extension}"
    ruta_fisica = os.path.join(UPLOADS_DIR, nombre_archivo)
    
    with open(ruta_fisica, 'wb') as f:
        for chunk in respuesta.iter_content(chunk_size=8192):
            f.write(chunk)
            
    # Retornamos la ruta relativa para guardarla en la base de datos
    return f"/uploads/analisis/{nombre_archivo}"


def _procesar_video(tarea) -> dict:
    """
    Flujo ASÍNCRONO para videos:
    1. POST /upload_video → obtener job_id
    2. WebSocket /ws/progress/{job_id} → esperar 'done'
    3. GET /download/{filename} → descargar video procesado
    """
    ruta_archivo = tarea.ruta_archivo
    
    # 1. Enviar el video por HTTP POST a RunPod
    print(f"[*] Enviando video {ruta_archivo} a {RUNPOD_API_URL}/upload_video")
    with open(ruta_archivo, 'rb') as f:
        archivos = {'file': f}
        respuesta = requests.post(f"{RUNPOD_API_URL}/upload_video", files=archivos)
        respuesta.raise_for_status()
        
    job_id = respuesta.json().get("job_id")
    if not job_id:
        raise Exception("La API no devolvió un job_id válido.")
        
    # 2. Esperar el procesamiento mediante WebSocket
    resultado_final = asyncio.run(_escuchar_progreso_ws(job_id))
    
    # 3. Descargar el video de clasificación al servidor local
    url_descarga = resultado_final.get("classification_url")
    if not url_descarga:
        raise Exception("La API no devolvió classification_url en el resultado final.")
    ruta_archivo_procesado = _descargar_resultado(url_descarga, "clasificacion", tarea.id_analisis, ".mp4")
    
    # 4. Mapear las estadísticas recibidas
    stats = resultado_final.get("stats", {})
    return _mapear_estadisticas(stats, ruta_archivo_procesado)


# ======================== FLUJO DE IMAGEN ========================

def _procesar_imagen(tarea) -> dict:
    """
    Flujo SÍNCRONO para imágenes:
    1. POST /upload_image → respuesta inmediata con stats + URLs
    2. GET /download/{filename} → descargar imagen procesada
    """
    ruta_archivo = tarea.ruta_archivo
    
    # 1. Enviar la imagen por HTTP POST a RunPod
    print(f"[*] Enviando imagen {ruta_archivo} a {RUNPOD_API_URL}/upload_image")
    with open(ruta_archivo, 'rb') as f:
        archivos = {'file': f}
        respuesta = requests.post(f"{RUNPOD_API_URL}/upload_image", files=archivos)
        respuesta.raise_for_status()
    
    resultado = respuesta.json()
    
    if resultado.get("status") != "success":
        raise Exception(f"La API devolvió un error al procesar la imagen: {resultado}")
    
    # 2. Descargar la imagen de clasificación al servidor local
    url_descarga = resultado.get("classification_url")
    if not url_descarga:
        raise Exception("La API no devolvió classification_url para la imagen.")
    ruta_archivo_procesado = _descargar_resultado(url_descarga, "clasificacion", tarea.id_analisis, ".jpg")
    
    # 3. Mapear las estadísticas recibidas (mismo formato que video)
    stats = resultado.get("stats", {})
    return _mapear_estadisticas(stats, ruta_archivo_procesado)


# ======================== UTILIDADES COMPARTIDAS ========================

def _mapear_estadisticas(stats: dict, ruta_archivo_procesado: str) -> dict:
    """
    Convierte las estadísticas de AI Thebroma al formato que espera db_service.py.
    Este mapeo es idéntico para video e imagen ya que la API devuelve la misma
    estructura de 'stats' en ambos flujos.
    """
    # Extraer la etapa predominante de forma segura
    conteo_etapas = stats.get("stage_counts", {})
    etapa_predominante = max(conteo_etapas, key=conteo_etapas.get) if conteo_etapas else "Desconocida"
    
    # Calcular porcentajes de sanos/enfermos
    total_confirmed = stats.get("total_confirmed", 0)
    healthy_count = stats.get("healthy_count", 0)
    sick_count = stats.get("sick_count", 0)
    
    porcentaje_sanos = (healthy_count / total_confirmed * 100) if total_confirmed > 0 else 0.0
    porcentaje_enfermos = (sick_count / total_confirmed * 100) if total_confirmed > 0 else 0.0
    
    # Mapear los frutos detectados
    detecciones_mapeadas = []
    for fruto in stats.get("fruits_details", []):
        pos_global = fruto.get("global_pos", [0.0, 0.0])
        detecciones_mapeadas.append({
            "frame": fruto.get("first_frame", 0),
            "clase": fruto.get("disease_label", "Desconocida"),
            "confianza": fruto.get("max_confidence", 0.0),
            "x": pos_global[0],
            "y": pos_global[1],
            "w": 0.0,
            "h": 0.0
        })

    return {
        "ruta_video_final": ruta_archivo_procesado,
        "total_frutos": total_confirmed,
        "etapa_predominante": etapa_predominante,
        "porcentaje_sanos": porcentaje_sanos,
        "porcentaje_enfermos": porcentaje_enfermos,
        "detecciones": detecciones_mapeadas
    }


# ======================== PUNTO DE ENTRADA ========================

def ejecutar_inferencia(tarea):
    """
    Función orquestadora principal llamada por main.py.
    Detecta si el archivo es video o imagen y ejecuta el flujo correspondiente.
    """
    ruta_archivo = tarea.ruta_archivo
    
    # Validar que el archivo físico existe en el volumen
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"El archivo no existe en el volumen local: {ruta_archivo}")
    
    # Determinar el tipo de archivo por extensión
    extension = os.path.splitext(ruta_archivo)[1].lower()
    
    if extension in EXTENSIONES_VIDEO:
        print(f"[*] Tipo detectado: VIDEO ({extension})")
        return _procesar_video(tarea)
    else:
        print(f"[*] Tipo detectado: IMAGEN ({extension})")
        return _procesar_imagen(tarea)