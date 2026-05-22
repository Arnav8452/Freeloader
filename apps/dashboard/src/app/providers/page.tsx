import { CheckCircle2, ChevronRight, GripVertical, Settings2 } from "lucide-react";

export default function ProvidersPage() {
  const providers = [
    { id: "gemini", name: "Google Gemini", status: "Active", latency: "340ms", color: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/20" },
    { id: "cerebras", name: "Cerebras Fast", status: "Active", latency: "110ms", color: "from-orange-500 to-amber-500", shadow: "shadow-orange-500/20" },
    { id: "groq", name: "Groq Cloud", status: "Rate Limited", latency: "-", color: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20" },
    { id: "openrouter", name: "OpenRouter Free", status: "Standby", latency: "520ms", color: "from-purple-500 to-violet-500", shadow: "shadow-purple-500/20" }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 relative z-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-[Outfit] text-white tracking-tight">AI Providers</h1>
        <p className="text-zinc-400 mt-1">Configure your API keys, routing priority, and active circuit breakers.</p>
      </div>

      {/* Main Content */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white font-[Outfit]">Routing Priority</h2>
          <button className="text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors">
            Add Custom Provider
          </button>
        </div>

        <div className="space-y-3">
          {providers.map((provider, idx) => (
            <div key={provider.id} className="group flex items-center gap-4 p-4 rounded-xl bg-card-border/20 border border-card-border/50 hover:bg-card-border/40 transition-colors cursor-pointer">
              <div className="cursor-grab active:cursor-grabbing text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>
              
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${provider.color} flex items-center justify-center font-bold text-white shadow-lg ${provider.shadow}`}>
                {provider.name.charAt(0)}
              </div>
              
              <div className="flex-1">
                <h3 className="text-base font-semibold text-zinc-200">{provider.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    provider.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                    provider.status === 'Standby' ? 'bg-zinc-500/10 text-zinc-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {provider.status}
                  </span>
                  <span className="text-xs text-zinc-500">Latency: {provider.latency}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right mr-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Priority</p>
                  <p className="text-lg font-semibold text-zinc-300 font-[Outfit]">#{idx + 1}</p>
                </div>
                <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Settings2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
