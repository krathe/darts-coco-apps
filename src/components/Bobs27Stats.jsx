import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const BOBS_TARGETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

export default function Bobs27Stats({ matches }) {
  
  // --- ANALYSE DES DONNÉES ---
  const stats = useMemo(() => {
    if (!matches || matches.length === 0) return null;

    const scores = matches.map(m => Number(m.avg)); // On a stocké le score final dans 'avg'
    const bestScore = Math.max(...scores);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0);
    const totalGames = matches.length;
    
    // Analyse des cibles (Doubles)
    // Structure: { 1: { hits: 0, attempts: 0 }, 2: ... }
    const targetStats = {};
    BOBS_TARGETS.forEach(t => targetStats[t] = { hits: 0, attempts: 0 });

    matches.forEach(match => {
        if (!match.match_details) return;
        
        // match_details est un tableau de tours. 
        // Index 0 = Double 1, Index 1 = Double 2, etc.
        match.match_details.forEach((turn, index) => {
            if (index >= BOBS_TARGETS.length) return;
            const target = BOBS_TARGETS[index];
            
            targetStats[target].attempts += 1;
            
            // Si le total du tour est positif, c'est qu'il y a eu des touches
            if (turn.total > 0) {
                // Valeur du double (ou Bull)
                const val = target === 25 ? 50 : target * 2;
                // Nombre de touches = Total points / Valeur
                const hits = Math.round(turn.total / val); 
                targetStats[target].hits += hits;
            }
        });
    });

    // Transformation pour le graph
    const targetData = BOBS_TARGETS.map(t => {
        const s = targetStats[t];
        // On calcule un % de réussite approximatif (Hit Rate)
        // Note: C'est un peu subjectif. Disons Hits Moyens par Tentative ? 
        // Ou % de fois où on ne s'est pas planté ?
        // Allons sur "Moyenne de touches par passage" (0 à 3)
        const avgHits = s.attempts > 0 ? (s.hits / s.attempts).toFixed(2) : 0;
        return {
            target: t === 25 ? 'B' : t.toString(),
            avgHits: Number(avgHits),
            attempts: s.attempts
        };
    });

    // Trouver le meilleur et le pire double (min 5 tentatives pour être significatif)
    const significantTargets = targetData.filter(t => t.attempts >= 5);
    const bestDouble = significantTargets.length ? significantTargets.reduce((prev, current) => (prev.avgHits > current.avgHits) ? prev : current) : null;
    const worstDouble = significantTargets.length ? significantTargets.reduce((prev, current) => (prev.avgHits < current.avgHits) ? prev : current) : null;

    // Data Graph Historique
    const historyData = matches.map((m, i) => ({
        id: i,
        date: new Date(m.created_at).toLocaleDateString(),
        score: Number(m.avg)
    }));

    return { bestScore, avgScore, totalGames, targetData, historyData, bestDouble, worstDouble };
  }, [matches]);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <span className="text-4xl mb-2">👻</span>
        <p>Aucune partie de Bob's 27 enregistrée.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* HERO HEADER */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-4 text-white shadow-lg shadow-indigo-900/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 text-6xl font-black -mr-4 -mt-2">★</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Best Score</div>
                <div className="text-3xl font-black mt-1">{stats.bestScore}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white shadow-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Moyenne</div>
                <div className="text-3xl font-black mt-1 text-emerald-400">{stats.avgScore}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white shadow-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parties</div>
                <div className="text-3xl font-black mt-1 text-blue-400">{stats.totalGames}</div>
            </div>
        </div>

        {/* ANALYSE DES DOUBLES (GRAPHIQUE EN BARRES) */}
        <div className="glass-panel p-4 rounded-3xl border border-white/5 bg-slate-900/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Précision par Double (Moy. touches/tour)</span>
                <span className="text-[9px] text-slate-600">Basé sur historique</span>
            </h3>
            
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.targetData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="target" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 3]} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="avgHits" radius={[4, 4, 0, 0]}>
                            {stats.targetData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.avgHits > 1.5 ? '#10b981' : entry.avgHits > 0.8 ? '#3b82f6' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* INSIGHTS (Meilleur / Pire) */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Point Fort</span>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">
                        {stats.bestDouble ? (stats.bestDouble.target === 'B' ? 'BULL' : `D${stats.bestDouble.target}`) : '-'}
                    </span>
                </div>
                {stats.bestDouble && <span className="text-[9px] text-emerald-400/60">{stats.bestDouble.avgHits} touches / tour</span>}
            </div>
            <div className="bg-rose-900/20 border border-rose-500/30 rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">À Travailler</span>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">
                        {stats.worstDouble ? (stats.worstDouble.target === 'B' ? 'BULL' : `D${stats.worstDouble.target}`) : '-'}
                    </span>
                </div>
                {stats.worstDouble && <span className="text-[9px] text-rose-400/60">{stats.worstDouble.avgHits} touches / tour</span>}
            </div>
        </div>

        {/* HISTORIQUE SCORE (COURBE) */}
        <div className="glass-panel p-4 rounded-3xl border border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Progression du Score</h3>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.historyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="date" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorScore)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

    </div>
  );
}