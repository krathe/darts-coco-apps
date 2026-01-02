import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function GameHistory({ onBack }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'SOLO', 'DUEL'

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    // On récupère tout (Win et Loss) pour avoir l'historique complet
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Erreur:", error);
    else setMatches(data || []);
    setLoading(false);
  };

  // Filtrage
  const filteredMatches = matches.filter(m => {
    if (filter === 'ALL') return true;
    return m.game_type === filter;
  });

  // Groupement par Date (Aujourd'hui, Hier, etc.)
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = new Date(match.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Labels intelligents
    if (date.toDateString() === today.toDateString()) dateLabel = "Aujourd'hui";
    else if (date.toDateString() === yesterday.toDateString()) dateLabel = "Hier";

    if (!groups[dateLabel]) groups[dateLabel] = [];
    groups[dateLabel].push(match);
    return groups;
  }, {});

  const MatchCard = ({ match }) => {
    // Détection Victoire/Défaite (Pour les Duels)
    const isWin = match.result === 'WIN';
    const isSolo = match.game_type === 'SOLO';
    
    // Couleur de bordure
    let borderClass = "border-l-4 border-slate-600"; // Défaut
    if (isSolo) borderClass = "border-l-4 border-blue-500";
    else if (isWin) borderClass = "border-l-4 border-emerald-500";
    else borderClass = "border-l-4 border-red-500";

    return (
      <div className={`glass-panel p-3 rounded-r-xl rounded-l-md mb-3 flex items-center justify-between relative overflow-hidden ${borderClass}`}>
        
        {/* Fond subtil Win/Loss */}
        {!isSolo && isWin && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>}
        {!isSolo && !isWin && <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>}

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white uppercase tracking-wide">
              {match.game_type === 'SOLO' ? 'Training' : match.winner_name}
            </span>
            {/* Badges de Performance */}
            {match.scores_180s > 0 && (
              <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">180!</span>
            )}
            {match.highest_checkout >= 100 && (
              <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-500/30">HF {match.highest_checkout}</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
             <div className="flex items-center gap-1">
               <span>🎯</span> {match.darts} fléchettes
             </div>
             <div className="flex items-center gap-1">
               <span>🏁</span> {match.checkout}
             </div>
          </div>
        </div>

        {/* Colonne de droite : Moyenne */}
        <div className="flex flex-col items-end z-10 pl-4">
           <span className="text-2xl font-black text-white leading-none">{Number(match.avg).toFixed(1)}</span>
           <span className="text-[8px] text-slate-500 uppercase font-bold mt-1">Moyenne</span>
           {/* Badge Résultat pour Duel */}
           {!isSolo && (
             <span className={`text-[9px] font-black px-1.5 rounded mt-1 ${isWin ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-white'}`}>
               {isWin ? 'W' : 'L'}
             </span>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white font-kanit flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur border-b border-white/5 z-20">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1"><span>←</span> Menu</button>
        <h2 className="text-emerald-400 font-black tracking-widest text-lg">JOURNAL</h2>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Filtres */}
      <div className="p-4 pb-0">
        <div className="bg-slate-800 rounded-lg p-1 flex">
           {['ALL', 'SOLO', 'DUEL'].map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`flex-1 py-1 text-xs font-bold rounded transition ${filter === f ? 'bg-slate-600 text-white shadow' : 'text-slate-500'}`}
             >
               {f === 'ALL' ? 'TOUT' : f}
             </button>
           ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {loading ? (
          <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement...</div>
        ) : Object.keys(groupedMatches).length === 0 ? (
          <div className="text-center mt-20 text-slate-500">Aucun historique.</div>
        ) : (
          Object.keys(groupedMatches).map(dateLabel => (
            <div key={dateLabel} className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 pl-1 sticky top-0 bg-slate-900/95 py-2 z-10 backdrop-blur-sm">
                {dateLabel}
              </h3>
              {groupedMatches[dateLabel].map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ))
        )}
        <div className="h-10"></div> {/* Espace bas */}
      </div>
    </div>
  );
}