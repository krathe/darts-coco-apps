import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { calculateGlobalStats, getRankData } from '../utils/stats';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import Bobs27Stats from './Bobs27Stats';

const CustomTooltip = ({ active, payload, label, config }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-lg p-3 shadow-2xl text-xs backdrop-blur-xl z-50">
        <p className="text-slate-400 mb-1 font-mono uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="font-black text-2xl" style={{ color: config.color }}>
                {payload[0].value}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
                {config.unit}
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
  const [availableModes, setAvailableModes] = useState([]); 
  
  const [viewType, setViewType] = useState('ALL');

  const [selectedPlayer, setSelectedPlayer] = useState('ALL');
  const [gameMode, setGameMode] = useState('ALL'); 
  const [timeFilter, setTimeFilter] = useState('ALL'); 
  const [graphMetric, setGraphMetric] = useState('avg'); 

  const [stats, setStats] = useState({
    games: 0, avg: 0, bestAvg: 0, total180: 0, 
    bestLeg: 0, best301: 0, best501: 0, bestBobs: 0,
    checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0, highestCheckout: 0,
    recentAvg: 0, avgTrend: 0, winRate: 0,
    first9Avg: 0, treblePercentage: 0,
    soloGames: 0, duelGames: 0,
    wins: 0, losses: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [currentRank, setCurrentRank] = useState(getRankData(0));

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => { 
    if (allMatches.length > 0) applyFilters(); 
  }, [allMatches, selectedPlayer, timeFilter, gameMode, viewType]);

  const fetchData = async () => {
    setLoading(true);
    // LOAD FROM LOCAL STORAGE
    const data = storage.getAllMatches().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (data) {
      setAllMatches(data);
      
      const uniquePlayers = [...new Set(data.map(m => m.winner_name))];
      if (!uniquePlayers.includes("Coco")) uniquePlayers.push("Coco");
      setAvailablePlayers(uniquePlayers.sort());
      
      const modes = [...new Set(data.map(m => m.mode))].filter(m => Number.isInteger(m)).sort((a,b) => a-b);
      setAvailableModes(modes);

      const hasCocoData = data.some(m => m.winner_name === 'Coco');
      if (hasCocoData || data.length === 0) {
          setSelectedPlayer('Coco');
      } else {
          setSelectedPlayer('ALL');
      }
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let data = [...allMatches];

    if (viewType === 'SOLO') {
        data = data.filter(m => m.game_type === 'SOLO');
    } else if (viewType === 'DUEL') {
        data = data.filter(m => m.game_type === 'DUEL');
    }

    if (selectedPlayer !== 'ALL') data = data.filter(m => m.winner_name === selectedPlayer);
    
    if (gameMode !== 'ALL') {
       data = data.filter(m => m.mode == gameMode);
    } else {
       data = data.filter(m => m.mode === 301 || m.mode === 501);
    }

    const now = new Date();
    if (timeFilter === '30') {
      const cutoff = new Date(); cutoff.setDate(now.getDate() - 30);
      data = data.filter(m => new Date(m.created_at) >= cutoff);
    } else if (timeFilter === '7') {
      const cutoff = new Date(); cutoff.setDate(now.getDate() - 7);
      data = data.filter(m => new Date(m.created_at) >= cutoff);
    }

    setFilteredMatches(data);
    processStats(data);
  };

  const processStats = (data) => {
    const result = calculateGlobalStats(data, viewType);
    setStats(result.stats);
    setCurrentRank(result.rank);
    setChartData(result.chartData);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Attention : Cela effacera tout l'historique d'entraînement LOCAL. Continuer ?")) return;
    setLoading(true);
    storage.clearAll();
    setAllMatches([]);
    setLoading(false);
  };

  const getGraphConfig = () => {
    switch(graphMetric) {
      case 'checkout': return { color: '#60a5fa', label: 'Doubles %', unit: '%' }; 
      case 'darts': return { color: '#f43f5e', label: 'Fléchettes', unit: '' }; 
      default: return { color: '#10b981', label: 'Moyenne', unit: '' }; 
    }
  };
  const graphConfig = getGraphConfig();

  return (
    <div className="w-full h-screen bg-[#0f172a] text-white font-kanit flex flex-col overflow-hidden pb-safe">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Menu
        </button>
        <h2 className="text-emerald-400 font-black tracking-[0.2em] text-sm">ANALYTICS</h2>
        <div className="flex gap-2">
            <button onClick={handleClearHistory} className="text-red-900 hover:text-red-500 transition opacity-50 hover:opacity-100">🗑️</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide relative">
        
        {/* FILTRES STICKY */}
        <div className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all">
            
            {/* 1. SÉLECTEUR DE VUE PRINCIPAL */}
            <div className="flex p-3 pb-0 gap-2 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setViewType('ALL')}
                    className={`flex-1 py-3 px-2 rounded-xl border font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex flex-col items-center gap-1 ${viewType === 'ALL' ? 'bg-slate-700 border-slate-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:bg-slate-800'}`}
                >
                    <span className="text-lg">🌍</span> Global
                </button>
                <button 
                    onClick={() => setViewType('SOLO')}
                    className={`flex-1 py-3 px-2 rounded-xl border font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex flex-col items-center gap-1 ${viewType === 'SOLO' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-900/20' : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:bg-slate-800'}`}
                >
                    <span className="text-lg">🏋️</span> Training
                </button>
                <button 
                    onClick={() => setViewType('DUEL')}
                    className={`flex-1 py-3 px-2 rounded-xl border font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex flex-col items-center gap-1 ${viewType === 'DUEL' ? 'bg-amber-900/50 border-amber-500 text-amber-300 shadow-lg shadow-amber-900/20' : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:bg-slate-800'}`}
                >
                    <span className="text-lg">⚔️</span> Matchs
                </button>
            </div>

            {/* 2. FILTRES SECONDAIRES */}
            <div className="px-4 py-3 flex flex-col gap-3">
                <div className="flex gap-2 justify-between">
                    <div className="flex gap-2 w-full">
                        {availablePlayers.length > 0 && (
                            <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="bg-slate-800 text-slate-200 text-[10px] font-bold py-2 px-3 rounded-lg border border-white/10 outline-none uppercase tracking-wide shadow-lg flex-1">
                                <option value="ALL">Tous Joueurs</option>
                                {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )}
                        {availableModes.length > 0 && (
                            <select value={gameMode} onChange={e => setGameMode(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} className="bg-slate-800 text-amber-400 text-[10px] font-bold py-2 px-3 rounded-lg border border-white/10 outline-none uppercase tracking-wide shadow-lg w-24 text-center">
                                <option value="ALL">Modes</option>
                                {availableModes.map(m => <option key={m} value={m}>{m === 27 ? "Bob's 27" : m}</option>)}
                            </select>
                        )}
                    </div>
                </div>
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
                   {[ { id: 'ALL', label: 'Tout' }, { id: '30', label: '30 Jours' }, { id: '7', label: '7 Jours' } ].map(filter => (
                     <button key={filter.id} onClick={() => setTimeFilter(filter.id)} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${timeFilter === filter.id ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                       {filter.label}
                     </button>
                   ))}
                </div>
            </div>
        </div>

        <div className="p-4 space-y-6 pb-12">
            {loading ? <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement des données...</div> : stats.games === 0 ? <div className="text-center mt-20 text-slate-500">Aucune donnée trouvée pour cette vue.</div> : (
            gameMode === 27 ? (
                <Bobs27Stats matches={filteredMatches} />
            ) : (
            <>
                {/* 1. HERO CARD */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl bg-black/20 p-2 rounded-xl border border-white/5">{currentRank.icon}</div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tighter uppercase ${currentRank.color} drop-shadow-lg`}>{currentRank.title}</h3>
                                {selectedPlayer !== 'ALL' && (
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
                                        Victoires: <span className="text-white">{stats.winRate}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{stats.avg}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">
                                {gameMode === 27 ? "Score Moyen" : `Moyenne ${viewType === 'ALL' ? 'Globale' : viewType === 'SOLO' ? 'Training' : 'Match'}`}
                            </div>
                        </div>
                    </div>
                    <div className="relative pt-2">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                            <span>Progression</span>
                            <span>{currentRank.nextMin ? `Prochain: ${currentRank.nextMin}` : 'Max Level'}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full ${currentRank.barColor} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)] relative`} style={{ width: `${currentRank.progress}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. BENTO GRID */}
                <div className="grid grid-cols-2 gap-3">
                    
                    {/* Potentiel Scoring */}
                    <div className="col-span-2 glass-panel p-4 rounded-2xl border-l-4 border-emerald-500 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="text-6xl">⚡</span></div>
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">⚡ Potentiel Scoring (First 9)</span>
                                <span className="text-4xl font-black text-white mt-1">{stats.first9Avg}</span>
                             </div>
                             <div className="flex flex-col items-end bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">Perte aux doubles</span>
                                <span className="text-sm font-bold text-rose-400">-{Math.max(0, (stats.first9Avg - stats.avg)).toFixed(1)} <span className="text-[9px]">pts</span></span>
                             </div>
                        </div>
                        <div className="w-full mt-3">
                            <div className="flex justify-between text-[9px] font-bold mb-1">
                                <span className="text-slate-400">Moyenne Réelle ({stats.avg})</span>
                                <span className="text-emerald-500">Potentiel ({stats.first9Avg})</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex relative">
                                <div className="h-full bg-slate-600 rounded-l-full z-10 relative" style={{ width: `${Math.min((stats.avg / (stats.first9Avg || 1)) * 100, 100)}%` }}></div>
                                <div className="h-full bg-emerald-500/50 absolute top-0 left-0" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <p className="text-[8px] text-slate-500 mt-2 italic">* Score moyen sur les 9 premières fléchettes, avant la pression du finish.</p>
                    </div>

                    {/* Précision Doubles (Checkout) */}
                    <div className="glass-panel p-3 rounded-2xl flex flex-col justify-center items-center border border-white/5 relative overflow-hidden">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 z-10">Finish %</span>
                        <div className="relative h-14 w-14 flex items-center justify-center rounded-full bg-slate-800 z-10">
                             <div className="absolute inset-0 rounded-full" style={{background: `conic-gradient(#fbbf24 ${stats.checkoutRate}%, #334155 0)`}}></div>
                             <div className="absolute inset-1.5 bg-slate-800 rounded-full flex items-center justify-center"><span className="text-lg font-black text-white">{stats.checkoutRate}</span></div>
                        </div>
                        <p className="text-[8px] text-slate-500 text-center mt-2 leading-tight">Réussite aux doubles pour finir.</p>
                    </div>

                    {/* Précision Triples */}
                    <div className="glass-panel p-3 rounded-2xl flex flex-col justify-center items-center border border-white/5 relative overflow-hidden">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 z-10">Treble %</span>
                        <div className="relative h-14 w-14 flex items-center justify-center rounded-full bg-slate-800 z-10">
                             <div className="absolute inset-0 rounded-full" style={{background: `conic-gradient(#f43f5e ${stats.treblePercentage}%, #334155 0)`}}></div>
                             <div className="absolute inset-1.5 bg-slate-800 rounded-full flex items-center justify-center"><span className="text-lg font-black text-white">{stats.treblePercentage}</span></div>
                        </div>
                        <p className="text-[8px] text-slate-500 text-center mt-2 leading-tight">% de fléchettes en zone Triple.</p>
                    </div>

                    {/* Stats Compactes */}
                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border border-white/5">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Best Avg</span>
                        <span className="text-xl font-black text-white mt-1">{stats.bestAvg}</span>
                        <span className="text-[8px] text-slate-500 mt-1 text-center">Record sur un match</span>
                    </div>
                    <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border border-white/5">
                        <span className="text-[9px] text-rose-400 font-bold uppercase">High Finish</span>
                        <span className="text-xl font-black text-white mt-1">{stats.highestCheckout > 0 ? stats.highestCheckout : '-'}</span>
                        <span className="text-[8px] text-slate-500 mt-1 text-center">Plus gros checkout réalisé</span>
                    </div>

                    {/* Best Leg Split */}
                    <div className="col-span-2 glass-panel p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center mb-1">Records Personnels</div>
                        <div className="grid grid-cols-3 gap-2">
                            {(gameMode === 'ALL' || gameMode === 301) && (
                                <div className="bg-slate-800/50 rounded-lg p-2 flex flex-col items-center border border-slate-700">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">301</span>
                                    <span className="text-base font-black text-blue-400">{stats.best301 || '-'}</span>
                                    <span className="text-[7px] text-slate-600">Darts</span>
                                </div>
                            )}
                            {(gameMode === 'ALL' || gameMode === 501) && (
                                <div className="bg-slate-800/50 rounded-lg p-2 flex flex-col items-center border border-slate-700">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">501</span>
                                    <span className="text-base font-black text-purple-400">{stats.best501 || '-'}</span>
                                    <span className="text-[7px] text-slate-600">Darts</span>
                                </div>
                            )}
                            {(gameMode === 'ALL' || gameMode === 27) && (
                                <div className="bg-slate-800/50 rounded-lg p-2 flex flex-col items-center border border-emerald-500/30">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Bob's 27</span>
                                    <span className="text-base font-black text-emerald-400">{stats.bestBobs || '-'}</span>
                                    <span className="text-[7px] text-slate-600">Points</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[8px] text-slate-500 text-center mt-1 italic">Records basés sur vos meilleures performances.</p>
                    </div>

                    {/* VOLUMÉTRIE & RATIO */}
                    <div className="col-span-2 grid grid-cols-2 gap-3">
                        <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border border-white/5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Matchs Joués</span>
                            <span className="text-xl font-black text-white mt-1">
                                {viewType === 'ALL' ? stats.duelGames : stats.games}
                            </span>
                            
                            {/* AFFICHAGE DES WINS / LOSSES (Uniquement Duels) */}
                            {stats.duelGames > 0 || (viewType === 'DUEL' && stats.games > 0) ? (
                                <div className="flex gap-2 mt-2 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                                    <span className="text-[9px] text-emerald-400 font-black">{stats.wins} V</span>
                                    <span className="text-[9px] text-slate-600 font-black">•</span>
                                    <span className="text-[9px] text-rose-400 font-black">{stats.losses} D</span>
                                </div>
                            ) : (
                                <span className="text-[8px] text-slate-500 mt-2">Pas de duel joué</span>
                            )}
                        </div>
                        <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border border-white/5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Fléchettes</span>
                            <span className="text-xl font-black text-blue-300 mt-1">
                                {(stats.totalDartsThrown > 999 ? (stats.totalDartsThrown / 1000).toFixed(1) + 'k' : stats.totalDartsThrown)}
                            </span>
                            <span className="text-[8px] text-slate-500 mt-1 text-center">Cumul des lancers effectués</span>
                        </div>
                    </div>

                </div>

                {/* 3. CHART SECTION */}
                <div className="glass-panel p-4 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Performance</h3>
                        <div className="flex bg-black/20 rounded-lg p-0.5">
                            {[ {id:'avg', label:'Avg'}, {id:'checkout', label:'%'} ].map(m => (
                                <button key={m.id} onClick={() => setGraphMetric(m.id)} className={`px-3 py-1 text-[8px] font-bold rounded transition-all ${graphMetric === m.id ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>{m.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                            <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={graphConfig.color} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={graphConfig.color} stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip config={graphConfig} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}/>
                            <Area type="monotone" dataKey={graphMetric} stroke={graphConfig.color} strokeWidth={3} fill="url(#gradientColor)" isAnimationActive={true} />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. SCORING DISTRIBUTION */}
                <div className="glass-panel p-4 rounded-3xl border border-white/5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribution 180s/140s</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {stats.scoringDistribution.map((d) => (
                            <div key={d.name} className="flex flex-col items-center gap-1">
                                <div className="h-16 w-3 bg-slate-800 rounded-full relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000" style={{ height: d.percent, backgroundColor: d.color }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300">{d.name}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. DART DISTRIBUTION (NOUVEAU) */}
                <div className="glass-panel p-4 rounded-3xl border border-white/5 bg-slate-900/50">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Répartition des touches (1-20)</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dartDistribution} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} interval={0} />
                                <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                                    {
                                      stats.dartDistribution && stats.dartDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === '20' ? '#ef4444' : entry.name === '19' ? '#f59e0b' : '#3b82f6'} />
                                      ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </>
            ))}
        </div>
      </div>
    </div>
  );
}