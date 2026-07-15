-- ==========================================
-- SCRIPT DE INICIALIZACIÓN: CACAO ANALYSIS
-- ==========================================

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CacaoDB')
BEGIN
  CREATE DATABASE CacaoDB;
END
GO

USE CacaoDB;
GO

-- 1. TABLA DE USUARIOS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' and xtype='U')
CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo NVARCHAR(100) NOT NULL,
    nombre_usuario NVARCHAR(50) UNIQUE NOT NULL,
    correo_electronico NVARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash NVARCHAR(255) NOT NULL,
    url_foto_perfil NVARCHAR(500) NULL,
    fecha_creacion DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2. TABLA DEL HISTORIAL DE MEDIOS (Videos/Imágenes)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Analisis_Media' and xtype='U')
CREATE TABLE Analisis_Media (
    id_analisis INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_archivo NVARCHAR(200) NOT NULL,
    ruta_archivo NVARCHAR(500) NOT NULL,
    tipo_media NVARCHAR(20) CHECK (tipo_media IN ('imagen', 'video')),
    estado_procesamiento NVARCHAR(50) DEFAULT 'Pendiente',
    fecha_subida DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATETIME2 NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);
GO

-- 3. TABLA DE RESULTADOS (Métricas del Dashboard)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Resultados_Resumen' and xtype='U')
CREATE TABLE Resultados_Resumen (
    id_resultado INT IDENTITY(1,1) PRIMARY KEY,
    id_analisis INT UNIQUE NOT NULL,
    total_frutos_detectados INT DEFAULT 0,
    porcentaje_sanos DECIMAL(5,2) DEFAULT 0.00,
    porcentaje_enfermos DECIMAL(5,2) DEFAULT 0.00,
    etapa_predominante NVARCHAR(50) NULL,
    FOREIGN KEY (id_analisis) REFERENCES Analisis_Media(id_analisis) ON DELETE CASCADE
);
GO

-- 4. TABLA DE DETECCIONES (Coordenadas YOLO)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Detecciones_YOLO' and xtype='U')
CREATE TABLE Detecciones_YOLO (
    id_deteccion BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_analisis INT NOT NULL,
    numero_frame INT NULL,
    clase_detectada NVARCHAR(50) NOT NULL,
    confianza DECIMAL(4,3) NOT NULL,
    bbox_x DECIMAL(10,4) NOT NULL,
    bbox_y DECIMAL(10,4) NOT NULL,
    bbox_width DECIMAL(10,4) NOT NULL,
    bbox_height DECIMAL(10,4) NOT NULL,
    FOREIGN KEY (id_analisis) REFERENCES Analisis_Media(id_analisis) ON DELETE CASCADE
);
GO

select * from Analisis_Media
select * from Detecciones_YOLO
select * from Resultados_Resumen
select * from Usuarios