import { useState } from 'react';
import { calculateAvg } from '../utils/stats';

export default function ScoreBoard({ players, currentPlayerId, matchScore, matchConfig }) {
  // État pour afficher ou masquer les stats détaillées (pliant)
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex flex-col w-full items-center mb-4 mt-2">
      
      {/* Bouton Toggle Discret */}
      <button 
        onClick={() => setShowStats(!showStats)}
        className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-emerald-400 transition mb-2 flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full border border-white/5"
      >
        <span>{showStats ? 'Masquer Stats' : 'Voir Stats Live'}</span>
        <span className={showStats ? "rotate-180 transition-transform" : "transition-transform"}>▼</span>
      </button>

      <div className="flex w-full gap-3 px-3">
        {players.map((player) => {
          const isActive = player.id === currentPlayerId;
          const sets = player.id === 1 ? matchScore.p1Sets : matchScore.p2Sets;
          const legs = player.id === 1 ? matchScore.p1Legs : matchScore.p2Legs;
          
          const avg = calculateAvg(player.stats.totalPointsScored, player.stats.totalDarts);

          return (
            <div 
              key={player.id}
              className={`
                flex-1 flex flex-col items-center justify-between py-4 px-2 rounded-3xl transition-all duration-500 relative overflow-hidden
                ${isActive ? 'glass-panel-active scale-105 z-10' : 'glass-panel opacity-60 scale-95'}
              `}
            >
              {/* Indicateur lumineux Joueur Actif */}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] animate-pulse"></div>
              )}

              {/* Nom du joueur */}
              <h2 className={`text-sm uppercase tracking-widest font-semibold mb-1 flex items-center gap-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                <span className="truncate max-w-[100px]">{player.name}</span>
              </h2>
              
              {/* SCORE PRINCIPAL */}
              <div className={`text-6xl font-black tracking-tighter my-1 drop-shadow-2xl transition-all ${isActive ? 'text-white' : 'text-slate-500'} ${showStats ? 'scale-90' : 'scale-100'}`}>
                {player.score}
              </div>

              {/* Barre d'infos (Sets / Legs / Avg) */}
              <div className="w-full mt-2 grid grid-cols-2 gap-2">
                
                {/* Sets & Legs */}
                <div className="bg-black/30 rounded-lg p-1 flex items-center justify-center gap-2 border border-white/5">
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-amber-500 font-bold text-lg">{sets}</span>
                    <span className="text-[7px] text-slate-500 uppercase">Sets</span>
                  </div>
                  <div className="w-[1px] h-4 bg-slate-700"></div>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-emerald-400 font-bold text-lg">{legs}</span>
                    <span className="text-[7px] text-slate-500 uppercase">Legs</span>
                  </div>
                </div>

                {/* Moyenne */}
                <div className="bg-black/30 rounded-lg p-1 flex flex-col items-center justify-center border border-white/5">
                  <span className={`text-sm font-bold ${isActive ? "text-blue-300" : "text-slate-500"}`}>{avg}</span>
                  <span className="text-[7px] text-slate-500 uppercase">Avg</span>
                </div>
              </div>

              {/* ZONE STATS LIVE (Collapsible) */}
              {showStats && (
                <div className="w-full mt-3 pt-2 border-t border-white/10 grid grid-cols-3 gap-1 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                    <span className="text-[8px] text-blue-300 font-bold">100+</span>
                    <span className="text-sm font-bold text-white">{player.stats.scores100}</span>
                  </div>
                  <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                    <span className="text-[8px] text-emerald-300 font-bold">140+</span>
                    <span className="text-sm font-bold text-white">{player.stats.scores140}</span>
                  </div>
                  <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                    <span className="text-[8px] text-amber-300 font-bold">180</span>
                    <span className="text-sm font-black text-amber-500">{player.stats.scores180}</span>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}