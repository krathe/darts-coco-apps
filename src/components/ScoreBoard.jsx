import { calculateAvg } from '../utils/stats';

export default function ScoreBoard({ players, currentPlayerId, matchScore, matchConfig }) {
  
  return (
    <div className="flex flex-col w-full items-center mb-6 mt-4 relative z-10">
      
      <div className="flex w-full gap-4 px-4 items-stretch justify-center h-48">
        {players.map((player) => {
          const isActive = player.id === currentPlayerId;
          const avg = calculateAvg(player.stats.totalPointsScored, player.stats.totalDarts);

          // STYLES DYNAMIQUES
          // Joueur Actif : Grand, Lumineux, Opaque
          const activeStyle = "scale-110 opacity-100 z-20 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50 bg-slate-800";
          // Joueur Inactif : Petit, Sombre, Transparent, Gris
          const inactiveStyle = "scale-95 opacity-40 z-0 grayscale-[0.8] blur-[0.5px] bg-slate-900 border border-white/5";

          return (
            <div 
              key={player.id}
              className={`
                flex-1 flex flex-col items-center justify-between py-4 px-2 rounded-2xl transition-all duration-500 ease-out relative overflow-hidden
                ${isActive ? activeStyle : inactiveStyle}
              `}
            >
              {/* Fond lumineux subtil pour le joueur actif */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
              )}

              {/* Indicateur "Tour en cours" */}
              {isActive && (
                <div className="absolute top-2 right-2 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                </div>
              )}

              {/* Nom du Joueur */}
              <h2 className={`text-xs uppercase tracking-[0.2em] font-bold mb-1 flex items-center justify-center w-full ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                <span className="truncate max-w-[120px]">{player.name}</span>
              </h2>
              
              {/* SCORE GÉANT */}
              <div className={`text-7xl font-black tracking-tighter my-auto drop-shadow-2xl transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {player.score}
              </div>

              {/* STATS FOOTER */}
              <div className="w-full mt-auto grid grid-cols-2 gap-2 px-1">
                
                {/* Sets & Legs */}
                <div className="bg-black/40 rounded-lg p-1.5 flex items-center justify-center gap-3 border border-white/5">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-amber-500 font-bold text-lg">{player.id === 1 ? matchScore.p1Sets : matchScore.p2Sets}</span>
                        <span className="text-[6px] text-slate-500 uppercase font-bold tracking-wider">Sets</span>
                    </div>
                    <div className="w-[1px] h-5 bg-white/10"></div>
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-emerald-400 font-bold text-lg">{player.id === 1 ? matchScore.p1Legs : matchScore.p2Legs}</span>
                        <span className="text-[6px] text-slate-500 uppercase font-bold tracking-wider">Legs</span>
                    </div>
                </div>

                {/* Moyenne */}
                <div className="bg-black/40 rounded-lg p-1.5 flex flex-col items-center justify-center border border-white/5">
                    <span className={`text-sm font-bold ${isActive ? "text-blue-300" : "text-slate-500"}`}>{avg}</span>
                    <span className="text-[6px] text-slate-500 uppercase font-bold tracking-wider">Avg</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}