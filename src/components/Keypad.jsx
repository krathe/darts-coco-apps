import { useState } from 'react';

export default function DartKeypad({ onDartThrow, onUndo, disabled }) {
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