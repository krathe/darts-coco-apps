import { useEffect } from 'react';

export default function GameStats({ winner, stats, onRestart }) {
  
  // Petite vibration au montage (si supporté)
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }, []);

  // Extraction des données brutes pour affichage conditionnel
  const rawStats = winner.stats || {};
  const bestLeg = rawStats.bestLeg || '-'; // Faudra s'assurer que c'est calculé, sinon on cache
  const highestCheckout = rawStats.highestCheckout || 0;
  const total180 = rawStats.scores180 || 0;
  const total140 = rawStats.scores140 || 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/95 backdrop-blur-md animate-in fade-in duration-500 font-kanit">
      
      {/* EFFETS DE LUMIÈRE D'ARRIÈRE PLAN */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>

      {/* CARTE DE VICTOIRE */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
        
        {/* EN-TÊTE : VICTOIRE */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
                <div className="text-5xl mb-2 drop-shadow-lg animate-bounce">🏆</div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                    VICTOIRE !
                </h2>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-[0.3em] mt-1 opacity-80">Match Terminé</p>
            </div>
        </div>

        {/* CORPS : LE JOUEUR & LA MOYENNE */}
        <div className="p-6 flex flex-col items-center gap-6">
            
            {/* Nom du Vainqueur */}
            <div className="text-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-wide">{winner.name}</h3>
                <div className="h-1 w-12 bg-emerald-500 rounded-full mx-auto mt-2"></div>
            </div>

            {/* LA STAT ROI : MOYENNE */}
            <div className="flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl p-4 border border-white/5 w-full">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Moyenne Globale</span>
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                    {stats.avg}
                </span>
            </div>

            {/* GRILLE DE DÉTAILS */}
            <div className="grid grid-cols-2 gap-3 w-full">
                
                {/* Checkout % */}
                <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Doubles</span>
                    <span className="text-2xl font-black text-emerald-400">{stats.checkout}</span>
                </div>

                {/* Highest Checkout */}
                <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">High Finish</span>
                    <span className="text-2xl font-black text-amber-400">{highestCheckout > 0 ? highestCheckout : '-'}</span>
                </div>

                {/* 180s & 140s */}
                <div className="col-span-2 bg-slate-800/50 p-3 rounded-xl border border-white/5 flex justify-around items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">180s</span>
                        <span className={`text-xl font-black ${total180 > 0 ? 'text-white' : 'text-slate-600'}`}>{total180}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">140s</span>
                        <span className={`text-xl font-black ${total140 > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{total140}</span>
                    </div>
                </div>

            </div>
        </div>

        {/* PIED DE PAGE : ACTIONS */}
        <div className="p-4 bg-slate-950/50 border-t border-white/5 flex gap-3">
            <button 
                onClick={() => window.location.reload()} // Retour menu simple (ou reload pour clean state)
                className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-700 hover:text-white transition active:scale-95"
            >
                Menu
            </button>
            
            <button 
                onClick={onRestart}
                className="flex-[2] py-4 rounded-xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition active:scale-95 flex items-center justify-center gap-2"
            >
                <span>Rejouer</span>
                <span className="text-lg">↻</span>
            </button>
        </div>

      </div>
    </div>
  );
}