import Link from 'next/link'
import { Plane, Bell, Shield, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white text-gray-900">
      {/* Hero Section */}
      <nav className="w-full max-w-6xl flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <Plane className="w-8 h-8 text-indigo-600" />
          <span className="text-2xl font-bold tracking-tight">FlightTracker</span>
        </div>
        <Link 
          href="/dashboard/trips" 
          className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Ir al Dashboard
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          Seguimiento de vuelos <br/>
          <span className="text-indigo-600">inteligente y automático.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">
          Notificaciones en tiempo real para grupos de viaje. Mantén a tus clientes informados de cada cambio, retraso o puerta de embarque.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Bell className="w-10 h-10 text-indigo-500 mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Alertas SMS/Email</h3>
            <p className="text-sm text-gray-500">Notifica automáticamente a pasajeros y admins sobre cualquier cambio.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Users className="w-10 h-10 text-indigo-500 mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Multi-tenant</h3>
            <p className="text-sm text-gray-500">Cada organización gestiona sus propios grupos de forma aislada y segura.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Shield className="w-10 h-10 text-indigo-500 mb-4 mx-auto" />
            <h3 className="font-bold text-lg mb-2">Marca Blanca</h3>
            <p className="text-sm text-gray-500">Personaliza el portal con tu logo y colores corporativos.</p>
          </div>
        </div>
      </div>

      <footer className="p-10 text-gray-400 text-sm">
        © 2026 Flight Tracker SaaS. Todos los derechos reservados.
      </footer>
    </main>
  )
}
