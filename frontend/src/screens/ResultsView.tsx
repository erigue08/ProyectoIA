import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
const API_BASE_URL = import.meta.env.VITE_API_URL;
interface Props {
  analysisId: string
  onBack: () => void
}

const analysisData: Record<string, {
  fileName: string
  thumbnail: string
  isVideo: boolean
  cacao: { label: string; count: number; color: string }[]
  diseases: { name: string; affected: number; healthy: number }[]
  metrics: { label: string; value: string; sub: string; color: string }[]
}> = {
  a1: {
    fileName: 'parcela_norte_julio2026.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=700&h=420&fit=crop&auto=format',
    isVideo: true,
    cacao: [
      { label: 'Maduros', count: 124, color: '#c0844a' },
      { label: 'Verdes', count: 87, color: '#6d9f48' },
      { label: 'Sobremaduro', count: 31, color: '#8b5e3c' },
      { label: 'Dañados', count: 18, color: '#a8a29e' },
    ],
    diseases: [
      { name: 'Monilia', affected: 14, healthy: 86 },
      { name: 'Fitóftora', affected: 7, healthy: 93 },
      { name: 'Escoba bruja', affected: 3, healthy: 97 },
    ],
    metrics: [
      { label: 'Total detectado', value: '260', sub: 'frutos en 2:34 min', color: '#8b5e3c' },
      { label: 'Listos para cosecha', value: '47.7%', sub: '124 frutos maduros', color: '#6b4423' },
      { label: 'Índice de salud', value: '76%', sub: 'promedio parcela', color: '#4d7a2e' },
    ],
  },
  a2: {
    fileName: 'muestra_cacao_lote_B.jpg',
    thumbnail: 'https://images.unsplash.com/photo-1517178961710-5c5985ed22bd?w=700&h=420&fit=crop&auto=format',
    isVideo: false,
    cacao: [
      { label: 'Maduros', count: 42, color: '#c0844a' },
      { label: 'Verdes', count: 28, color: '#6d9f48' },
      { label: 'Sobremaduro', count: 9, color: '#8b5e3c' },
      { label: 'Dañados', count: 5, color: '#a8a29e' },
    ],
    diseases: [
      { name: 'Monilia', affected: 8, healthy: 92 },
      { name: 'Fitóftora', affected: 4, healthy: 96 },
      { name: 'Escoba bruja', affected: 1, healthy: 99 },
    ],
    metrics: [
      { label: 'Total detectado', value: '84', sub: 'frutos en imagen', color: '#8b5e3c' },
      { label: 'Listos para cosecha', value: '50%', sub: '42 frutos maduros', color: '#6b4423' },
      { label: 'Índice de salud', value: '88%', sub: 'lote B', color: '#4d7a2e' },
      { label: 'Confianza IA', value: '94.2%', sub: 'alta precisión', color: '#c0844a' },
    ],
  },
}

const fallbackData = analysisData['a1']

export default function ResultsView({ analysisId, onBack }: Props) {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [data, setData] = useState<typeof fallbackData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        
        // Protección: Si es un ID de prueba de Figma (a1, a2), cargamos el diseño estático
        if (analysisId.startsWith('a')) {
          setData(analysisData[analysisId] ?? fallbackData);
          setIsLoading(false);
          return;
        }

        // Petición a tu API para extraer los resultados reales
        const response = await fetch(`${API_BASE_URL}/analisis/${analysisId}`);
        
        if (!response.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        const realData = await response.json();

        // Adaptador: Mapea los resultados crudos de YOLO a la estructura de colores de Figma
        const mappedData = {
          fileName: realData.nombre_archivo || 'Analisis_Theobrama.mp4',
          thumbnail: realData.ruta_archivo_procesado 
            ? `${API_BASE_URL}${realData.ruta_archivo_procesado}` 
            : fallbackData.thumbnail,
          isVideo: true, 
          
          // Ajusta las variables (realData.maduros, etc.) según los nombres exactos que exponga tu GET endpoint
          cacao: [
            { label: 'Maduros', count: realData.maduros || 0, color: '#c0844a' },
            { label: 'Verdes', count: realData.verdes || 0, color: '#6d9f48' },
            { label: 'Sobremaduro', count: realData.sobremaduros || 0, color: '#8b5e3c' },
            { label: 'Dañados', count: realData.danados || 0, color: '#a8a29e' },
          ],
          
          diseases: [
            { name: 'Monilia', affected: realData.monilia || 0, healthy: 100 - (realData.monilia || 0) },
            { name: 'Fitóftora', affected: realData.fitoftora || 0, healthy: 100 - (realData.fitoftora || 0) },
            { name: 'Escoba bruja', affected: realData.escoba || 0, healthy: 100 - (realData.escoba || 0) },
          ],
          
          metrics: [
            { label: 'Total detectado', value: String(realData.total_frutos_detectados || 0), sub: 'frutos procesados', color: '#8b5e3c' },
            { label: 'Etapa Predominante', value: realData.etapa_predominante || 'N/A', sub: 'tendencia general', color: '#6b4423' },
            { label: 'Índice de IA', value: 'Completo', sub: 'procesado en servidor', color: '#4d7a2e' },
          ],
        };

        setData(mappedData);
      } catch (error) {
        console.error("Fallo la sincronización con Theobrama:", error);
        // Si hay error de red, renderizamos la data de prueba para no quebrar la pantalla
        setData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [analysisId]);

  // Pantalla temporal de carga mientras se hace la petición HTTP
  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-cacao-200 border-t-cacao-700 rounded-full animate-spin" />
          <p className="text-cacao-700 font-medium">Obteniendo métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-cacao-600 hover:text-cacao-800 font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a Análisis
          </button>
          <span className="text-stone-300">/</span>
          <span className="text-sm text-stone-500 truncate max-w-xs">{data.fileName}</span>
        </div>

        {/* Download button */}
        <div className="relative">
          <button
            onClick={() => setDownloadOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-cacao-700 hover:bg-cacao-600 text-cacao-50 text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v8M4.5 7.5L7.5 10l3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.5 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Descargar Reporte
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {downloadOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-stone-200 shadow-lg py-1 z-20">
              {['PDF', 'Excel (.xlsx)', 'CSV'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setDownloadOpen(false)}
                  className="w-full px-4 py-2 text-sm text-stone-700 hover:bg-cacao-50 hover:text-cacao-800 text-left transition-colors"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {data.metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 px-5 py-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${m.color}18` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none" style={{ color: m.color }}>{m.value}</div>
              <div className="text-xs font-semibold text-cacao-700 mt-1">{m.label}</div>
              <div className="text-xs text-stone-400 mt-0.5">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Media viewer — 3 cols */}
        <div className="col-span-3">
          <MediaViewer data={data} />
        </div>

        {/* Analytics — 2 cols */}
        <div className="col-span-2 flex flex-col gap-5">
          <CacaoCountChart data={data.cacao} />
          <DiseaseChart data={data.diseases} />
        </div>
      </div>
    </div>
  )
}

function MediaViewer({ data }: { data: typeof fallbackData }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="relative bg-cacao-900 aspect-video">
        <img src={data.thumbnail} alt={data.fileName} className="w-full h-full object-cover opacity-90" />

        {/* Bounding boxes simulation */}
        <BoundingBoxes />

        {/* Video overlay */}
        {data.isVideo && (
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  {playing ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="2" y="1.5" width="2" height="7" fill="#1c1917" rx="0.5" />
                      <rect x="6" y="1.5" width="2" height="7" fill="#1c1917" rx="0.5" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 1.5l7 3.5-7 3.5V1.5z" fill="#1c1917" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 h-1 bg-white/30 rounded-full">
                  <div className="w-1/3 h-full bg-cacao-300 rounded-full" />
                </div>
                <span className="text-xs text-white/80 font-mono">0:47 / 2:34</span>
              </div>
            </div>
          </div>
        )}

        {/* Model badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-0.5 bg-cacao-700/80 text-cacao-50 text-xs font-semibold rounded-md backdrop-blur-sm">
            IA Activa
          </span>
          <span className="px-2 py-0.5 bg-sage-700/80 text-sage-50 text-xs font-semibold rounded-md backdrop-blur-sm">
            260 objetos detectados
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-stone-100">
        <p className="text-xs text-stone-500 truncate">{data.fileName}</p>
      </div>
    </div>
  )
}

function BoundingBoxes() {
  const boxes = [
    { x: '18%', y: '22%', w: '12%', h: '18%', label: 'Maduro', color: '#c0844a' },
    { x: '38%', y: '35%', w: '10%', h: '16%', label: 'Verde', color: '#6d9f48' },
    { x: '55%', y: '18%', w: '13%', h: '20%', label: 'Maduro', color: '#c0844a' },
    { x: '68%', y: '50%', w: '11%', h: '15%', label: 'Enfermo', color: '#a8a29e' },
    { x: '28%', y: '58%', w: '9%', h: '14%', label: 'Verde', color: '#6d9f48' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none">
      {boxes.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
        >
          <div
            className="w-full h-full border-2 rounded-sm"
            style={{ borderColor: b.color }}
          />
          <div
            className="absolute -top-5 left-0 px-1 py-0.5 text-white text-[9px] font-semibold rounded-sm leading-none"
            style={{ backgroundColor: b.color }}
          >
            {b.label}
          </div>
        </div>
      ))}
    </div>
  )
}


function CacaoCountChart({ data }: { data: typeof fallbackData['cacao'] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="mb-3">
        <h4 className="text-xs font-bold text-cacao-800 uppercase tracking-wide">Conteo de Cacao</h4>
        <p className="text-xs text-stone-400 mt-0.5">Clasificación por estado del fruto · {total} frutos</p>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, border: '1px solid #e7e5e4', borderRadius: 8, padding: '4px 10px' }}
            cursor={{ fill: 'rgba(139,94,60,0.06)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DiseaseChart({ data }: { data: typeof fallbackData['diseases'] }) {
  const pieData = [
    { name: 'Afectados', value: Math.round(data.reduce((s, d) => s + d.affected, 0) / data.length) },
    { name: 'Sanos', value: Math.round(data.reduce((s, d) => s + d.healthy, 0) / data.length) },
  ]
  const COLORS = ['#c0844a', '#6d9f48']

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="mb-3">
        <h4 className="text-xs font-bold text-cacao-800 uppercase tracking-wide">Detección de Enfermedades</h4>
        <p className="text-xs text-stone-400 mt-0.5">Promedio de afectación por enfermedad</p>
      </div>
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={50}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-stone-600">{d.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cacao-400 rounded-full" style={{ width: `${d.affected}%` }} />
                </div>
                <span className="text-cacao-600 font-semibold w-8 text-right">{d.affected}%</span>
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            {pieData.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-stone-500">{p.name} {p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
