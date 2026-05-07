export default function Navbar({ metrics }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-slate-200/50 backdrop-blur-md bg-slate-50/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs text-white shadow-sm">⚡</div>
          <span className="text-slate-900 font-bold tracking-tight">RidePricer AI</span>
          <span className="text-slate-500 text-xs ml-1 font-medium bg-slate-200/50 px-1.5 rounded-md">v2</span>
        </div>
        <div className="flex items-center gap-4">
          {metrics && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Model R² {(metrics.r2_test * 100).toFixed(1)}%
            </div>
          )}
          <a
            href="https://github.com/MukundBansal/RidePricerAI"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm font-medium"
          >
            GitHub
          </a>
          <span className="px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold shadow-sm">
            PBL Project
          </span>
        </div>
      </div>
    </nav>
  )
}
