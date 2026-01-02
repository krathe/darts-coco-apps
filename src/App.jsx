import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGameLogic } from './hooks/useGameLogic';
import ScoreBoard from './components/ScoreBoard';
import DartKeypad from './components/Keypad';
import GameSetup from './components/GameSetup';
import GameStats from './components/GameStats';
import GameHistory from './components/GameHistory';
import StatsDashboard from './components/StatsDashboard';
import { setAppMute } from './utils/sound';

const CheckoutViz = ({ hint }) => {
  if (!hint) return <div className="text-slate-600 text-xs italic opacity-40 font-bold tracking-widest h-8 flex items-center"></div>;
  const steps = hint.split(' ');
  return (
    <div className="flex gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 h-8">
      {steps.map((step, idx) => {
        let bgColor = "bg-slate-700"; let borderColor = "border-slate-500"; let textColor = "text-slate-300"; let label = "S";
        if (step.startsWith('T')) { bgColor = "bg-emerald-900/80"; borderColor = "border-emerald-500"; textColor = "text-emerald-300"; label = "TRIPLE"; } 
        else if (step.startsWith('D')) { bgColor = "bg-rose-900/80"; borderColor = "border-rose-500"; textColor = "text-rose-300"; label = "DOUBLE"; } 
        else if (step.includes('BULL')) { bgColor = "bg-red-900"; borderColor = "border-red-500"; textColor = "text-white"; label = "BULLSEYE"; }
        return (
          <div key={idx} className={`flex flex-col items-center justify-center px-3 py-0.5 rounded-md border-b-2 shadow-sm ${bgColor} ${borderColor}`}>
             <span className={`text-[6px] font-black uppercase tracking-wider mb-[-2px] opacity-70 ${textColor}`}>{label}</span>
             <span className={`text-sm font-black ${textColor}`}>{step.replace('T','').replace('D','')}</span>
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const { 
    gameState, setGameState, players, currentPlayer, addDart, undoLastDart, validateTurn, 
    currentTurnDarts, winner, legWinner, startNextLeg, matchScore, matchConfig,
    startGame, backToMenu, checkoutHint, calculateStats,
    undoTurn, canUndo, restartGame
  } = useGameLogic();

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('darts_muted') === 'true');

  useEffect(() => {
    setAppMute(isMuted);
    localStorage.setItem('darts_muted', isMuted);
  }, [isMuted]);

  useEffect(() => {
    const loadVoices = () => { window.speechSynthesis.getVoices(); };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { console.error(err); }
    };
    requestWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { if (wakeLock) wakeLock.release(); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, []);

  useEffect(() => {
    if (winner) {
      const duration = 3000; const end = Date.now() + duration;
      (function frame() { confetti({ particleCount: 5, spread: 60, origin: { x: Math.random(), y: 0.6 }, colors: ['#10B981', '#FBBF24'] }); if (Date.now() < end) requestAnimationFrame(frame); }());
    }
  }, [winner]);

  if (gameState === 'STATS') return <StatsDashboard onBack={backToMenu} />;
  if (gameState === 'HISTORY') return <GameHistory onBack={backToMenu} />;
  
  if (gameState === 'SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GameSetup onStart={startGame} onShowHistory={() => setGameState('HISTORY')} onShowStats={() => setGameState('STATS')} />
      </div>
    );
  }

  const currentTurnTotal = currentTurnDarts.reduce((acc, d) => acc + d.points, 0);

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-4 max-w-md mx-auto select-none overflow-hidden relative font-kanit">
      
      {/* --- HEADER AMÉLIORÉ --- */}
      <div className="w-full flex justify-between items-center px-4 mb-4 z-50">
        
        {/* Bouton Menu (Carré Rounded) */}
        <button 
            onClick={backToMenu} 
            className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all active:scale-95 shadow-lg group"
        >
            <span className="text-xl group-hover:-translate-x-0.5 transition-transform">←</span>
        </button>

        {/* Info Centrale (Badge Pill) */}
        <div className="flex flex-col items-center justify-center bg-slate-900/50 px-6 py-2 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
          <h1 className="text-lg font-black text-emerald-400 tracking-wider leading-none drop-shadow-md">
            {matchConfig.mode}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
             <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {matchConfig.setsToWin} Sets • {matchConfig.legsToWin} Legs
             </span>
          </div>
        </div>

        {/* Groupe Actions Droite */}
        <div className="flex gap-2">
            
            {/* Bouton Undo (État Actif/Inactif) */}
            <button 
                onClick={undoTurn} 
                disabled={!canUndo} 
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl transition-all active:scale-95 shadow-lg
                    ${canUndo 
                        ? 'bg-amber-900/20 border-amber-500/50 text-amber-400 hover:bg-amber-900/40' 
                        : 'bg-slate-800 border-slate-700 text-slate-600 opacity-50 cursor-not-allowed'}
                `}
            >
                ↩
            </button>

            {/* Bouton Mute */}
            <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl transition-all active:scale-95 shadow-lg
                    ${isMuted 
                        ? 'bg-rose-900/20 border-rose-500/50 text-rose-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}
                `}
            >
                {isMuted ? "🔇" : "🔊"}
            </button>
        </div>
      </div>

      <ScoreBoard players={players} currentPlayerId={currentPlayer.id} matchScore={matchScore} matchConfig={matchConfig} />

      <div className="w-full px-4 h-12 flex items-center justify-center mb-1">
         <CheckoutViz hint={checkoutHint} />
      </div>

      <div className="w-full px-4 mb-2">
        <div className="glass-panel rounded-2xl p-3 flex flex-col items-center border border-white/5 bg-slate-800/40 shadow-xl">
          <div className="flex gap-6 mb-1">
            {[0, 1, 2].map((index) => {
              const dart = currentTurnDarts[index];
              let borderColor = "border-slate-700"; let bgColor = "bg-slate-800"; let textColor = "text-slate-600";
              if (dart) {
                textColor = "text-white";
                if (dart.isBust) { borderColor = "border-red-500"; bgColor = "bg-red-900"; textColor = "text-red-300"; } 
                else if (dart.multiplier === 3) { borderColor = "border-emerald-500"; bgColor = "bg-emerald-900"; } 
                else if (dart.multiplier === 2 || dart.baseScore === 50) { borderColor = "border-rose-500"; bgColor = "bg-rose-900"; } 
                else { borderColor = "border-slate-400"; bgColor = "bg-slate-600"; }
              }
              return (
                <div key={index} className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 shadow-lg transition-all duration-200 ${borderColor} ${bgColor} ${textColor} ${dart ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
                  {dart ? dart.text : <span className="w-2 h-2 rounded-full bg-slate-700 shadow-inner"></span>}
                </div>
              );
            })}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span>Volée</span>
            <span className="h-[1px] w-4 bg-slate-700"></span>
            <span className="text-white text-sm font-black">{currentTurnTotal}</span>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col justify-end pb-4">
        <DartKeypad 
            onDartThrow={addDart} 
            onUndo={undoLastDart} 
            disabled={!!winner || !!legWinner} 
        />
      </div>

      {legWinner && !winner && (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center z-40 animate-in fade-in zoom-in duration-300">
          <h3 className="text-slate-400 text-xl uppercase tracking-widest mb-2 font-bold">{legWinner.setWon ? "SET REMPORTÉ !" : "MANCHE REMPORTÉE"}</h3>
          <h2 className="text-6xl font-black text-white mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{legWinner.player.name}</h2>
          <div className="flex gap-8 mb-10 text-center">
             <div><div className="text-5xl font-black text-amber-500">{matchScore.p1Sets} - {matchScore.p2Sets}</div><div className="text-xs text-slate-500 uppercase font-bold mt-1">Sets</div></div>
             <div><div className="text-5xl font-black text-emerald-400">{matchScore.p1Legs} - {matchScore.p2Legs}</div><div className="text-xs text-slate-500 uppercase font-bold mt-1">Legs</div></div>
          </div>
          <button onClick={startNextLeg} className="bg-white text-slate-900 px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">Manche Suivante ➔</button>
          <button onClick={undoTurn} className="mt-8 text-slate-500 hover:text-white underline text-sm">Oups, annuler la victoire</button>
        </div>
      )}

      {winner && <GameStats winner={winner} stats={calculateStats(winner)} onRestart={restartGame} />}
    </div>
  )
}
export default App;