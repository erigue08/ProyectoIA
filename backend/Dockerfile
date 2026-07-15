# ============================================================
# Cacao Analysis - Dockerfile del contenedor Backend (Worker)
# ============================================================
FROM python:3.10-slim

# Evitar prompts y obligar a Python a mostrar logs en tiempo real
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

WORKDIR /app

ENV PYTHONPATH=/app

# Instalación de dependencias de sistema y driver ODBC 18 (Debian 12)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    unixodbc-dev \
    apt-transport-https \
    ca-certificates \
    && curl -sSL -o /usr/share/keyrings/microsoft-prod.gpg https://packages.microsoft.com/keys/microsoft.asc \
    && curl -sSL https://packages.microsoft.com/config/debian/12/prod.list -o /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalación de dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copia del código fuente del backend
COPY . .

# Comando de arranque para el Worker asíncrono
CMD ["python", "main.py"]