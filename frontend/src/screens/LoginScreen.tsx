import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Props {
  onLogin: () => void
}

type ViewMode = 'login' | 'register' | 'forgot';

export default function LoginScreen({ onLogin }: Props) {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Estado para controlar qué pantalla mostrar dentro de la tarjeta
  const [viewMode, setViewMode] = useState<ViewMode>('login')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica según el modo
    if (!usuario) {
      setErrorMsg('Por favor ingrese su usuario');
      setSuccessMsg('');
      return;
    }
    if (viewMode === 'register' && !nombreCompleto) {
      setErrorMsg('Por favor ingrese su nombre completo');
      setSuccessMsg('');
      return;
    }
    if (viewMode === 'register' && !correo) {
      setErrorMsg('Por favor ingrese su correo electrónico');
      setSuccessMsg('');
      return;
    }
    if (viewMode !== 'forgot' && !contrasena) {
      setErrorMsg('Por favor ingrese su contraseña');
      setSuccessMsg('');
      return;
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (viewMode === 'forgot') {
        // --- LÓGICA DE RECUPERACIÓN DE CONTRASEÑA ---
        const response = await fetch(`${API_BASE_URL}/usuarios/recuperar_contrasena`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre_usuario: usuario })
        });

        if (!response.ok) throw new Error('No se pudo procesar la solicitud.');
        
        setSuccessMsg('Si el usuario existe, se han enviado las instrucciones.');
        
      } else if (viewMode === 'register') {
        // --- LÓGICA DE REGISTRO ---
        const response = await fetch(`${API_BASE_URL}/usuarios/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_completo: nombreCompleto,
            nombre_usuario: usuario,
            correo_electronico: correo,
            contrasena: contrasena
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || 'No se pudo registrar. El usuario o correo podría ya existir.');
        }

        const data = await response.json();
        
        // --- FIX IMPLEMENTADO AQUÍ: Guardar todos los datos de sesión ---
        localStorage.setItem('usuario_id', String(data.id_usuario));
        localStorage.setItem('usuario_nombre', data.nombre_completo || data.nombre_usuario);
        localStorage.setItem('usuario_correo', data.correo_electronico || '');
        
        onLogin();

      } else {
        // --- LÓGICA DE INICIO DE SESIÓN ---
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_usuario: usuario,
            contrasena: contrasena
          })
        });

        if (!response.ok) throw new Error('Credenciales incorrectas');

        const data = await response.json();
        
        // --- FIX IMPLEMENTADO AQUÍ: Guardar todos los datos de sesión ---
        localStorage.setItem('usuario_id', String(data.id_usuario));
        localStorage.setItem('usuario_nombre', data.nombre_completo || data.nombre_usuario);
        localStorage.setItem('usuario_correo', data.correo_electronico || '');
        
        onLogin();
      }

    } catch (error: any) {
      console.error("Operación fallida:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false)
    }
  }

  // Textos dinámicos basados en el modo actual
  const getTitle = () => {
    if (viewMode === 'register') return 'Crear Cuenta'
    if (viewMode === 'forgot') return 'Recuperar Acceso'
    return 'Cacao Analysis'
  }

  const getSubtitle = () => {
    if (viewMode === 'register') return 'Registro en Base de Datos'
    if (viewMode === 'forgot') return 'Restablecer contraseña'
    return 'Plataforma de IA Agrícola'
  }

  const getButtonText = () => {
    if (viewMode === 'register') return 'Registrarse'
    if (viewMode === 'forgot') return 'Enviar Instrucciones'
    return 'Iniciar Sesión'
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cacao-800"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1580500930273-b27d34f0b51c?w=1600&h=900&fit=crop&auto=format')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-cacao-900/80 via-cacao-800/70 to-sage-900/75" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div
          className="bg-cacao-50/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 32px 64px rgba(26,14,3,0.4)' }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-sage-500 via-cacao-400 to-cacao-600" />

          <div className="px-8 pt-8 pb-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-cacao-700 flex items-center justify-center mb-3 shadow-lg">
                <CacaoIcon />
              </div>
              <h1 className="text-xl font-bold text-cacao-800 tracking-tight">
                {getTitle()}
              </h1>
              <p className="text-xs text-cacao-500 mt-0.5 tracking-wide uppercase">
                {getSubtitle()}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensajes dinámicos */}
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-xs font-semibold p-2.5 rounded-lg text-center border border-red-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-sage-50 text-sage-700 text-xs font-semibold p-2.5 rounded-lg text-center border border-sage-200">
                  {successMsg}
                </div>
              )}

              {/* Campos adicionales para registro */}
              {viewMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-cacao-700 mb-1.5 tracking-wide uppercase">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ingrese su nombre completo"
                    className="w-full px-3.5 py-2.5 bg-white border border-cacao-200 rounded-lg text-sm text-cacao-800 placeholder-cacao-300 focus:outline-none focus:border-cacao-500 focus:ring-2 focus:ring-cacao-200 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-cacao-700 mb-1.5 tracking-wide uppercase">
                  Usuario
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder={viewMode === 'register' ? "Elija un usuario" : "Ingrese su usuario"}
                  className="w-full px-3.5 py-2.5 bg-white border border-cacao-200 rounded-lg text-sm text-cacao-800 placeholder-cacao-300 focus:outline-none focus:border-cacao-500 focus:ring-2 focus:ring-cacao-200 transition-all"
                />
              </div>

              {/* Campo de correo electrónico para registro */}
              {viewMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-cacao-700 mb-1.5 tracking-wide uppercase">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-cacao-200 rounded-lg text-sm text-cacao-800 placeholder-cacao-300 focus:outline-none focus:border-cacao-500 focus:ring-2 focus:ring-cacao-200 transition-all"
                  />
                </div>
              )}
              
              {/* Ocultamos la contraseña si estamos en modo recuperar */}
              {viewMode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-cacao-700 mb-1.5 tracking-wide uppercase">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-cacao-200 rounded-lg text-sm text-cacao-800 placeholder-cacao-300 focus:outline-none focus:border-cacao-500 focus:ring-2 focus:ring-cacao-200 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 text-cacao-50 font-semibold text-sm rounded-lg transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-70 mt-2 ${
                  viewMode === 'register' ? 'bg-sage-700 hover:bg-sage-600' : 'bg-cacao-700 hover:bg-cacao-600'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  getButtonText()
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              {viewMode === 'login' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => { setViewMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs text-cacao-500 hover:text-cacao-700 transition-colors underline underline-offset-2"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setViewMode('register'); setErrorMsg(''); setSuccessMsg(''); setNombreCompleto(''); setCorreo(''); }}
                    className="text-xs text-sage-600 hover:text-sage-700 transition-colors font-medium"
                  >
                    + Registrar nuevo usuario
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => { setViewMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-sage-600 hover:text-sage-700 transition-colors font-medium"
                >
                  Volver a Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-cacao-200/60 mt-4">
          © 2026 Cacao Analysis · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

function CacaoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="16" rx="7" ry="9" fill="#c0844a" />
      <ellipse cx="14" cy="16" rx="4.5" ry="7" fill="#8b5e3c" opacity="0.6" />
      <path d="M14 7 C14 7 11 3 14 1 C17 3 14 7 14 7Z" fill="#6d9f48" />
      <line x1="14" y1="7" x2="14" y2="16" stroke="#4d7a2e" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="10" cy="15" rx="1.5" ry="3" fill="#d4a574" opacity="0.5" />
    </svg>
  )
}