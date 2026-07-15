import { useState } from 'react'

export default function SettingsView() {
  const [nombre, setNombre] = useState('Jorge Ramírez')
  const [correo, setCorreo] = useState('jorge.ramirez@fincalaspalmas.ec')
  const [passActual, setPassActual] = useState('')
  const [passNuevo, setPassNuevo] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [savedName, setSavedName] = useState(false)
  const [savedEmail, setSavedEmail] = useState(false)
  const [savedPass, setSavedPass] = useState(false)

  const flash = (setter: (v: boolean) => void) => {
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-cacao-800 tracking-tight">Configuración de Usuario</h2>
        <p className="text-sm text-stone-500 mt-1">Gestione su información personal y credenciales</p>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cacao-300 to-cacao-600 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-cacao-50">JR</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sage-500 rounded-full flex items-center justify-center border-2 border-white">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 6.5V3.5M3.5 5h3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div>
          <p className="font-bold text-cacao-800 text-lg leading-tight">{nombre}</p>
          <p className="text-sm text-stone-500">{correo}</p>
          <p className="text-xs text-cacao-400 mt-1">Agrónomo Senior · Finca Las Palmas</p>
        </div>
        <div className="ml-auto">
          <button className="px-4 py-2 border border-cacao-300 text-cacao-700 text-sm font-medium rounded-lg hover:bg-cacao-50 transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5A2.5 2.5 0 019.5 4v1H11a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1h1.5V4A2.5 2.5 0 017 1.5z" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Subir Foto de Perfil
          </button>
        </div>
      </div>

      {/* Change name */}
      <Section title="Cambiar Nombre" subtitle="Actualice su nombre completo">
        <div className="space-y-3">
          <FormField label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Ingrese su nombre" />
          <SaveButton saved={savedName} onClick={() => flash(setSavedName)} />
        </div>
      </Section>

      {/* Change email */}
      <Section title="Cambiar Correo" subtitle="Actualice su dirección de correo electrónico">
        <div className="space-y-3">
          <FormField label="Correo electrónico" value={correo} onChange={setCorreo} type="email" placeholder="correo@ejemplo.com" />
          <SaveButton saved={savedEmail} onClick={() => flash(setSavedEmail)} />
        </div>
      </Section>

      {/* Change password */}
      <Section title="Cambiar Contraseña" subtitle="Use una contraseña segura de al menos 8 caracteres">
        <div className="space-y-3">
          <FormField label="Contraseña actual" value={passActual} onChange={setPassActual} type="password" placeholder="••••••••" />
          <FormField label="Nueva contraseña" value={passNuevo} onChange={setPassNuevo} type="password" placeholder="••••••••" />
          <FormField label="Confirmar contraseña" value={passConfirm} onChange={setPassConfirm} type="password" placeholder="••••••••" />
          <SaveButton saved={savedPass} onClick={() => flash(setSavedPass)} label="Actualizar Contraseña" />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-cacao-800">{title}</h3>
        <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="border-t border-stone-100 pt-4">{children}</div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-cacao-800 placeholder-stone-300 focus:outline-none focus:border-cacao-400 focus:ring-2 focus:ring-cacao-100 transition-all"
      />
    </div>
  )
}

function SaveButton({
  saved,
  onClick,
  label = 'Guardar Cambios',
}: {
  saved: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
        saved
          ? 'bg-sage-500 text-white'
          : 'bg-cacao-700 hover:bg-cacao-600 text-cacao-50'
      }`}
    >
      {saved ? '✓ Guardado' : label}
    </button>
  )
}
