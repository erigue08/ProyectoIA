export default function SupportView() {
  const contacts = [
    {
      name: 'Soporte Técnico Principal',
      phone: '+593 2 234-5678',
      mobile: '+593 98 765-4321',
      email: 'soporte@cacaoanalysis.ec',
      hours: 'Lun–Vie 8:00 – 18:00',
    },
    {
      name: 'Atención al Cliente',
      phone: '+593 2 234-5690',
      mobile: '+593 99 123-4567',
      email: 'atencion@cacaoanalysis.ec',
      hours: 'Lun–Sáb 8:00 – 20:00',
    },
    {
      name: 'Emergencias y Soporte 24/7',
      phone: null,
      mobile: '+593 98 000-1234',
      email: 'emergencias@cacaoanalysis.ec',
      hours: 'Disponible 24 horas',
    },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-cacao-800 tracking-tight">Números de Contacto</h2>
        <p className="text-sm text-stone-500 mt-1">Comuníquese con nuestro equipo de soporte y asistencia técnica</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-cacao-700 to-cacao-600 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="white" strokeWidth="1.5" />
            <path d="M7 8h6M7 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-cacao-50">¿Necesita ayuda inmediata?</p>
          <p className="text-xs text-cacao-200 mt-0.5">Nuestro equipo técnico responde en menos de 2 horas hábiles</p>
        </div>
        <a href="mailto:soporte@cacaoanalysis.ec" className="ml-auto flex-shrink-0 px-4 py-2 bg-white text-cacao-700 text-xs font-semibold rounded-lg hover:bg-cacao-50 transition-all">
          Enviar correo
        </a>
      </div>

      {/* Contact cards */}
      <div className="space-y-4">
        {contacts.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-cacao-800">{c.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-sage-600 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500 inline-block" />
                  {c.hours}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {c.phone && (
                <ContactRow icon={<PhoneIcon />} label="Teléfono fijo" value={c.phone} href={`tel:${c.phone}`} />
              )}
              <ContactRow icon={<MobileIcon />} label="Celular / WhatsApp" value={c.mobile} href={`tel:${c.mobile}`} />
              <ContactRow icon={<EmailIcon />} label="Correo electrónico" value={c.email} href={`mailto:${c.email}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 mt-4">
        <h3 className="text-sm font-bold text-cacao-800 mb-3">Oficinas Principales</h3>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cacao-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="#8b5e3c" strokeWidth="1.3" />
              <circle cx="8" cy="6" r="1.5" stroke="#8b5e3c" strokeWidth="1.3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-cacao-800">Av. de los Cítricos 247, Piso 3</p>
            <p className="text-xs text-stone-500 mt-0.5">Guayaquil, Ecuador · CP 090150</p>
            <p className="text-xs text-stone-400 mt-1">Edificio AgroTec, junto al Ministerio de Agricultura</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 group"
    >
      <div className="w-8 h-8 rounded-lg bg-cacao-50 group-hover:bg-cacao-100 flex items-center justify-center flex-shrink-0 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className="text-sm font-semibold text-cacao-700 group-hover:text-cacao-900 transition-colors">{value}</p>
      </div>
    </a>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 1.5H3a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V2.5a1 1 0 00-1-1H9M5 1.5h4M5 1.5a.5.5 0 000 1h4a.5.5 0 000-1" stroke="#8b5e3c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="3.5" y="1" width="7" height="12" rx="1.5" stroke="#8b5e3c" strokeWidth="1.2" />
      <circle cx="7" cy="11" r="0.7" fill="#8b5e3c" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="#8b5e3c" strokeWidth="1.2" />
      <path d="M1.5 4.5l5.5 4 5.5-4" stroke="#8b5e3c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
