# ============================================================
# reports.py
# Módulo responsable únicamente de generar los reportes
# descargables (PDF y Excel) a partir de los datos de un análisis.
# Se separa del router de endpoints para respetar el principio
# de responsabilidad única (SOLID).
# ============================================================
import io
from datetime import datetime

import pandas as pd
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)

from app.models import AnalisisMedia, ResultadoResumen, DeteccionYolo


def generar_pdf_reporte(
    analisis: AnalisisMedia,
    resumen: ResultadoResumen | None,
    detecciones: list[DeteccionYolo],
) -> io.BytesIO:
    """
    Genera un PDF estructurado con el resumen de métricas y el
    conteo de detecciones del análisis. Devuelve un buffer en
    memoria (BytesIO) listo para enviarse como respuesta HTTP.
    """
    buffer = io.BytesIO()
    documento = SimpleDocTemplate(buffer, pagesize=letter)
    estilos = getSampleStyleSheet()
    elementos = []

    # ---- Encabezado ----
    elementos.append(Paragraph("Reporte de Análisis de Cacao", estilos["Title"]))
    elementos.append(Spacer(1, 12))
    elementos.append(
        Paragraph(
            f"Archivo analizado: {analisis.nombre_archivo} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"Fecha de subida: {analisis.fecha_subida}",
            estilos["Normal"],
        )
    )
    elementos.append(Spacer(1, 20))

    # ---- Tabla de resumen de métricas ----
    elementos.append(Paragraph("Resumen de métricas", estilos["Heading2"]))
    datos_resumen = [["Métrica", "Valor"]]
    if resumen is not None:
        datos_resumen += [
            ["Total de frutos detectados", str(resumen.total_frutos_detectados)],
            ["Porcentaje sanos", f"{resumen.porcentaje_sanos:.2f} %"],
            ["Porcentaje enfermos", f"{resumen.porcentaje_enfermos:.2f} %"],
            ["Etapa predominante", resumen.etapa_predominante or "N/A"],
        ]
    else:
        datos_resumen.append(["Sin datos de resumen disponibles", "-"])

    tabla_resumen = Table(datos_resumen, hAlign="LEFT")
    tabla_resumen.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ]
        )
    )
    elementos.append(tabla_resumen)
    elementos.append(Spacer(1, 20))

    # ---- Tabla de conteo de detecciones por clase ----
    elementos.append(Paragraph("Conteo de detecciones por clase (YOLO)", estilos["Heading2"]))
    conteo_por_clase: dict[str, int] = {}
    for deteccion in detecciones:
        conteo_por_clase[deteccion.clase_detectada] = (
            conteo_por_clase.get(deteccion.clase_detectada, 0) + 1
        )

    datos_detecciones = [["Clase detectada", "Cantidad"]]
    if conteo_por_clase:
        for clase, cantidad in conteo_por_clase.items():
            datos_detecciones.append([clase, str(cantidad)])
    else:
        datos_detecciones.append(["Sin detecciones registradas", "-"])

    tabla_detecciones = Table(datos_detecciones, hAlign="LEFT")
    tabla_detecciones.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6D4C41")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ]
        )
    )
    elementos.append(tabla_detecciones)
    elementos.append(Spacer(1, 20))
    elementos.append(
        Paragraph(
            f"Reporte generado automáticamente el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            estilos["Italic"],
        )
    )

    documento.build(elementos)
    buffer.seek(0)
    return buffer


def generar_excel_reporte(
    analisis: AnalisisMedia,
    resumen: ResultadoResumen | None,
    detecciones: list[DeteccionYolo],
) -> io.BytesIO:
    """
    Genera un archivo Excel (.xlsx) con dos hojas:
    - "Resumen": métricas generales del análisis.
    - "Detecciones": detalle de cada bounding box detectado.
    Devuelve un buffer en memoria listo para enviarse como respuesta HTTP.
    """
    buffer = io.BytesIO()

    # ---- Hoja de resumen ----
    if resumen is not None:
        df_resumen = pd.DataFrame(
            [
                {
                    "Archivo analizado": analisis.nombre_archivo,
                    "Fecha de subida": analisis.fecha_subida,
                    "Total de frutos detectados": resumen.total_frutos_detectados,
                    "Porcentaje sanos (%)": resumen.porcentaje_sanos,
                    "Porcentaje enfermos (%)": resumen.porcentaje_enfermos,
                    "Etapa predominante": resumen.etapa_predominante,
                }
            ]
        )
    else:
        df_resumen = pd.DataFrame(
            [{"Archivo analizado": analisis.nombre_archivo, "Mensaje": "Sin datos de resumen"}]
        )

    # ---- Hoja de detecciones ----
    if detecciones:
        df_detecciones = pd.DataFrame(
            [
                {
                    "Frame": d.numero_frame,
                    "Clase detectada": d.clase_detectada,
                    "Confianza": d.confianza,
                    "BBox X": d.bbox_x,
                    "BBox Y": d.bbox_y,
                    "BBox Ancho": d.bbox_width,
                    "BBox Alto": d.bbox_height,
                }
                for d in detecciones
            ]
        )
    else:
        df_detecciones = pd.DataFrame([{"Mensaje": "Sin detecciones registradas"}])

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df_resumen.to_excel(writer, sheet_name="Resumen", index=False)
        df_detecciones.to_excel(writer, sheet_name="Detecciones", index=False)

        # Ajuste automático simple del ancho de columnas
        for nombre_hoja, df in (("Resumen", df_resumen), ("Detecciones", df_detecciones)):
            hoja = writer.sheets[nombre_hoja]
            for i, columna in enumerate(df.columns, start=1):
                ancho = max(12, len(str(columna)) + 2)
                hoja.column_dimensions[get_column_letter(i)].width = ancho

    buffer.seek(0)
    return buffer
