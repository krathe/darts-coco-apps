import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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

export default function StatsDashboard({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [trainingMatches, setTrainingMatches] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('ALL');

  const [stats, setStats] = useState({
    games: 0, avg: 0, bestAvg: 0, total180: 0, bestLeg: 0,
    checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0,
    highestCheckout: 0
  });
  const [chartData, setChartData] = useState([]);
  const [currentRank, setCurrentRank] = useState(getRank(0));

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (trainingMatches.length > 0) processStats(); }, [trainingMatches, selectedPlayer]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('game_type', 'SOLO')
      .order('created_at', { ascending: true });

    if (data) {
      setTrainingMatches(data);
      setAvailablePlayers([...new Set(data.map(m => m.winner_name))].sort());
    }
    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Attention : Cela effacera tout l'historique d'entraînement. Continuer ?")) return;
    setLoading(true);
    await supabase.from('matches').delete().neq('id', -1);
    setTrainingMatches([]);
    setLoading(false);
  };

  const processStats = () => {
    let data = trainingMatches;
    if (selectedPlayer !== 'ALL') data = data.filter(m => m.winner_name === selectedPlayer);

    if (data.length === 0) {
      setStats({ games: 0, avg: 0, bestAvg: 0, total180: 0, bestLeg: 0, checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0, highestCheckout: 0 });
      setCurrentRank(getRank(0));
      setChartData([]);
      return;
    }

    const games = data.length;
    const avgs = data.map(m => Number(m.avg));
    const avg = (avgs.reduce((a, b) => a + b, 0) / games).toFixed(1);
    setCurrentRank(getRank(avg));

    const bestAvg = Math.max(...avgs);
    const totalDartsThrown = data.reduce((acc, m) => acc + (m.darts || 0), 0);
    const validDarts = data.map(m => m.darts).filter(d => d > 0);
    const bestLeg = validDarts.length > 0 ? Math.min(...validDarts) : 0;
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
    
    const scoringData = [
        { name: '60+', value: s60, color: '#94a3b8' },
        { name: '100+', value: s100, color: '#60a5fa' },
        { name: '140+', value: s140, color: '#34d399' },
        { name: '180', value: s180, color: '#f59e0b' },
    ]; // On garde tout même si 0 pour la légende fixe

    setStats({ games, avg, bestAvg, total180, bestLeg, checkoutRate, scoringDistribution: scoringData, totalDartsThrown, highestCheckout });

    setChartData(data.slice(-30).map(m => ({
      date: new Date(m.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
      avg: Number(m.avg)
    })));
  };

  const StatBox = ({ label, value, sub, color = "text-white" }) => (
    <div className="bg-slate-800/60 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-widest z-10">{label}</span>
      <span className={`text-xl font-black ${color} z-10 mt-1`}>{value}</span>
      {sub && <span className="text-[9px] text-slate-400 z-10">{sub}</span>}
    </div>
  );

  return (
    <div className="w-full h-screen bg-slate-900 text-white font-kanit flex flex-col overflow-hidden pb-safe">
      
      {/* HEADER */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur border-b border-white/5 z-20">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1"><span>←</span> Menu</button>
        <h2 className="text-emerald-400 font-black tracking-widest text-lg">TRAINING</h2>
        <button onClick={handleClearHistory} className="text-red-900 hover:text-red-500 transition">🗑️</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
        
        {/* SELECTEUR */}
        {availablePlayers.length > 0 && (
          <div className="flex justify-center mb-2">
            <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="bg-slate-800 text-slate-200 text-xs font-bold py-1 px-4 rounded-full border border-white/10 outline-none text-center appearance-none uppercase tracking-wide">
                <option value="ALL">Stats Globales</option>
                {availablePlayers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {loading ? <div className="text-center mt-20 text-emerald-500 animate-pulse font-mono">Chargement...</div> : stats.games === 0 ? <div className="text-center mt-20 text-slate-500">Aucune donnée.</div> : (
          <>
            {/* 1. BADGE */}
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 mt-2">
                <div className={`text-5xl mb-1 drop-shadow-2xl grayscale-0`}>{currentRank.icon}</div>
                <h3 className={`text-xl font-black tracking-tighter uppercase ${currentRank.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>
                    {currentRank.title}
                </h3>
            </div>

            {/* 2. MOYENNE & DOUBLES */}
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

            {/* 3. GRILLE DE STATS (2x2) */}
            <div className="grid grid-cols-2 gap-2">
                <StatBox label="Best Avg" value={stats.bestAvg} color="text-emerald-400" />
                <StatBox label="High Finish" value={stats.highestCheckout} color="text-rose-400" />
                <StatBox label="Best Leg" value={stats.bestLeg} sub="Darts" color="text-blue-400" />
                <StatBox label="Total Lancers" value={(stats.totalDartsThrown > 999 ? (stats.totalDartsThrown / 1000).toFixed(1) + 'k' : stats.totalDartsThrown)} color="text-slate-300" />
            </div>

            {/* 4. PROGRESSION (Area Chart Amélioré) */}
            <div className="glass-panel p-3 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1">📈 Tendance</h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      {/* Filtre pour l'effet Néon */}
                      <filter id="neonGlow" height="130%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                        <feOffset in="blur" dx="0" dy="0" result="offsetBlur"/>
                        <feFlood floodColor="#10b981" floodOpacity="0.8" result="neonColor"/>
                        <feComposite in="neonColor" in2="offsetBlur" operator="in" result="neonBlur"/>
                        <feMerge>
                          <feMergeNode in="neonBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontSize:'12px', padding:'4px 8px'}} itemStyle={{color: '#10b981'}} labelStyle={{display: 'none'}} formatter={(value) => [value, 'Avg']} />
                    <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={3} fill="url(#colorAvg)" filter="url(#neonGlow)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5. DONUT SCORING (Version Mobile Stacked) */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col items-center">
               <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest self-start flex items-center gap-1">📊 Répartition</h3>
               
               {/* Le Donut */}
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
               
               {/* La Légende en dessous */}
               <div className="w-full grid grid-cols-4 gap-2 mt-2">
                   {stats.scoringDistribution.map((d) => (
                       <div key={d.name} className="flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-2">
                           <div className="w-3 h-1 rounded-full mb-1" style={{backgroundColor: d.color}}></div>
                           <span className="text-[9px] text-slate-400 font-bold">{d.name}</span>
                           <span className={`text-sm font-black ${d.value > 0 ? 'text-white' : 'text-slate-600'}`}>{d.value}</span>
                       </div>
                   ))}
               </div>
            </div>
            
            {/* Espace en bas pour le scroll sur mobile */}
            <div className="h-6"></div>

          </>
        )}
      </div>
    </div>
  );
}