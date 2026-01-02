export default function GameStats({ winner, stats, onRestart }) {
  if (!winner) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-300">
      <div className="text-6xl mb-4 animate-bounce">🏆</div>
      <h2 className="text-4xl font-bold text-white mb-2">VICTOIRE !</h2>
      <p className="text-xl text-emerald-400 font-bold mb-8">{winner.name}</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Moyenne</span>
          <span className="text-3xl font-bold text-white font-mono">{stats.avg}</span>
          <span className="text-slate-500 text-[10px]">pts / 3 flèches</span>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Fléchettes</span>
          <span className="text-3xl font-bold text-white font-mono">{winner.stats.totalDarts}</span>
          <span className="text-slate-500 text-[10px]">Total lancers</span>
        </div>
        <div className="col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Réussite aux Doubles</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">{stats.checkout}</span>
            <span className="text-slate-500 text-sm mb-1">(1 / {winner.stats.doublesAttempted})</span>
          </div>
        </div>
      </div>

      <button onClick={onRestart} className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2">
        <span>NOUVELLE PARTIE</span><span>↺</span>
      </button>
    </div>
  );
}