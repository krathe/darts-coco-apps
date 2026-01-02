import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function GameHistory({ onBack }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    // 1. Récupération des données brutes
    const { data } = await supabase
      .from('matches')
      .select('*')
      .neq('id', -1)
      .order('created_at', { ascending: false });

    if (data) {
      // 2. Regroupement par Date (Timestamp exact) pour fusionner les Duels
      const grouped = [];
      const processedIds = new Set();

      data.forEach(item => {
        if (processedIds.has(item.id)) return;

        // On cherche s'il y a un autre enregistrement avec la même date (le même match)
        const opponents = data.filter(d => d.created_at === item.created_at && d.id !== item.id);
        
        // C'est un Duel si on trouve un adversaire
        if (opponents.length > 0) {
           const opponent = opponents[0];
           processedIds.add(opponent.id);
           
           // On crée un objet "Match Duel"
           grouped.push({
             id: item.id, // ID unique pour la clé
             date: item.created_at,
             type: 'DUEL',
             mode: item.mode,
             players: [item, opponent].sort((a, b) => a.result === 'WIN' ? -1 : 1) // Le gagnant en premier
           });
        } else {
           // C'est un Solo
           grouped.push({
             id: item.id,
             date: item.created_at,
             type: 'SOLO',
             mode: item.mode,
             players: [item]
           });
        }
        processedIds.add(item.id);
      });

      setMatches(grouped);
    }
    setLoading(false);
  };

  const handleDelete = async (match, e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce match de l'historique ?")) return;

    // Suppression visuelle
    setMatches(prev => prev.filter(m => m.id !== match.id));

    // Suppression DB (tous les IDs liés au match)
    const idsToDelete = match.players.map(p => p.id);
    await supabase.from('matches').delete().in('id', idsToDelete);
  };

  const toggleExpand = (id) => {
    setExpandedMatchId(expandedMatchId === id ? null : id);
  };

  return (
    <div className="w-full h-screen bg-[#0f172a] text-white font-kanit flex flex-col overflow-hidden pb-safe">
      
      {/* HEADER FIXE */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur border-b border-white/5 z-50">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Menu
        </button>
        <h2 className="text-emerald-400 font-black tracking-[0.2em] text-sm">JOURNAL</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        
        {loading ? (
          <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement...</div>
        ) : matches.length === 0 ? (
          <div className="text-center mt-32 opacity-50">
             <div className="text-6xl mb-4">📜</div>
             <p className="text-sm font-bold uppercase tracking-widest">Historique vide</p>
          </div>
        ) : (
          matches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const dateStr = new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' });
            const mainPlayer = match.players[0]; // Gagnant ou Solo
            const isDuel = match.type === 'DUEL';

            return (
              <div 
                key={match.id}
                onClick={() => toggleExpand(match.id)}
                className={`
                    w-full bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300
                    ${isExpanded ? 'bg-slate-800 border-emerald-500/30 shadow-2xl' : 'hover:bg-slate-800/80 active:scale-[0.98]'}
                `}
              >
                {/* 1. RÉSUMÉ (Carte visible) */}
                <div className="p-4 flex items-center justify-between">
                    
                    {/* Info Gauche */}
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border border-white/10 shadow-lg
                            ${isDuel ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' : 'bg-slate-700 text-emerald-400'}
                        `}>
                            {match.mode}
                        </div>
                        <div className="flex flex-col">
                            {isDuel ? (
                                <div className="flex items-baseline gap-1">
                                    <span className="font-bold text-white text-sm">{mainPlayer.winner_name}</span>
                                    <span className="text-xs text-slate-500 font-bold">vs</span>
                                    <span className="text-sm text-slate-400">{match.players[1]?.winner_name}</span>
                                </div>
                            ) : (
                                <span className="font-bold text-white text-sm">{mainPlayer.winner_name}</span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono uppercase">{dateStr}</span>
                        </div>
                    </div>

                    {/* Info Droite (Moyenne ou Score) */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xl font-black text-white leading-none">{mainPlayer.avg}</div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase">Avg</div>
                        </div>
                        <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                    </div>
                </div>

                {/* 2. DÉTAILS (Visible au clic) */}
                {isExpanded && (
                    <div className="border-t border-white/5 bg-black/20 p-4 animate-in slide-in-from-top-2 fade-in duration-300">
                        
                        {/* Tableau de stats */}
                        <div className="w-full text-xs">
                            <div className="grid grid-cols-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
                                <div className="text-left pl-2">Joueur</div>
                                <div>Moyenne</div>
                                <div>Doubles</div>
                                <div>Best</div>
                            </div>
                            
                            <div className="space-y-2">
                                {match.players.map((p, idx) => (
                                    <div key={idx} className={`grid grid-cols-4 items-center bg-white/5 rounded-lg p-2 text-center ${p.result === 'WIN' ? 'border border-emerald-500/30' : 'border border-transparent'}`}>
                                        <div className="text-left font-bold text-white truncate flex items-center gap-1">
                                            {p.result === 'WIN' && <span className="text-amber-400">👑</span>}
                                            {p.winner_name}
                                        </div>
                                        <div className="font-mono text-emerald-300 font-bold">{p.avg}</div>
                                        <div className="font-mono text-slate-300">{p.checkout || '-'}</div>
                                        <div className="font-mono text-slate-300">{p.darts} <span className="text-[8px] text-slate-500">fl.</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions (Supprimer) */}
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={(e) => handleDelete(match, e)}
                                className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                                🗑️ Supprimer le match
                            </button>
                        </div>

                    </div>
                )}

              </div>
            );
          })
        )}
        
        <div className="h-6"></div>
      </div>
    </div>
  );
}