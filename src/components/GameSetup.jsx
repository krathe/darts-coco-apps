import { useState } from 'react';

export default function GameSetup({ onStart, onShowHistory, onShowStats }) {
  const [mode, setMode] = useState(501);
  const [gameType, setGameType] = useState('SOLO');
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  
  // Configuration Match PRO
  const [setsToWin, setSetsToWin] = useState(1);
  const [legsToWin, setLegsToWin] = useState(1);

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
    setSetsToWin(4); // 4 Sets
    setLegsToWin(3); // 3 Legs
  };

  return (
    <div className="w-full max-w-sm bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Nouvelle Partie 🎯</h2>
      
      {/* BOUTON MATCH PRO */}
      <button 
        type="button"
        onClick={selectProMode}
        className="w-full mb-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg border-2 border-orange-400/50 flex items-center justify-center gap-2"
      >
        <span>🏆 MODE CHAMPIONNAT</span>
        <span className="text-xs font-normal bg-black/20 px-2 py-0.5 rounded">(501 • 4 Sets • 3 Legs)</span>
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-slate-700 pt-4">
        
        {/* Choix 301 / 501 */}
        <div className="flex gap-2">
          {[301, 501].map((m) => (
            <button
              key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg font-bold border-2 transition ${
                mode === m ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-600 text-slate-500 hover:border-slate-500'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Choix SOLO / DUEL */}
        <div className="flex bg-slate-900 rounded-lg p-1">
          <button type="button" onClick={() => setGameType('SOLO')} className={`flex-1 py-2 rounded-md font-bold text-sm transition ${gameType === 'SOLO' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>👤 SOLO</button>
          <button type="button" onClick={() => setGameType('DUEL')} className={`flex-1 py-2 rounded-md font-bold text-sm transition ${gameType === 'DUEL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>👥 DUEL</button>
        </div>
        
        {/* PARAMETRES AVANCES (Sets/Legs) */}
        <div className="grid grid-cols-2 gap-3 text-sm">
           <div>
             <label className="text-slate-400 text-xs uppercase">Sets gagnants</label>
             <select value={setsToWin} onChange={(e) => setSetsToWin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mt-1">
               {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
             </select>
           </div>
           <div>
             <label className="text-slate-400 text-xs uppercase">Legs / Set</label>
             <select value={legsToWin} onChange={(e) => setLegsToWin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mt-1">
               {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
             </select>
           </div>
        </div>

        {gameType === 'DUEL' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <input type="text" placeholder="Joueur 1" value={p1Name} onChange={(e) => setP1Name(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
            <input type="text" placeholder="Joueur 2" value={p2Name} onChange={(e) => setP2Name(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500" />
          </div>
        )}

        <button type="submit" className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition">
          LANCER
        </button>
      </form>

      {/* BOUTONS SECONDAIRES (HISTORIQUE & STATS) */}
      <div className="mt-6 flex gap-3">
        <button 
          onClick={onShowHistory}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-300 transition flex flex-col items-center justify-center gap-1 border border-transparent hover:border-slate-500"
        >
          <span className="text-xl">📜</span>
          <span>Historique</span>
        </button>

        <button 
          onClick={onShowStats}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-emerald-400 transition flex flex-col items-center justify-center gap-1 border border-emerald-500/30 hover:border-emerald-500"
        >
          <span className="text-xl">📈</span>
          <span>Statistiques</span>
        </button>
      </div>
    </div>
  );
}