import { Activity, ArrowUpRight, CheckCircle2, Zap, AlertCircle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[Outfit] text-white tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Monitor your AI gateway routing and free-tier savings.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
          </span>
          <span className="text-sm font-medium text-brand-500">Live Traffic</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Requests</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">124,592</h2>
              <p className="text-sm text-emerald-400 flex items-center gap-1 mt-2 font-medium">
                <ArrowUpRight className="w-3 h-3" /> +12.5% this week
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Estimated Savings</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">$342.50</h2>
              <p className="text-sm text-purple-400 flex items-center gap-1 mt-2 font-medium">
                Compared to GPT-4o
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Circuit Breakers</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">1 Open</h2>
              <p className="text-sm text-rose-400 flex items-center gap-1 mt-2 font-medium">
                Groq API Rate Limited
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Routing Events */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white font-[Outfit] mb-4">Recent Routing Log</h3>
          
          <div className="space-y-3">
            {[
              { id: 1, provider: "Gemini 1.5 Flash", status: "Success", latency: "420ms", tokens: "42" },
              { id: 2, provider: "Cerebras Llama 3", status: "Success", latency: "112ms", tokens: "156" },
              { id: 3, provider: "Groq Llama 3", status: "Failed", latency: "2500ms", tokens: "0" },
              { id: 4, provider: "Gemini 1.5 Flash", status: "Fallback", latency: "350ms", tokens: "156" },
            ].map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-card-border/20 border border-card-border/50 hover:bg-card-border/40 transition-colors">
                <div className="flex items-center gap-3">
                  {log.status === "Success" || log.status === "Fallback" ? (
                    <CheckCircle2 className={`w-5 h-5 ${log.status === 'Fallback' ? 'text-amber-500' : 'text-emerald-500'}`} />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{log.provider}</p>
                    <p className="text-xs text-zinc-500">2 mins ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-300">{log.latency}</p>
                  <p className="text-xs text-zinc-500">{log.tokens} tokens</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Distribution */}
        <div className="glass-panel rounded-2xl p-6">
           <h3 className="text-lg font-semibold text-white font-[Outfit] mb-4">Provider Usage</h3>
           
           <div className="space-y-4 mt-6">
             <div>
               <div className="flex justify-between text-sm mb-1.5">
                 <span className="text-zinc-300">Gemini</span>
                 <span className="text-zinc-400 font-medium">65%</span>
               </div>
               <div className="h-2 w-full bg-card-border rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
               </div>
             </div>
             
             <div>
               <div className="flex justify-between text-sm mb-1.5">
                 <span className="text-zinc-300">Cerebras</span>
                 <span className="text-zinc-400 font-medium">25%</span>
               </div>
               <div className="h-2 w-full bg-card-border rounded-full overflow-hidden">
                 <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
               </div>
             </div>

             <div>
               <div className="flex justify-between text-sm mb-1.5">
                 <span className="text-zinc-300">Groq</span>
                 <span className="text-zinc-400 font-medium">10%</span>
               </div>
               <div className="h-2 w-full bg-card-border rounded-full overflow-hidden">
                 <div className="h-full bg-rose-500 rounded-full" style={{ width: '10%' }}></div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
