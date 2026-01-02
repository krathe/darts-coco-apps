import { useState } from 'react';

export default function GameSetup({ onStart, onShowHistory, onShowStats }) {
  const [mode, setMode] = useState(501);
  const [gameType, setGameType] = useState('SOLO');
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  
  // Settings avancés (Sets/Legs)
  const [setsToWin, setSetsToWin] = useState(1);
  const [legsToWin, setLegsToWin] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalP1Name = p1Name.trim();
    let finalP2Name = p2Name.trim();

    if (gameType === 'SOLO') finalP1Name = finalP1Name || "Training";
    else {
      finalP1Name = finalP1Name || "Joueur 1";
      finalP2Name = finalP2Name || "Joueur 2";
    }

    onStart({ 
      mode, gameType, p1Name: finalP1Name, p2Name: finalP2Name,
      setsToWin, legsToWin 
    });
  };

  const selectProMode = () => {
    setMode(501);
    setGameType('DUEL');
    setSetsToWin(4);
    setLegsToWin(3);
    setShowAdvanced(true);
  };

  return (
    <div className="w-full max-w-sm flex flex-col min-h-[85vh] animate-in fade-in duration-500 font-kanit pb-safe">
      
      {/* HEADER TITRE */}
      <div className="text-center mt-4 mb-6 shrink-0">
        <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-lg">
          DARTS PRO
        </h1>
        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mt-1">Ultimate Training App</p>
      </div>

      {/* CARTE PRINCIPALE DE CONFIGURATION */}
      <div className="bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden mx-4 shrink-0">
        
        {/* Effet de fond */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
          
          {/* SÉLECTEUR DE MODE (CARTES) */}
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block ml-1">Mode de Jeu</label>
            <div className="flex gap-3">
              {[301, 501].map((m) => (
                <button
                  key={m} type="button" onClick={() => setMode(m)}
                  className={`
                    flex-1 py-4 rounded-2xl font-black text-xl border-2 transition-all duration-300 relative overflow-hidden group
                    ${mode === m 
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-900/50 to-slate-900 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105' 
                      : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-500'
                    }
                  `}
                >
                  <span className="relative z-10">{m}</span>
                  {mode === m && <div className="absolute inset-0 bg-emerald-400/10 animate-pulse"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* SÉLECTEUR TYPE (SLIDER) */}
          <div className="bg-slate-900/80 p-1 rounded-xl flex relative">
            <div 
                className={`absolute top-1 bottom-1 w-[48%] bg-slate-700 rounded-lg shadow transition-all duration-300 ease-out ${gameType === 'DUEL' ? 'translate-x-[104%]' : 'translate-x-0'}`}
            ></div>
            <button type="button" onClick={() => setGameType('SOLO')} className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${gameType === 'SOLO' ? 'text-white' : 'text-slate-500'}`}>👤 SOLO</button>
            <button type="button" onClick={() => setGameType('DUEL')} className={`flex-1 py-2 text-xs font-bold z-10 transition-colors ${gameType === 'DUEL' ? 'text-white' : 'text-slate-500'}`}>👥 DUEL</button>
          </div>

          {/* INPUTS JOUEURS */}
          <div className="space-y-3">
             {/* Joueur 1 (Toujours visible) */}
             <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    {gameType === 'SOLO' ? '🎯' : '🔴'}
                </div>
                <input 
                    type="text" 
                    placeholder={gameType === 'SOLO' ? "Nom du profil (Optionnel)" : "Nom Joueur 1"} 
                    value={p1Name} 
                    onChange={(e) => setP1Name(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 placeholder:font-normal" 
                />
             </div>

             {/* Joueur 2 (Animation Slide) */}
             <div className={`transition-all duration-300 overflow-hidden ${gameType === 'DUEL' ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">🔵</div>
                    <input 
                        type="text" 
                        placeholder="Nom Joueur 2" 
                        value={p2Name} 
                        onChange={(e) => setP2Name(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 placeholder:font-normal" 
                    />
                </div>
             </div>
          </div>

          {/* OPTIONS AVANCÉES (Accordéon) */}
          <div className="border-t border-white/5 pt-2">
             <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition mb-2">
                {showAdvanced ? '▼ Masquer Options' : '▶ Options Match (Sets/Legs)'}
             </button>
             
             <div className={`grid grid-cols-2 gap-3 transition-all duration-300 overflow-hidden ${showAdvanced ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Sets pour gagner</label>
                    <select value={setsToWin} onChange={(e) => setSetsToWin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg py-2 px-2 focus:border-emerald-500 outline-none">
                        {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Legs par Set</label>
                    <select value={legsToWin} onChange={(e) => setLegsToWin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg py-2 px-2 focus:border-emerald-500 outline-none">
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
             </div>
          </div>

          {/* ACTION PRINCIPALE */}
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg py-4 rounded-2xl shadow-[0_5px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_5px_25px_rgba(16,185,129,0.6)] transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mt-2">
            <span>JOUER</span>
            <span className="text-xl">🚀</span>
          </button>

        </form>
      </div>

      {/* BOUTON SPECIAL "PRO MODE" (GOLD) - Avec plus de marge */}
      <div className="px-4 mt-6 mb-8 shrink-0">
        <button 
            type="button"
            onClick={selectProMode}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-700/80 to-yellow-600/80 border border-amber-500/30 text-amber-100 flex items-center justify-between hover:brightness-110 active:scale-95 transition-all shadow-lg group"
        >
            <div className="flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 group-hover:text-white transition-colors">🏆 Championnat</span>
                <span className="text-[10px] opacity-70">501 • 4 Sets • 3 Legs</span>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform">➔</span>
        </button>
      </div>

      {/* FOOTER NAVIGATION - Alignement bas */}
      <div className="mt-auto px-6 grid grid-cols-2 gap-4 pb-4">
        <button 
          onClick={onShowHistory}
          className="flex flex-col items-center justify-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl group-hover:bg-slate-700 group-hover:border-slate-500 transition-all shadow-lg">
            📜
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">Historique</span>
        </button>

        <button 
          onClick={onShowStats}
          className="flex flex-col items-center justify-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl group-hover:bg-slate-700 group-hover:border-emerald-500/50 transition-all shadow-lg">
            📈
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Stats</span>
        </button>
      </div>

    </div>
  );
}