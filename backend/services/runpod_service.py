import os
import json
import asyncio
import requests
import websockets

# Variables de entorno para la IP dinámica de RunPod
# Ej: http://192.168.1.100:8000
RUNPOD_API_URL = os.getenv("RUNPOD_API_URL", "http://localhost:8000")
# Ej: ws://192.168.1.100:8000
RUNPOD_WS_URL = os.getenv("RUNPOD_WS_URL", "ws://localhost:8000")

# Directorio local montado en Docker
UPLOADS_DIR = "/uploads/analisis"

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

def _descargar_resultado(url_path: str, sufijo: str, id_analisis: int) -> str:
    """
    Descarga el video procesado desde la API de RunPod hacia el volumen local.
    """
    url_completa = f"{RUNPOD_API_URL}{url_path}"
    print(f"[*] Descargando resultado desde: {url_completa}")
    
    respuesta = requests.get(url_completa, stream=True)
    respuesta.raise_for_status()
    
    nombre_archivo = f"resultado_{id_analisis}_{sufijo}.mp4"
    ruta_fisica = os.path.join(UPLOADS_DIR, nombre_archivo)
    
    with open(ruta_fisica, 'wb') as f:
        for chunk in respuesta.iter_content(chunk_size=8192):
            f.write(chunk)
            
    # Retornamos la ruta relativa para guardarla en la base de datos
    return f"/uploads/analisis/{nombre_archivo}"

def ejecutar_inferencia(tarea):
    """
    Función orquestadora principal que será llamada por main.py.
    """
    ruta_video_local = tarea.ruta_archivo
    
    # Validar que el archivo físico existe en el volumen
    if not os.path.exists(ruta_video_local):
        raise FileNotFoundError(f"El video no existe en el volumen local: {ruta_video_local}")
    
    # 1. Enviar el video por HTTP POST a RunPod
    print(f"[*] Enviando video {ruta_video_local} a {RUNPOD_API_URL}/upload_video")
    with open(ruta_video_local, 'rb') as f:
        archivos = {'file': f}
        respuesta = requests.post(f"{RUNPOD_API_URL}/upload_video", files=archivos)
        respuesta.raise_for_status()
        
    job_id = respuesta.json().get("job_id")
    if not job_id:
        raise Exception("La API no devolvió un job_id válido.")
        
    # 2. Esperar el procesamiento mediante WebSocket (Llamada asíncrona)
    resultado_final = asyncio.run(_escuchar_progreso_ws(job_id))
    
    # 3. Descargar el video de clasificación (o tracking) al servidor local
    # Se elige classification_url porque contiene el detalle de enfermedades
    url_descarga = resultado_final.get("classification_url")
    ruta_video_procesado = _descargar_resultado(url_descarga, "clasificacion", tarea.id_analisis)
    
    # 4. Mapear las estadísticas recibidas a la estructura de nuestra Base de Datos
    stats = resultado_final.get("stats", {})
    
    # Extraer la etapa predominante de forma segura
    conteo_etapas = stats.get("stage_counts", {})
    etapa_predominante = max(conteo_etapas, key=conteo_etapas.get) if conteo_etapas else "Desconocida"
    
    # Mapear los frutos detectados
    detecciones_mapeadas = []
    for fruto in stats.get("fruits_details", []):
        pos_global = fruto.get("global_pos", [0.0, 0.0])
        detecciones_mapeadas.append({
            "frame": fruto.get("first_frame", 0),
            "clase": fruto.get("disease_label", "Desconocida"),  # Priorizamos etiqueta de salud
            "confianza": fruto.get("max_confidence", 0.0),
            "x": pos_global[0],
            "y": pos_global[1],
            "w": 0.0,  # La API global no devuelve W/H, se deja en 0
            "h": 0.0
        })

    # Retornar el diccionario que espera db_service.py
    return {
        "ruta_video_final": ruta_video_procesado,
        "total_frutos": stats.get("total_confirmed", 0),
        "etapa_predominante": etapa_predominante,
        "detecciones": detecciones_mapeadas
    }