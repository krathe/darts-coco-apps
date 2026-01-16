// src/utils/stats.js

export const RANK_SYSTEM = [
  { min: 0, max: 30, title: "DÉBUTANT", color: "text-slate-400", barColor: "bg-slate-500", icon: "🌱" },
  { min: 30, max: 40, title: "AMATEUR", color: "text-blue-400", barColor: "bg-blue-500", icon: "🍺" },
  { min: 40, max: 50, title: "PUB HERO", color: "text-indigo-400", barColor: "bg-indigo-500", icon: "🔥" },
  { min: 50, max: 60, title: "CLUB PLAYER", color: "text-emerald-400", barColor: "bg-emerald-500", icon: "🎯" },
  { min: 60, max: 70, title: "SEMI-PRO", color: "text-amber-400", barColor: "bg-amber-500", icon: "🏆" },
  { min: 70, max: 85, title: "PRO TOUR", color: "text-rose-400", barColor: "bg-rose-500", icon: "👑" },
  { min: 85, max: 200, title: "WORLD CLASS", color: "text-purple-400", barColor: "bg-purple-500", icon: "👽" }
];

export const getRankData = (avg) => {
  const rank = RANK_SYSTEM.find(r => avg >= r.min && avg < r.max) || RANK_SYSTEM[RANK_SYSTEM.length - 1];
  const nextRank = RANK_SYSTEM[RANK_SYSTEM.indexOf(rank) + 1];
  
  let progress = 100;
  if (nextRank) {
    const totalRange = rank.max - rank.min;
    const currentVal = avg - rank.min;
    progress = (currentVal / totalRange) * 100;
  }
  
  return { ...rank, progress: Math.min(Math.max(progress, 0), 100), nextMin: nextRank ? rank.max : null };
};

export const calculateAvg = (totalPoints, totalDarts) => {
  if (!totalDarts || totalDarts === 0) return "0.0";
  return ((totalPoints / totalDarts) * 3).toFixed(1);
};

export const calculateCheckoutRate = (successes, attempts) => {
  if (!attempts || attempts === 0) return "0%";
  return Math.round((successes / attempts) * 100) + "%";
};

export const calculateGlobalStats = (data, viewType) => {
    if (!data || data.length === 0) {
        return {
            stats: { games: 0, avg: 0, bestAvg: 0, total180: 0, bestLeg: 0, best301: 0, best501: 0, bestBobs: 0, checkoutRate: 0, scoringDistribution: [], totalDartsThrown: 0, highestCheckout: 0, recentAvg: 0, avgTrend: 0, winRate: 0, first9Avg: 0, treblePercentage: 0, soloGames: 0, duelGames: 0, wins: 0, losses: 0 },
            rank: getRankData(0),
            chartData: []
        };
    }

    const games = data.length;
    const soloGames = data.filter(m => m.game_type === 'SOLO').length;
    const duelGames = data.filter(m => m.game_type === 'DUEL').length;

    // Stats Victoires / Défaites uniquement sur les Duels
    const duelData = data.filter(m => m.game_type === 'DUEL');
    const wins = duelData.filter(m => m.result === 'WIN').length;
    const losses = duelData.filter(m => m.result === 'LOSS').length;
    const winRate = duelData.length > 0 ? ((wins / duelData.length) * 100).toFixed(0) : 0;

    const avgs = data.map(m => Number(m.avg));
    const avg = (avgs.reduce((a, b) => a + b, 0) / games).toFixed(1);
    const rank = getRankData(Number(avg));

    const recentMatches = data.slice(-5);
    const recentAvgRaw = recentMatches.length > 0 ? recentMatches.reduce((acc, m) => acc + Number(m.avg), 0) / recentMatches.length : 0;
    const recentAvg = recentAvgRaw.toFixed(1);
    const avgTrend = (recentAvgRaw - parseFloat(avg)).toFixed(1);

    const bestAvg = Math.max(...avgs);
    const totalDartsThrown = data.reduce((acc, m) => acc + (m.darts || 0), 0);
    
    let totalFirst9Points = 0;
    let totalFirst9Darts = 0;
    let totalTrebles = 0;
    let totalThrowsRecorded = 0;

    data.forEach(m => {
        if (m.match_details && Array.isArray(m.match_details)) {
            const first3Turns = m.match_details.slice(0, 3);
            first3Turns.forEach(turn => {
                totalFirst9Points += turn.total || 0;
                if (turn.darts) {
                    totalFirst9Darts += turn.darts.length;
                    turn.darts.forEach(d => {
                        if (d.mult === 3) totalTrebles++;
                        totalThrowsRecorded++;
                    });
                }
            });

            const restOfMatch = m.match_details.slice(3);
            restOfMatch.forEach(turn => {
                if (turn.darts) {
                    turn.darts.forEach(d => {
                        if (d.mult === 3) totalTrebles++;
                        totalThrowsRecorded++;
                    });
                }
            });
        }
    });

    const first9Avg = totalFirst9Darts > 0 ? ((totalFirst9Points / totalFirst9Darts) * 3).toFixed(1) : "0.0";
    const treblePercentage = totalThrowsRecorded > 0 ? ((totalTrebles / totalThrowsRecorded) * 100).toFixed(1) : "0.0";

    const m301 = data.filter(m => m.mode == 301 && m.darts > 0).map(m => m.darts);
    const best301 = m301.length ? Math.min(...m301) : 0;
    const m501 = data.filter(m => m.mode == 501 && m.darts > 0).map(m => m.darts);
    const best501 = m501.length ? Math.min(...m501) : 0;

    const mBobs = data.filter(m => m.mode == 27).map(m => Number(m.avg));
    const bestBobs = mBobs.length ? Math.max(...mBobs) : 0;

    const total180 = data.reduce((acc, m) => acc + (m.scores_180s || 0), 0);
    
    const checkoutValues = data.map(m => Number(m.highest_checkout));
    const highestCheckout = checkoutValues.length > 0 ? Math.max(0, ...checkoutValues) : 0;

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
    
    const totalScores = s60 + s100 + s140 + s180 || 1;
    const scoringDistribution = [
        { name: '60+', value: s60, color: '#94a3b8', percent: ((s60/totalScores)*100).toFixed(0)+'%' },
        { name: '100+', value: s100, color: '#60a5fa', percent: ((s100/totalScores)*100).toFixed(0)+'%' },
        { name: '140+', value: s140, color: '#34d399', percent: ((s140/totalScores)*100).toFixed(0)+'%' },
        { name: '180', value: s180, color: '#f59e0b', percent: ((s180/totalScores)*100).toFixed(0)+'%' },
    ];

    const chartData = data.map(m => ({
      date: new Date(m.created_at).toLocaleString(undefined, { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }),
      avg: Number(m.avg),
      checkout: m.checkout ? parseInt(m.checkout.replace('%','')) : 0,
      darts: m.darts
    }));

    return {
        stats: { 
            games, avg, bestAvg, total180, bestLeg: 0, best301, best501, bestBobs, checkoutRate, 
            scoringDistribution, totalDartsThrown, highestCheckout, recentAvg, 
            avgTrend, winRate, first9Avg, treblePercentage,
            soloGames, duelGames, wins, losses 
        },
        rank,
        chartData
    };
};