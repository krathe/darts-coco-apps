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

function App() {
  const { 
    gameState, setGameState, players, currentPlayer, addDart, undoLastDart, validateTurn, 
    currentTurnDarts, winner, legWinner, startNextLeg, matchScore, matchConfig,
    startGame, backToMenu, checkoutHint, calculateStats,
    undoTurn, canUndo
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

  // --- WAKE LOCK ---
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) { console.error(err); }
    };
    requestWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // --- CONFETTIS ---
  useEffect(() => {
    if (winner) {
      const duration = 3000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 5, spread: 60, origin: { x: Math.random(), y: 0.6 }, colors: ['#10B981', '#FBBF24'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }, [winner]);

  // --- ROUTING ---
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

  // --- RENDU JEU ---
  return (
    <div className="min-h-screen text-white flex flex-col items-center py-4 max-w-md mx-auto select-none overflow-hidden relative font-kanit">
      
      {/* HEADER */}
      <div className="w-full flex justify-between items-center px-4 mb-2">
        <div className="flex gap-2">
            <button onClick={backToMenu} className="text-slate-400 hover:text-white text-xs uppercase font-bold text-left transition">
              Menu
            </button>
            <button 
              onClick={undoTurn}
              disabled={!canUndo}
              className={`text-xs px-2 py-1 rounded border ${canUndo ? 'border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white' : 'border-transparent text-slate-700'} transition`}
            >
              ↩ Annuler
            </button>
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-bold text-emerald-400 tracking-wider">CHAMPIONSHIP</h1>
          <span className="text-[10px] text-slate-500">{matchConfig.setsToWin} Sets • {matchConfig.legsToWin} Legs</span>
        </div>

        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className="w-8 text-right text-xl hover:scale-110 transition active:scale-95"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* SCOREBOARD DESIGN */}
      <ScoreBoard players={players} currentPlayerId={currentPlayer.id} matchScore={matchScore} matchConfig={matchConfig} />

      {/* ZONE DE VOLÉE (DESIGN CERCLES COLORÉS) */}
      <div className="w-full px-4 mb-2">
        <div className="glass-panel rounded-2xl p-4 flex flex-col items-center border border-white/5">
          <div className="flex gap-4 mb-2">
            {[0, 1, 2].map((index) => {
              const dart = currentTurnDarts[index];
              let borderColor = "border-slate-700";
              let bgColor = "bg-slate-800/50";
              let textColor = "text-slate-600";
              let shadow = "";

              if (dart) {
                textColor = "text-white";
                if (dart.isBust) {
                  borderColor = "border-red-500";
                  bgColor = "bg-red-900/50";
                  textColor = "text-red-400";
                } else if (dart.multiplier === 3) {
                  borderColor = "border-emerald-400";
                  bgColor = "bg-emerald-900/60";
                  shadow = "shadow-[0_0_15px_rgba(52,211,153,0.4)]";
                } else if (dart.multiplier === 2 || dart.baseScore === 50) {
                  borderColor = "border-rose-500";
                  bgColor = "bg-rose-900/60";
                  shadow = "shadow-[0_0_15px_rgba(244,63,94,0.4)]";
                } else {
                  borderColor = "border-slate-400";
                  bgColor = "bg-slate-700";
                }
              }

              return (
                <div key={index} className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-4 transition-all duration-300 ${borderColor} ${bgColor} ${textColor} ${shadow} ${dart ? 'scale-110' : 'scale-100'}`}>
                  {dart ? dart.text : index + 1}
                </div>
              );
            })}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Total Volée 
            <span className="text-2xl text-white font-black bg-slate-900 px-3 py-1 rounded-lg shadow-inner border border-slate-700">
              {currentTurnTotal}
            </span>
          </div>
        </div>
      </div>

      {/* CHECKOUT HINT */}
      <div className="w-full px-4 h-10 flex items-center justify-center mb-1">
        {checkoutHint ? (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse flex items-center gap-2 border border-white/20">
            <span className="text-xs uppercase bg-black/20 px-2 py-1 rounded">Finish</span>
            <span className="text-lg font-mono tracking-wider">{checkoutHint}</span>
          </div>
        ) : <div className="text-slate-600 text-xs italic opacity-40">Concentration...</div>}
      </div>

      {/* CLAVIER 3D (UNIQUE) */}
      <div className="w-full flex-1 flex flex-col justify-end pb-4">
        <DartKeypad onDartThrow={addDart} onUndo={undoLastDart} onValidate={validateTurn} canValidate={currentTurnDarts.length > 0} disabled={!!winner || !!legWinner} />
      </div>

      {/* MODALE VICTOIRE MANCHE */}
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

      {/* ECRAN STATS FIN DE MATCH */}
      {winner && <GameStats winner={winner} stats={calculateStats(winner)} onRestart={backToMenu} />}
    </div>
  )
}
export default App;