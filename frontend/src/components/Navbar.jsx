export default function Navbar({ metrics }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs">⚡</div>
          <span className="text-white font-bold tracking-tight">RidePricer AI</span>
          <span className="text-white/20 text-xs ml-1">v2</span>
        </div>
        <div className="flex items-center gap-4">
          {metrics && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Model R² {(metrics.r2_test * 100).toFixed(1)}%
            </div>
          )}
          <a
            href="https://github.com/MukundBansal/RidePricerAI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all"
          >
            GitHub
          </a>
          <span className="px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs">
            PBL Project
          </span>
        </div>
      </div>
    </nav>
  )
}
