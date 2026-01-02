import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export default function GameHistory({ onBack }) {
  const [rawMatches, setRawMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [selectedMatch, setSelectedMatch] = useState(null); // Pour la modale de détails
  
  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const MATCHES_PER_PAGE = 20;

  useEffect(() => { fetchHistory(0); }, []);

  const fetchHistory = async (pageIndex = 0) => {
    setLoading(true);
    let offlineMatches = [];
    
    // 1. Charger Offline (Page 0 uniquement)
    if (pageIndex === 0) {
      try {
        const stored = localStorage.getItem('unsynced_matches');
        if (stored) {
          offlineMatches = JSON.parse(stored).map((m, idx) => ({
            ...m, id: `local-${Date.now()}-${idx}`, isOffline: true 
          })).reverse();
        }
      } catch (e) { console.error(e); }
    }

    // 2. Charger Online
    const from = pageIndex * MATCHES_PER_PAGE;
    const to = from + MATCHES_PER_PAGE - 1;

    try {
        const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

        if (error) throw error;

        const newMatches = data || [];
        if (newMatches.length < MATCHES_PER_PAGE) setHasMore(false);

        setRawMatches(prev => {
            if (pageIndex === 0) return [...offlineMatches, ...newMatches];
            return [...prev, ...newMatches];
        });
        setPage(pageIndex);
        
    } catch (error) {
        console.warn("Mode Hors-Ligne / Erreur API", error);
        if (pageIndex === 0) {
            setRawMatches(offlineMatches);
            setHasMore(false); 
        }
    } finally {
        setLoading(false);
    }
  };

  const handleLoadMore = () => fetchHistory(page + 1);

  const handleDelete = async (itemsToDelete, e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce match de l'historique ?")) return;

    // itemsToDelete est un tableau (1 élément pour Solo, 2 pour Duel)
    const ids = itemsToDelete.map(m => m.id);
    const isOffline = itemsToDelete[0].isOffline;

    if (isOffline) {
      const stored = JSON.parse(localStorage.getItem('unsynced_matches') || '[]');
      // On filtre ceux qui NE sont PAS dans la liste à supprimer
      const newStored = stored.filter(m => !ids.some(delId => 
         // Comparaison un peu tricky pour le local, on utilise le created_at si l'id est généré
         m.created_at === itemsToDelete[0].created_at 
      ));
      localStorage.setItem('unsynced_matches', JSON.stringify(newStored));
      setRawMatches(prev => prev.filter(m => m.created_at !== itemsToDelete[0].created_at));
    } else {
      const { error } = await supabase.from('matches').delete().in('id', ids);
      if (!error) {
        setRawMatches(prev => prev.filter(m => !ids.includes(m.id)));
        if (selectedMatch) setSelectedMatch(null); // Fermer la modale si ouverte
      } else {
        alert("Erreur suppression.");
      }
    }
  };

  // --- LOGIQUE DE REGROUPEMENT (DUEL) ---
  const consolidatedMatches = useMemo(() => {
    const groups = [];
    const processedIds = new Set();

    rawMatches.forEach(match => {
      if (processedIds.has(match.id)) return;

      if (match.game_type === 'DUEL') {
        // Chercher l'autre partie du duel (même date created_at)
        const opponent = rawMatches.find(m => 
            m.id !== match.id && 
            m.created_at === match.created_at && 
            !processedIds.has(m.id)
        );

        if (opponent) {
            groups.push({
                type: 'DUEL',
                date: match.created_at,
                p1: match, // On considère arbitrairement le premier trouvé comme P1
                p2: opponent,
                winner: match.result === 'WIN' ? match : opponent,
                isOffline: match.isOffline
            });
            processedIds.add(match.id);
            processedIds.add(opponent.id);
        } else {
            // Duel orphelin (bug ?) -> on l'affiche comme Solo pour pas le perdre
            groups.push({ type: 'SOLO', data: match, date: match.created_at });
            processedIds.add(match.id);
        }
      } else {
        // SOLO
        groups.push({ type: 'SOLO', data: match, date: match.created_at });
        processedIds.add(match.id);
      }
    });
    return groups;
  }, [rawMatches]);

  // Filtrage Final
  const filteredList = consolidatedMatches.filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  // Groupement par Jour (Headers)
  const matchesByDay = filteredList.reduce((acc, item) => {
    const dateObj = new Date(item.date);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    
    let label = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (dateObj.toDateString() === today.toDateString()) label = "Aujourd'hui";
    if (dateObj.toDateString() === yesterday.toDateString()) label = "Hier";

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});


  // --- COMPOSANT : CARTE DUEL ---
  const DuelCard = ({ group }) => {
    const { p1, p2, winner, isOffline } = group;
    
    return (
      <div 
        onClick={() => setSelectedMatch(group)}
        className={`glass-panel p-3 rounded-r-xl rounded-l-md mb-3 relative overflow-hidden group border-l-4 border-purple-500 cursor-pointer active:scale-95 transition-all`}
      >
        {isOffline && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>}
        
        <div className="flex justify-between items-center z-10 relative">
            {/* Info Gauche */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">DUEL</span>
                    {isOffline && <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-bold">⚠️ Attente</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-black ${p1.result === 'WIN' ? 'text-emerald-400' : 'text-slate-400'}`}>{p1.winner_name}</span>
                    <span className="text-xs text-slate-600 font-bold">VS</span>
                    <span className={`text-sm font-black ${p2.result === 'WIN' ? 'text-emerald-400' : 'text-slate-400'}`}>{p2.winner_name}</span>
                </div>
            </div>

            {/* Stats Rapides & Chevron */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-white">{winner.avg}</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold">Avg (Winner)</span>
                 </div>
                 <span className="text-slate-600 text-xl">›</span>
            </div>
        </div>
      </div>
    );
  };

  // --- COMPOSANT : CARTE SOLO ---
  const SoloCard = ({ item }) => {
    const match = item.data;
    const isOffline = match.isOffline;
    
    return (
      <div className={`glass-panel p-3 rounded-r-xl rounded-l-md mb-3 flex items-center justify-between relative overflow-hidden border-l-4 border-blue-500`}>
        {isOffline && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>}
        
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white uppercase tracking-wide">Training</span>
            {isOffline && <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-bold">⚠️ Attente</span>}
            {match.scores_180s > 0 && <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-1 rounded">180!</span>}
            {match.highest_checkout >= 100 && <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1 rounded">HF {match.highest_checkout}</span>}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
             <span>🎯 {match.darts} fléchettes</span>
             <span>🏁 {match.checkout}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10 pl-2">
            <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-white leading-none">{Number(match.avg).toFixed(1)}</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold mt-1">Moyenne</span>
            </div>
            <button onClick={(e) => handleDelete([match], e)} className="text-slate-600 hover:text-red-500 p-2 -mr-2 transition-colors">🗑️</button>
        </div>
      </div>
    );
  };

  // --- MODALE DETAIL MATCH ---
  const MatchDetailModal = ({ group, onClose }) => {
    if (!group) return null;
    const { p1, p2, isOffline } = group;

    const StatRow = ({ label, v1, v2, highlightHigher = false, suffix = '' }) => {
        let c1 = "text-white", c2 = "text-white";
        if (highlightHigher) {
            const n1 = parseFloat(v1), n2 = parseFloat(v2);
            if (n1 > n2) { c1 = "text-emerald-400"; c2 = "text-slate-500"; }
            if (n2 > n1) { c2 = "text-emerald-400"; c1 = "text-slate-500"; }
        }
        return (
            <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className={`font-black text-lg w-1/3 text-center ${c1}`}>{v1}{suffix}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 w-1/3 text-center">{label}</span>
                <span className={`font-black text-lg w-1/3 text-center ${c2}`}>{v2}{suffix}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header Modale */}
                <div className="p-4 bg-slate-800/50 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-emerald-400 font-black tracking-widest uppercase">Résultat Duel</h3>
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded-full font-bold">✕</button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {/* VS Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className={`flex flex-col items-center w-1/3 ${p1.result === 'WIN' ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                            <div className="text-4xl mb-1">{p1.result === 'WIN' ? '👑' : '💀'}</div>
                            <span className="font-black text-white truncate w-full text-center">{p1.winner_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p1.result === 'WIN' ? 'bg-emerald-500 text-slate-900' : 'bg-red-900/50 text-red-300'}`}>
                                {p1.result === 'WIN' ? 'WINNER' : 'LOSER'}
                            </span>
                        </div>
                        <span className="text-slate-600 font-black text-2xl italic">VS</span>
                        <div className={`flex flex-col items-center w-1/3 ${p2.result === 'WIN' ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                            <div className="text-4xl mb-1">{p2.result === 'WIN' ? '👑' : '💀'}</div>
                            <span className="font-black text-white truncate w-full text-center">{p2.winner_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p2.result === 'WIN' ? 'bg-emerald-500 text-slate-900' : 'bg-red-900/50 text-red-300'}`}>
                                {p2.result === 'WIN' ? 'WINNER' : 'LOSER'}
                            </span>
                        </div>
                    </div>

                    {/* Stats Table */}
                    <div className="bg-slate-800/40 rounded-xl p-2 mb-4">
                        <StatRow label="Moyenne" v1={p1.avg} v2={p2.avg} highlightHigher />
                        <StatRow label="Doubles" v1={p1.checkout.replace('%','')} v2={p2.checkout.replace('%','')} highlightHigher suffix="%" />
                        <StatRow label="Fléchettes (Leg)" v1={p1.darts} v2={p2.darts} highlightHigher={false} /> {/* Moins c'est mieux, logique inversée à gérer si besoin */}
                        <StatRow label="Best Finish" v1={p1.highest_checkout} v2={p2.highest_checkout} highlightHigher />
                        <StatRow label="Total 180s" v1={p1.scores_180s} v2={p2.scores_180s} highlightHigher />
                        <StatRow label="Total 140s" v1={p1.scores_140plus} v2={p2.scores_140plus} highlightHigher />
                        <StatRow label="Total 100s" v1={p1.scores_100plus} v2={p2.scores_100plus} highlightHigher />
                    </div>

                    <div className="text-center text-[10px] text-slate-600 mb-4">
                        Joué le {new Date(group.date).toLocaleString()}
                    </div>

                    <button 
                        onClick={(e) => handleDelete([p1, p2], e)} 
                        className="w-full py-3 rounded-xl border border-red-900/30 text-red-400 hover:bg-red-900/20 text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                        <span>🗑️</span> Supprimer ce duel
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <div className="w-full h-screen bg-slate-900 text-white font-kanit flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur border-b border-white/5 z-20">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1"><span>←</span> Menu</button>
        <h2 className="text-emerald-400 font-black tracking-widest text-lg">JOURNAL</h2>
        <div className="w-8"></div>
      </div>

      {/* Filtres */}
      <div className="p-4 pb-0">
        <div className="bg-slate-800 rounded-lg p-1 flex">
           {['ALL', 'SOLO', 'DUEL'].map(f => (
             <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1 text-xs font-bold rounded transition ${filter === f ? 'bg-slate-600 text-white shadow' : 'text-slate-500'}`}>{f === 'ALL' ? 'TOUT' : f}</button>
           ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {loading && rawMatches.length === 0 ? (
          <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement...</div>
        ) : Object.keys(matchesByDay).length === 0 ? (
          <div className="text-center mt-20 text-slate-500">Aucun historique.</div>
        ) : (
          <>
            {Object.keys(matchesByDay).map(dateLabel => (
                <div key={dateLabel} className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 pl-1 sticky top-0 bg-slate-900/95 py-2 z-10 backdrop-blur-sm">{dateLabel}</h3>
                {matchesByDay[dateLabel].map((item, idx) => (
                    item.type === 'DUEL' 
                    ? <DuelCard key={item.p1.id + idx} group={item} /> 
                    : <SoloCard key={item.data.id} item={item} />
                ))}
                </div>
            ))}

            {hasMore && (
                <button onClick={handleLoadMore} disabled={loading} className="w-full py-3 mb-8 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 hover:text-white transition">
                    {loading ? "Chargement..." : "Charger plus ↓"}
                </button>
            )}
            {!hasMore && rawMatches.length > 0 && <div className="text-center text-slate-600 text-xs font-bold mb-8 uppercase">Fin de l'historique</div>}
          </>
        )}
      </div>

      {/* Modale Details */}
      {selectedMatch && <MatchDetailModal group={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </div>
  );
}