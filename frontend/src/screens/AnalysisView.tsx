import { useState, useEffect, useRef } from 'react'
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AnalysisRecord {
  id: string
  fileName: string
  type: 'video' | 'image'
  status: 'Análisis Terminado' | 'Procesando' | 'Pendiente' | 'Error'
  timestamp: string
  duration?: string
  thumbnail: string
}

interface Props {
  onShowResults: (id: string) => void
}

export default function AnalysisView({ onShowResults }: Props) {
  const [dragging, setDragging] = useState(false)
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // FIX: Polling para actualizar estados y preservación del thumbnail local (blob)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchHistory = async () => {
      const userId = localStorage.getItem('usuario_id');
      if (!userId) {
        setLoadingHistory(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/analisis/historial/${userId}`);
        if (!response.ok) throw new Error('Error al obtener historial');

        const data = await response.json();

        // Usamos la versión de función de setRecords para acceder al estado previo
        setRecords((prevRecords) => {
          return data.map((item: any) => {
            let status: AnalysisRecord['status'] = 'Pendiente';
            if (item.estado_procesamiento === 'Terminado') status = 'Análisis Terminado';
            else if (item.estado_procesamiento === 'Procesando') status = 'Procesando';
            else if (item.estado_procesamiento === 'Error') status = 'Error';
            else if (item.estado_procesamiento === 'Pendiente') status = 'Pendiente';

            const isVideo = item.nombre_archivo?.match(/\.(mp4|avi|mov|mkv)$/i);
            const existingRecord = prevRecords.find((r) => r.id === String(item.id_analisis));

            // Si ya está procesado, usa la ruta del backend. Si no, intenta buscar si ya teníamos un blob local.
            let finalThumbnail = item.ruta_archivo_procesado
              ? `${API_BASE_URL}/static${item.ruta_archivo_procesado}`
              : null;

            if (!finalThumbnail) {
              if (existingRecord && existingRecord.thumbnail.startsWith('blob:')) {
                // Mantiene la imagen que subiste desde tu disco mientras carga
                finalThumbnail = existingRecord.thumbnail;
              } else {
                // Solo usa la imagen por defecto si no hay blob previo
                finalThumbnail = 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=120&h=80&fit=crop&auto=format';
              }
            }

            return {
              id: String(item.id_analisis),
              fileName: item.nombre_archivo,
              type: isVideo ? 'video' : 'image',
              status,
              timestamp: new Date(item.fecha_subida).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }),
              thumbnail: finalThumbnail,
            };
          });
        });
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory(); // Llamada inicial
    
    // Polling: Consulta a la API cada 5 segundos
    intervalId = setInterval(fetchHistory, 5000); 

    // Limpieza del intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const deleteRecord = async (id: string) => {
    // Si es un archivo temporal que aún se está subiendo, lo borramos de inmediato
    if (id.startsWith('temp-')) {
      setRecords((r) => r.filter((rec) => rec.id !== id));
      return;
    }

    try {
      // 1. Esperamos a que la API haga su trabajo
      const response = await fetch(`${API_BASE_URL}/analisis/${id}`, { method: 'DELETE' });
    
      // 2. Si la API nos da un error (ej. 500 o 404), lanzamos una excepción
      if (!response.ok) {
        throw new Error('El servidor no pudo eliminar el registro.');
      }
    
      // 3. SOLO si el backend respondió correctamente (200 OK), lo quitamos de la UI
      setRecords((r) => r.filter((rec) => rec.id !== id));
    
    } catch (error) {
      console.error("Error al eliminar análisis:", error);
      alert("Hubo un problema al eliminar el análisis en el servidor. Revisa los logs del backend.");
      // Como hay error, NO hacemos el setRecords. La tarjeta se queda visible.
    } 
  }

  const startEdit = (rec: AnalysisRecord) => {
    setEditingId(rec.id)
    setEditName(rec.fileName)
  }

  const saveEdit = (id: string) => {
    setRecords((r) => r.map((rec) => (rec.id === id ? { ...rec, fileName: editName } : rec)))
    setEditingId(null)
  }

  const handleFileUpload = async (file: File) => {
    // 1. Generamos el enlace temporal de la imagen/video real
    const fileUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}`;
    const isVideo = file.type.startsWith('video');
    
    const newRecord: AnalysisRecord = {
      id: tempId,
      fileName: file.name,
      type: isVideo ? 'video' : 'image',
      status: 'Procesando',
      timestamp: new Date().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }),
      thumbnail: fileUrl,
    };

    setRecords((prev) => [newRecord, ...prev]);

    // 2. Preparar el archivo para la API
    const userId = localStorage.getItem('usuario_id');
    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const response = await fetch(`${API_BASE_URL}/analisis/subir?id_usuario=${userId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Error en el servidor: ${response.statusText}`);
      }

      const data = await response.json();

      // 3. Actualizamos el registro temporal con el ID real del análisis
      setRecords((prev) => prev.map((rec) => 
        rec.id === tempId 
          ? { ...rec, id: String(data.id_analisis), status: 'Pendiente' } 
          : rec
      ));

    } catch (error) {
      console.error("Fallo al enviar el archivo:", error);
      setRecords((prev) => prev.map((rec) => (rec.id === tempId ? { ...rec, status: 'Error' } : rec)));
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-cacao-800 tracking-tight">Análisis de Cacao</h2>
        <p className="text-sm text-stone-500 mt-1">Cargue videos o imágenes para iniciar el análisis con IA</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
          dragging
            ? 'border-sage-400 bg-sage-50'
            : 'border-cacao-200 bg-cacao-50 hover:border-cacao-400 hover:bg-cacao-100/50'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input 
          ref={fileRef} 
          type="file" 
          accept="video/*,image/*" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
              e.target.value = '';
            }
          }} 
        />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragging ? 'bg-sage-200' : 'bg-cacao-100'}`}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={dragging ? 'text-sage-600' : 'text-cacao-500'}>
            <path d="M16 22V10M16 10l-4 4M16 10l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 22v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <p className={`text-base font-semibold mb-1 transition-colors ${dragging ? 'text-sage-700' : 'text-cacao-700'}`}>
          Arrastrar y soltar archivos aquí
        </p>
        <p className="text-sm text-stone-500 mb-4">o haga clic para seleccionar desde su dispositivo</p>

        <button
          type="button"
          className="px-5 py-2 bg-cacao-700 hover:bg-cacao-600 text-cacao-50 text-sm font-semibold rounded-lg shadow-sm transition-all"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
        >
          Seleccionar archivo
        </button>

        <p className="text-xs text-stone-400 mt-3">
          Formatos soportados: MP4, MOV, AVI · JPG, PNG, WEBP · Tamaño máximo: 500 MB
        </p>
      </div>

      {/* Recent analyses */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-cacao-800">Análisis Recientes</h3>
          <span className="text-xs text-stone-400">{records.length} resultados</span>
        </div>

        {loadingHistory ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-cacao-200 border-t-cacao-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-400">Cargando historial...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {records.map((rec) => (
                <AnalysisCard
                  key={rec.id}
                  rec={rec}
                  editingId={editingId}
                  editName={editName}
                  onEditName={setEditName}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onDelete={deleteRecord}
                  onShowResults={onShowResults}
                />
              ))}
            </div>

            {records.length === 0 && (
              <div className="text-center py-12 text-stone-400 text-sm">
                No hay análisis recientes. ¡Suba un archivo para comenzar!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  rec: AnalysisRecord
  editingId: string | null
  editName: string
  onEditName: (v: string) => void
  onStartEdit: (r: AnalysisRecord) => void
  onSaveEdit: (id: string) => void
  onDelete: (id: string) => void
  onShowResults: (id: string) => void
}

function AnalysisCard({ rec, editingId, editName, onEditName, onStartEdit, onSaveEdit, onDelete, onShowResults }: CardProps) {
  const isEditing = editingId === rec.id
  const isVideo = rec.type === 'video'

  const statusColor = rec.status === 'Análisis Terminado' ? 'bg-sage-500'
    : rec.status === 'Procesando' || rec.status === 'Pendiente' ? 'bg-amber-400'
    : 'bg-red-400';

  const statusTextColor = rec.status === 'Análisis Terminado' ? 'text-sage-600'
    : rec.status === 'Procesando' || rec.status === 'Pendiente' ? 'text-amber-600'
    : 'text-red-600';

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 hover:border-cacao-200 hover:shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 relative">
        <img src={rec.thumbnail} alt={rec.fileName} className="w-full h-full object-cover" />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 1.5l7 3.5-7 3.5V1.5z" fill="#4d2f10" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2 mb-1">
            <input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              className="flex-1 text-sm border border-cacao-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-cacao-400"
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(rec.id)}
              autoFocus
            />
            <button
              onClick={() => onSaveEdit(rec.id)}
              className="text-xs text-cacao-700 font-semibold hover:text-cacao-900"
            >
              Guardar
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-cacao-800 truncate">{rec.fileName}</p>
        )}
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`inline-flex items-center gap-1 text-xs ${statusTextColor} font-medium`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor} inline-block`} />
            {rec.status}
          </span>
          <span className="text-xs text-stone-400">{rec.timestamp}</span>
          {rec.duration && (
            <span className="text-xs text-stone-400">· {rec.duration}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {(rec.status === 'Análisis Terminado') && (
          <button
            onClick={() => onShowResults(rec.id)}
            className="px-4 py-1.5 bg-cacao-700 hover:bg-cacao-600 text-cacao-50 text-xs font-semibold rounded-lg transition-all"
          >
            Mostrar Resultados
          </button>
        )}
        {(rec.status === 'Procesando' || rec.status === 'Pendiente') && (
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
            En proceso...
          </span>
        )}
        <button
          onClick={() => onStartEdit(rec)}
          title="Editar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-cacao-600 hover:bg-cacao-50 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2L12 4.5 5 11.5H2.5V9L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(rec.id)}
          title="Eliminar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4.5M8.5 6v4.5M3.5 3.5l.5 8a.5.5 0 00.5.5h5a.5.5 0 00.5-.5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}