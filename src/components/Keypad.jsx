import { useState } from 'react';

export default function DartKeypad({ onDartThrow, onUndo, disabled, currentBobs27Target }) {
  const [multiplier, setMultiplier] = useState(1); // 1, 2, or 3

  const handleNumberClick = (num) => {
    if (disabled) return;
    onDartThrow(num, multiplier);
    setMultiplier(1); // Reset auto après un lancer
  };

  const toggleMultiplier = (val) => {
    if (disabled) return;
    setMultiplier(multiplier === val ? 1 : val);
  };

  // --- MODE BOB'S 27 SIMPLIFIÉ (COMPTEUR DE TOUCHES) ---
  if (currentBobs27Target !== undefined && currentBobs27Target !== null) {
      const handleHits = (count) => {
          if (disabled) return;
          // On ajoute les touches
          for (let i = 0; i < count; i++) {
              if (currentBobs27Target === 25) onDartThrow(50, 1);
              else onDartThrow(currentBobs27Target, 2);
          }
          // On complète avec des loupés pour arriver à 3 fléchettes
          for (let i = 0; i < (3 - count); i++) {
              onDartThrow(0, 1);
          }
      };

      return (
        <div className="w-full flex flex-col gap-4 px-4 pb-safe animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Combien de doubles réussis ?</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 h-48">
                {/* 0 HIT / MISS */}
                <button 
                    onClick={() => handleHits(0)}
                    disabled={disabled}
                    className="bg-slate-800/50 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all active:bg-rose-900/20 group"
                >
                    <span className="text-3xl mb-1 opacity-40 group-active:scale-125 transition-transform">❌</span>
                    <span className="text-slate-400 font-black text-xl">MISS</span>
                </button>

                {/* 1 HIT */}
                <button 
                    onClick={() => handleHits(1)}
                    disabled={disabled}
                    className="bg-emerald-900/20 border-2 border-emerald-500/50 rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all active:bg-emerald-500/20 group"
                >
                    <span className="text-4xl font-black text-emerald-400 group-active:scale-110 transition-transform">1</span>
                    <span className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-widest">Double</span>
                </button>

                {/* 2 HITS */}
                <button 
                    onClick={() => handleHits(2)}
                    disabled={disabled}
                    className="bg-emerald-900/40 border-2 border-emerald-400 rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all active:bg-emerald-400/30 group shadow-lg shadow-emerald-900/20"
                >
                    <span className="text-4xl font-black text-emerald-300 group-active:scale-110 transition-transform">2</span>
                    <span className="text-[10px] text-emerald-400/50 font-bold uppercase tracking-widest">Doubles</span>
                </button>

                {/* 3 HITS */}
                <button 
                    onClick={() => handleHits(3)}
                    disabled={disabled}
                    className="bg-emerald-500 border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 rounded-3xl flex flex-col items-center justify-center transition-all shadow-xl shadow-emerald-900/40 group"
                >
                    <span className="text-5xl font-black text-white drop-shadow-md group-active:scale-110 transition-transform">3</span>
                    <span className="text-emerald-900 font-black uppercase tracking-widest text-[10px]">Parfait !</span>
                </button>
            </div>

            {/* BARRE OUTILS */}
            <div className="flex justify-center">
                <button 
                    onClick={onUndo} 
                    disabled={disabled}
                    className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:text-white"
                >
                    <span>⌫</span> Annuler la volée précédente
                </button>
            </div>
        </div>
      );
  }

  // --- MODE STANDARD ---
  return (
    <div className="w-full flex flex-col gap-2 px-2 select-none touch-manipulation pb-safe">
      
      {/* BARRE D'ACTIONS RAPIDES */}
      <div className="flex gap-2 h-14">
        {/* Undo */}
        <button 
            onClick={onUndo} 
            disabled={disabled}
            className="w-14 h-full rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xl flex items-center justify-center active:scale-95 transition-all active:bg-slate-700"
        >
            ⌫
        </button>

        {/* Multiplicateur DOUBLE */}
        <button 
            onClick={() => toggleMultiplier(2)}
            disabled={disabled}
            className={`flex-1 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 border-b-4 flex flex-col items-center justify-center leading-none
                ${multiplier === 2 
                    ? 'bg-rose-500 border-rose-700 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] translate-y-[2px] border-b-0' 
                    : 'bg-slate-800 border-slate-900 text-rose-500 hover:bg-slate-700'
                }
            `}
        >
            Double
            {multiplier === 2 && <span className="text-[10px] opacity-80 font-normal normal-case">Activé</span>}
        </button>

        {/* Multiplicateur TRIPLE */}
        <button 
            onClick={() => toggleMultiplier(3)}
            disabled={disabled}
            className={`flex-1 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 border-b-4 flex flex-col items-center justify-center leading-none
                ${multiplier === 3 
                    ? 'bg-cyan-500 border-cyan-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] translate-y-[2px] border-b-0' 
                    : 'bg-slate-800 border-slate-900 text-cyan-400 hover:bg-slate-700'
                }
            `}
        >
            Triple
            {multiplier === 3 && <span className="text-[10px] opacity-80 font-normal normal-case">Activé</span>}
        </button>
      </div>

      {/* GRILLE NUMÉRIQUE */}
      <div className="grid grid-cols-5 gap-2 h-64">
        {/* Chiffres 1 à 20 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            disabled={disabled}
            className={`
                rounded-lg font-bold text-xl transition-all active:scale-90 shadow-lg border-b-4 
                ${multiplier === 1 ? 'bg-slate-700 border-slate-900 text-white hover:bg-slate-600' : ''}
                ${multiplier === 2 ? 'bg-rose-900/40 border-rose-900 text-rose-300 hover:bg-rose-900/60' : ''}
                ${multiplier === 3 ? 'bg-cyan-900/40 border-cyan-900 text-cyan-300 hover:bg-cyan-900/60' : ''}
            `}
          >
            {num}
          </button>
        ))}
        
        {/* DERNIÈRE LIGNE : MISS | 25 | 50 */}
        
        {/* MISS (0) */}
        <button 
            onClick={() => handleNumberClick(0)} 
            disabled={disabled}
            className="rounded-lg font-bold text-[10px] text-slate-500 bg-slate-800 border-b-4 border-slate-900 hover:bg-slate-700 active:scale-90 uppercase tracking-widest"
        >
            MISS
        </button>

        {/* 25 (SIMPLE BULL / VERT) */}
        <button 
            onClick={() => { onDartThrow(25, 1); setMultiplier(1); }} 
            disabled={disabled || multiplier === 3} // Pas de triple 25
            className="col-span-2 rounded-lg font-black text-lg text-emerald-100 bg-emerald-700 border-b-4 border-emerald-900 hover:bg-emerald-600 active:scale-90 shadow-lg flex items-center justify-center gap-2"
        >
            <span className="w-3 h-3 bg-emerald-300 rounded-full"></span>
            25
        </button>

        {/* 50 (BULLSEYE / ROUGE) */}
        <button 
            onClick={() => { onDartThrow(50, 1); setMultiplier(1); }} 
            disabled={disabled || multiplier === 3} // Pas de triple 50
            className="col-span-2 rounded-lg font-black text-lg text-white bg-red-600 border-b-4 border-red-800 hover:bg-red-500 active:scale-90 shadow-lg flex items-center justify-center gap-2"
        >
            <span className="w-3 h-3 bg-red-200 rounded-full animate-pulse"></span>
            BULL
        </button>

      </div>
    </div>
  );
}