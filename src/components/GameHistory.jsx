import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

// MODIFICATION ICI : On passe à 10 par 10
const ITEMS_PER_PAGE = 10;

export default function GameHistory({ onBack }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHistory(0);
  }, []);

  const fetchHistory = async (pageIndex) => {
    // Si c'est la page 0, c'est un chargement initial (ou reload), sinon c'est un "Load More"
    if (pageIndex === 0) setLoading(true);
    else setLoadingMore(true);

    const allMatches = storage.getAllMatches().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const from = pageIndex * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    const data = allMatches.slice(from, to);

    if (data) {
      // Si on reçoit moins de données que demandé, c'est qu'on est à la fin
      if (data.length < ITEMS_PER_PAGE || to >= allMatches.length) {
        setHasMore(false);
      }

      // Gestion de l'ajout des données
      if (pageIndex === 0) {
        setMatches(data);
      } else {
        // On ajoute les nouveaux matchs à la suite des anciens
        setMatches(prev => [...prev, ...data]);
      }
      
      setPage(pageIndex);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    fetchHistory(page + 1);
  };

  // Logique de regroupement (Duel vs Solo)
  const processGroupedMatches = () => {
    const grouped = [];
    const processedIds = new Set();

    matches.forEach(item => {
      if (processedIds.has(item.id)) return;

      const opponents = matches.filter(d => d.created_at === item.created_at && d.id !== item.id);
      
      if (opponents.length > 0) {
         const opponent = opponents[0];
         processedIds.add(opponent.id);
         
         grouped.push({
           id: item.id,
           date: item.created_at,
           type: 'DUEL',
           mode: item.mode,
           // On trie : Gagnant en premier
           players: [item, opponent].sort((a, b) => a.result === 'WIN' ? -1 : 1) 
         });
      } else {
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
    
    return grouped;
  };

  const groupedMatches = processGroupedMatches();

  const handleDelete = async (match, e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce match de l'historique ?")) return;

    // Suppression visuelle immédiate
    setMatches(prev => prev.filter(m => !match.players.some(p => p.id === m.id)));

    // Suppression Locale
    const idsToDelete = match.players.map(p => p.id);
    storage.deleteMatches(idsToDelete);
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
          <>
            {groupedMatches.map((match) => {
              const isExpanded = expandedMatchId === match.id;
              const dateStr = new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' });
              const mainPlayer = match.players[0]; 
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

                      {/* Info Droite (Moyenne) */}
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

                          {/* Graphique d'évolution (Si données dispo) */}
                          {match.players[0].match_details && (
                              <div className="mt-4 pt-3 border-t border-white/5">
                                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Détails techniques</p>
                                  <div className="flex gap-2 justify-between bg-black/20 p-2 rounded-lg text-[10px]">
                                      {match.players.map(p => (
                                          <div key={p.id} className="flex flex-col">
                                              <span className="text-slate-400 font-bold">{p.winner_name}</span>
                                              <span className="text-emerald-400">180s: {p.scores_180s}</span>
                                              <span className="text-slate-300">140+: {p.scores_140plus}</span>
                                              <span className="text-slate-500">60+: {p.scores_60plus}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Actions */}
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
            })}

            {/* BOUTON CHARGER PLUS */}
            {hasMore && (
                <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 mt-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                    {loadingMore ? 'Chargement...' : '▼ Charger plus'}
                </button>
            )}
          </>
        )}
        
        <div className="h-6"></div>
      </div>
    </div>
  );
}