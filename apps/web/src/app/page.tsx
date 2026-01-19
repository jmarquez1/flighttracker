import Link from 'next/link'
import { Plane, Activity, Shield, Globe, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Radar Background Effect */}
      <div className="radar-scan" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      {/* HUD Header */}
      <nav className="relative z-10 w-full flex justify-between items-center p-8 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4 group">
          <div className="p-2 border border-indigo-500/30 group-hover:border-indigo-500 transition-colors">
            <Plane className="w-6 h-6 text-indigo-500" />
          </div>
          <span className="font-mono text-xl font-black tracking-widest uppercase">
            SKY<span className="text-indigo-500">_</span>TRACK
          </span>
        </div>
        <Link 
          href="/dashboard/trips" 
          className="font-mono text-sm px-8 py-3 border border-indigo-500 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all uppercase tracking-tighter"
        >
          Access Command Center
        </Link>
      </nav>

      {/* Hero Section - Cockpit Style */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 border border-indigo-500/20 rounded-full bg-indigo-500/5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-400">System Status: Operational</span>
        </div>
        
        <h1 className="text-6xl md:text-[120px] font-black leading-none uppercase tracking-tighter mb-8 italic">
          Total Flight <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Dominance
          </span>
        </h1>

        <p className="font-mono text-lg text-gray-400 max-w-2xl mb-12 uppercase tracking-tight">
          Automated real-time monitoring for group travel. <br/>
          Zero manual checks. Zero delays without alerts.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-white/5 border border-white/5 max-w-6xl w-full">
          {[
            { icon: Activity, title: 'Smart Polling', desc: 'Optimized API consumption via proximity-based frequency windows.' },
            { icon: Globe, title: 'Multi-Tenant', desc: 'Secure isolation for agencies, partners, and corporate travel desks.' },
            { icon: Shield, title: 'White Label', desc: 'Inject your operational DNA into every notification and portal.' }
          ].map((item, i) => (
            <div key={i} className="p-12 bg-[#050505] hover:bg-indigo-500/5 transition-colors group">
              <item.icon className="w-8 h-8 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-mono text-xl font-bold mb-4 uppercase tracking-widest">{item.title}</h3>
              <p className="text-sm text-gray-500 uppercase leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Strip */}
      <footer className="relative z-10 p-12 border-t border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.5em]">
            © 2026 // SKY-TRACK // SECURE PROTOCOL // V1.0.0
          </div>
          <div className="flex gap-12 font-mono text-[10px] uppercase tracking-widest text-indigo-500/50">
            <span>Lat: 59.9139 N</span>
            <span>Lon: 10.7522 E</span>
            <span>Alt: 32000 FT</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
