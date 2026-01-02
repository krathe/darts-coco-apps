import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- SYSTÈME DE GRADES ---
const getRank = (avg) => {
  if (avg < 30) return { title: "DÉBUTANT", color: "text-slate-400", icon: "🌱" };
  if (avg < 40) return { title: "AMATEUR", color: "text-blue-400", icon: "🍺" };
  if (avg < 50) return { title: "PUB HERO", color: "text-indigo-400", icon: "🔥" };
  if (avg < 60) return { title: "CLUB PLAYER", color: "text-emerald-400", icon: "🎯" };
  if (avg < 70) return { title: "SEMI-PRO", color: "text-amber-400", icon: "🏆" };
  if (avg < 85) return { title: "PRO TOUR", color: "text-rose-400", icon: "👑" };
  return { title: "WORLD CLASS", color: "text-purple-400", icon: "👽" };
};

// --- TOOLTIP PERSONNALISÉ ---
const CustomTooltip = ({ active, payload, label, config }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-lg p-2 shadow-xl text-xs backdrop-blur-md z-50">
        <p className="text-slate-400 mb-1 font-mono">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="font-black text-xl" style={{ color: config.color }}>
                {payload[0].value}{config.unit}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {config.label}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function StatsDashboard({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState([]); 
  const [filteredMatches, setFilteredMatches] = useState([]); 
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [availableModes, setAvailableModes] = useState([]); // ex: [301, 501]
  
  // FILTRES
  const [selectedPlayer, setSelectedPlayer] = useState('ALL');
  const [gameMode, setGameMode] = useState('ALL'); // 'ALL', '301', '501'
  const [timeFilter, setTimeFilter] = useState('ALL'); 
  const [graphMetric, setGraphMetric] = useState('avg'); 

  const [stats, setStats] = useState({
    games: 0, avg: 0, bestAvg: 0, total180: 0, 
    bestLeg: 0, best301: 0, best501: 0, // Ajout des best legs spécifiques
    checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0,
    highestCheckout: 0,
    recentAvg: 0, avgTrend: 0 
  });
  
  const [chartData, setChartData] = useState([]);
  const [currentRank, setCurrentRank] = useState(getRank(0));

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => { 
    if (allMatches.length > 0) applyFilters(); 
  }, [allMatches, selectedPlayer, timeFilter, gameMode]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('game_type', 'SOLO')
      .order('created_at', { ascending: true });

    if (data) {
      setAllMatches(data);
      setAvailablePlayers([...new Set(data.map(m => m.winner_name))].sort());
      // Détection des modes disponibles (ex: 301, 501)
      const modes = [...new Set(data.map(m => m.mode))].filter(Boolean).sort((a,b) => a - b);
      setAvailableModes(modes);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let data = [...allMatches];

    // 1. Filtre Joueur
    if (selectedPlayer !== 'ALL') {
      data = data.filter(m => m.winner_name === selectedPlayer);
    }

    // 2. Filtre Mode de Jeu (301/501)
    if (gameMode !== 'ALL') {
       // Convertir en int pour être sûr (la DB renvoie parfois des strings ou int)
       data = data.filter(m => m.mode == gameMode);
    }

    // 3. Filtre Période
    const now = new Date();
    if (timeFilter === '30') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 30);
      data = data.filter(m => new Date(m.created_at) >= cutoff);
    } else if (timeFilter === '7') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 7);
      data = data.filter(m => new Date(m.created_at) >= cutoff);
    }

    setFilteredMatches(data);
    processStats(data);
  };

  const processStats = (data) => {
    // Si aucune donnée filtrée
    if (data.length === 0) {
      setStats({ 
        games: 0, avg: 0, bestAvg: 0, total180: 0, 
        bestLeg: 0, best301: 0, best501: 0,
        checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0, highestCheckout: 0,
        recentAvg: 0, avgTrend: 0
      });
      setCurrentRank(getRank(0));
      setChartData([]);
      return;
    }

    // Calculs de base
    const games = data.length;
    const avgs = data.map(m => Number(m.avg));
    const avg = (avgs.reduce((a, b) => a + b, 0) / games).toFixed(1);
    setCurrentRank(getRank(avg));

    // Forme (5 derniers)
    const recentMatches = data.slice(-5);
    const recentAvgRaw = recentMatches.length > 0 ? recentMatches.reduce((acc, m) => acc + Number(m.avg), 0) / recentMatches.length : 0;
    const recentAvg = recentAvgRaw.toFixed(1);
    const avgTrend = (recentAvgRaw - parseFloat(avg)).toFixed(1);

    const bestAvg = Math.max(...avgs);
    const totalDartsThrown = data.reduce((acc, m) => acc + (m.darts || 0), 0);
    const totalTurns = Math.floor(totalDartsThrown / 3) || 1; 

    // --- BEST LEG LOGIC ---
    // Best Leg global (sur la sélection actuelle)
    const validDarts = data.map(m => m.darts).filter(d => d > 0);
    const bestLeg = validDarts.length > 0 ? Math.min(...validDarts) : 0;
    
    // Calcul spécifique pour l'affichage double (301/501)
    // On doit chercher dans 'data' (qui est déjà filtré par joueur/temps, mais peut contenir mix de modes si mode=ALL)
    let best301 = 0;
    let best501 = 0;
    if (gameMode === 'ALL') {
         const m301 = data.filter(m => m.mode == 301 && m.darts > 0).map(m => m.darts);
         best301 = m301.length ? Math.min(...m301) : 0;

         const m501 = data.filter(m => m.mode == 501 && m.darts > 0).map(m => m.darts);
         best501 = m501.length ? Math.min(...m501) : 0;
    }

    const total180 = data.reduce((acc, m) => acc + (m.scores_180s || 0), 0);
    const highestCheckout = Math.max(...data.map(m => m.highest_checkout || 0));

    let totalCheckoutSum = 0;
    let gamesWithCheckout = 0;
    data.forEach(m => {
        if (m.checkout && m.checkout !== "0%") {
            const val = parseInt(m.checkout.replace('%', ''));
            if (!isNaN(val)) totalCheckoutSum += val; gamesWithCheckout++;
        }
    });
    const checkoutRate = gamesWithCheckout > 0 ? (totalCheckoutSum / gamesWithCheckout).toFixed(0) : 0;

    const s60 = data.reduce((acc, m) => acc + (m.scores_60plus || 0), 0);
    const s100 = data.reduce((acc, m) => acc + (m.scores_100plus || 0), 0);
    const s140 = data.reduce((acc, m) => acc + (m.scores_140plus || 0), 0);
    const s180 = total180;
    
    const getPercent = (val) => ((val / totalTurns) * 100).toFixed(1) + '%';
    const scoringData = [
        { name: '60+', value: s60, color: '#94a3b8', percent: getPercent(s60) },
        { name: '100+', value: s100, color: '#60a5fa', percent: getPercent(s100) },
        { name: '140+', value: s140, color: '#34d399', percent: getPercent(s140) },
        { name: '180', value: s180, color: '#f59e0b', percent: getPercent(s180) },
    ];

    setStats({ 
        games, avg, bestAvg, total180, 
        bestLeg, best301, best501, 
        checkoutRate, scoringDistribution: scoringData, totalDartsThrown, highestCheckout,
        recentAvg, avgTrend
    });

    setChartData(data.map(m => ({
      date: new Date(m.created_at).toLocaleString(undefined, {
        day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      avg: Number(m.avg),
      checkout: m.checkout ? parseInt(m.checkout.replace('%','')) : 0,
      darts: m.darts
    })));
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Attention : Cela effacera tout l'historique d'entraînement. Continuer ?")) return;
    setLoading(true);
    await supabase.from('matches').delete().neq('id', -1);
    setAllMatches([]);
    setLoading(false);
  };

  const StatBox = ({ label, value, sub, color = "text-white" }) => (
    <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden min-h-[6rem]">
      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-widest z-10 mb-1">{label}</span>
      <div className={`z-10 flex flex-col items-center justify-center w-full ${typeof value === 'object' ? 'mt-0' : 'mt-1'}`}>
        {typeof value === 'object' ? value : <span className={`text-xl font-black ${color}`}>{value}</span>}
      </div>
      {sub && <span className="text-[9px] text-slate-400 z-10 mt-1">{sub}</span>}
    </div>
  );

  const getGraphConfig = () => {
    switch(graphMetric) {
      case 'checkout': return { color: '#60a5fa', label: 'Doubles %', unit: '%' }; 
      case 'darts': return { color: '#f43f5e', label: 'Fléchettes', unit: '' }; 
      default: return { color: '#10b981', label: 'Moyenne', unit: '' }; 
    }
  };
  const graphConfig = getGraphConfig();

  return (
    <div className="w-full h-screen bg-slate-900 text-white font-kanit flex flex-col overflow-hidden pb-safe">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur border-b border-white/5 z-20">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1"><span>←</span> Menu</button>
        <h2 className="text-emerald-400 font-black tracking-widest text-lg">TRAINING</h2>
        <button onClick={handleClearHistory} className="text-red-900 hover:text-red-500 transition">🗑️</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
        
        {/* BARRE DE FILTRES COMPLETE */}
        <div className="flex flex-col gap-3 mb-2">
            {/* Ligne 1 : Joueur + Mode */}
            <div className="flex gap-2 justify-center">
                {availablePlayers.length > 0 && (
                    <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="bg-slate-800 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-white/10 outline-none uppercase tracking-wide shadow-lg flex-1 max-w-[50%]">
                        <option value="ALL">Tous Joueurs</option>
                        {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                )}
                
                {availableModes.length > 0 && (
                    <select value={gameMode} onChange={e => setGameMode(e.target.value)} className="bg-slate-800 text-amber-400 text-xs font-bold py-1.5 px-3 rounded-lg border border-white/10 outline-none uppercase tracking-wide shadow-lg w-24 text-center">
                        <option value="ALL">Modes</option>
                        {availableModes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                )}
            </div>

            {/* Ligne 2 : Filtre Période */}
            <div className="flex justify-center p-1 bg-slate-800/50 rounded-lg self-center border border-white/5">
               {[
                 { id: 'ALL', label: 'Tout' },
                 { id: '30', label: '30 Jours' },
                 { id: '7', label: '7 Jours' }
               ].map(filter => (
                 <button
                   key={filter.id}
                   onClick={() => setTimeFilter(filter.id)}
                   className={`px-4 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${timeFilter === filter.id ? 'bg-slate-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {filter.label}
                 </button>
               ))}
            </div>
        </div>

        {loading ? <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement...</div> : stats.games === 0 ? <div className="text-center mt-20 text-slate-500">Aucune donnée sur cette période.</div> : (
          <>
            {/* 1. BADGE & FORME */}
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-2">
                <div className={`text-5xl mb-1 drop-shadow-2xl grayscale-0`}>{currentRank.icon}</div>
                <h3 className={`text-xl font-black tracking-tighter uppercase ${currentRank.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
                    {currentRank.title}
                </h3>
                
                <div className="mt-2 bg-slate-800/80 px-3 py-1 rounded-full flex items-center gap-2 border border-white/5">
                   <span className="text-[9px] text-slate-400 font-bold uppercase">Forme (5 derniers)</span>
                   <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-white">{stats.recentAvg}</span>
                      {Number(stats.avgTrend) !== 0 && (
                          <span className={`text-xs font-bold ${Number(stats.avgTrend) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {Number(stats.avgTrend) > 0 ? '▲' : '▼'} {Math.abs(stats.avgTrend)}
                          </span>
                      )}
                   </div>
                </div>
            </div>

            {/* 2. STATS PRINCIPALES */}
            <div className="flex gap-3">
                <div className="flex-1 glass-panel rounded-2xl p-3 flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-[9px] uppercase font-bold">Moyenne</span>
                    <span className="text-4xl font-black text-white tracking-tighter">{stats.avg}</span>
                </div>
                <div className="flex-1 glass-panel rounded-2xl p-3 flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-[9px] uppercase font-bold">Doubles %</span>
                    <span className={`text-4xl font-black tracking-tighter ${Number(stats.checkoutRate) > 30 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {stats.checkoutRate}<span className="text-2xl">%</span>
                    </span>
                </div>
            </div>

            {/* 3. GRILLE DE STATS AVEC BEST LEG HYBRIDE (DESIGN AMÉLIORÉ) */}
            <div className="grid grid-cols-2 gap-2">
                <StatBox label="Best Avg" value={stats.bestAvg} color="text-emerald-400" />
                <StatBox label="High Finish" value={stats.highestCheckout} color="text-rose-400" />
                
                {/* BEST LEG INTELLIGENT - DESIGN AÉRÉ */}
                <StatBox 
                    label="Best Leg" 
                    value={
                        // SI MODE = ALL, on affiche les deux records avec une grille propre
                        gameMode === 'ALL' ? (
                            <div className="flex flex-col gap-2 w-full mt-1">
                                <div className="grid grid-cols-2 gap-2 w-full items-center bg-slate-900/40 px-3 py-1 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-slate-400 font-bold tracking-wider text-left">301</span>
                                    <span className="text-sm font-black text-blue-400 text-right">{stats.best301 || '-'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full items-center bg-slate-900/40 px-3 py-1 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-slate-400 font-bold tracking-wider text-left">501</span>
                                    <span className="text-sm font-black text-purple-400 text-right">{stats.best501 || '-'}</span>
                                </div>
                            </div>
                        ) : (
                            // SINON on affiche juste le chiffre
                            stats.bestLeg
                        )
                    } 
                    sub={gameMode !== 'ALL' ? "Darts" : null} 
                    color="text-blue-400" 
                />
                
                <StatBox label="Total Lancers" value={(stats.totalDartsThrown > 999 ? (stats.totalDartsThrown / 1000).toFixed(1) + 'k' : stats.totalDartsThrown)} color="text-slate-300" />
            </div>

            {/* 4. GRAPH */}
            <div className="glass-panel p-3 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">📈 Évolution</h3>
                 <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                    {[
                        { id: 'avg', label: 'Avg' },
                        { id: 'checkout', label: '%' },
                        { id: 'darts', label: 'Darts' }
                    ].map(m => (
                        <button key={m.id} onClick={() => setGraphMetric(m.id)} className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${graphMetric === m.id ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                            {m.label}
                        </button>
                    ))}
                 </div>
              </div>

              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={graphConfig.color} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={graphConfig.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip config={graphConfig} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}/>
                    <Area type="monotone" dataKey={graphMetric} stroke={graphConfig.color} strokeWidth={3} fill="url(#gradientColor)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5. DONUT */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col items-center">
               <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest self-start flex items-center gap-1">📊 Régularité</h3>
               <div className="h-40 w-40 relative shrink-0 my-2">
                 <ResponsiveContainer>
                    <PieChart>
                        <Pie data={stats.scoringDistribution} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" cornerRadius={4}>
                            {stats.scoringDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />)}
                        </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">{stats.total180}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Total 180s</span>
                 </div>
               </div>
               <div className="w-full grid grid-cols-4 gap-2 mt-2">
                   {stats.scoringDistribution.map((d) => (
                       <div key={d.name} className="flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-2 relative overflow-hidden">
                           <div className="w-3 h-1 rounded-full mb-1" style={{backgroundColor: d.color}}></div>
                           <span className="text-[9px] text-slate-400 font-bold">{d.name}</span>
                           <span className={`text-sm font-black ${d.value > 0 ? 'text-white' : 'text-slate-600'}`}>{d.value}</span>
                           <span className="text-[8px] text-slate-500 font-mono mt-1">{d.percent}</span>
                       </div>
                   ))}
               </div>
            </div>
            <div className="h-6"></div>
          </>
        )}
      </div>
    </div>
  );
}