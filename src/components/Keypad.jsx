import { useState } from 'react';

export default function DartKeypad({ onDartThrow, onUndo, onValidate, canValidate, disabled }) {
  const [multiplier, setMultiplier] = useState(1);

  const handleScoreClick = (value) => {
    if (disabled) return;
    onDartThrow(value, multiplier);
    setMultiplier(1);
  };

  const handleBullClick = (val) => {
    if (disabled) return;
    onDartThrow(val, 1);
    setMultiplier(1);
  };

  // --- STYLES CSS (Tailwind) ---
  // shadow-[...] crée l'effet 3D en bas du bouton
  // active:translate-y simule l'enfoncement physique
  const btn3D = "relative h-12 rounded-lg font-black text-xl transition-all duration-75 flex items-center justify-center select-none active:scale-95";
  
  const styleNum = `${btn3D} bg-slate-700 text-slate-200 shadow-[0_4px_0_0_#334155] active:shadow-none active:translate-y-[4px] border-t border-slate-600`;
  
  const styleDoubleActive = `${btn3D} bg-rose-600 text-white shadow-[0_0_15px_#e11d48] border-2 border-rose-400 translate-y-0`;
  const styleDoubleInactive = `${btn3D} bg-slate-800 text-rose-700 border border-rose-900/30 opacity-60`;
  
  const styleTripleActive = `${btn3D} bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border-2 border-emerald-300 translate-y-0`;
  const styleTripleInactive = `${btn3D} bg-slate-800 text-emerald-600 border border-emerald-900/30 opacity-60`;

  const styleBull25 = `${btn3D} bg-emerald-800 text-emerald-100 shadow-[0_4px_0_0_#064e3b] active:shadow-none active:translate-y-[4px] border-t border-emerald-600`;
  const styleBull50 = `${btn3D} bg-rose-800 text-rose-100 shadow-[0_4px_0_0_#881337] active:shadow-none active:translate-y-[4px] border-t border-rose-600`;
  const styleMiss = `${btn3D} bg-slate-900 text-slate-500 shadow-[0_4px_0_0_#0f172a] active:shadow-none active:translate-y-[4px] border border-slate-700`;
  const styleUndo = `${btn3D} bg-amber-900/40 text-amber-500 shadow-[0_4px_0_0_#451a03] active:shadow-none active:translate-y-[4px] border border-amber-900`;

  return (
    <div className="w-full px-2 flex flex-col gap-3 pb-safe">
      
      {/* LIGNE MULTIPLICATEURS (NEON) */}
      <div className="flex gap-3 mb-1">
        <button 
          onClick={() => setMultiplier(multiplier === 2 ? 1 : 2)}
          className={`flex-1 ${multiplier === 2 ? styleDoubleActive : styleDoubleInactive}`}
        >
          DOUBLE
        </button>
        <button 
          onClick={() => setMultiplier(multiplier === 3 ? 1 : 3)}
          className={`flex-1 ${multiplier === 3 ? styleTripleActive : styleTripleInactive}`}
        >
          TRIPLE
        </button>
      </div>

      {/* GRILLE 1-20 */}
      <div className="grid grid-cols-5 gap-2">
        {[...Array(20)].map((_, i) => {
          const num = i + 1;
          return (
            <button key={num} onClick={() => handleScoreClick(num)} disabled={disabled} className={styleNum}>
              {num}
            </button>
          );
        })}
      </div>

      {/* LIGNE DU BAS */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => handleBullClick(25)} className={styleBull25}>25</button>
        <button onClick={() => handleBullClick(50)} className={styleBull50}>50</button>
        <button onClick={() => onDartThrow(0, 1)} className={styleMiss}>MISS</button>
        <button onClick={onUndo} className={styleUndo}>⌫</button>
      </div>
      
      {/* BOUTON VALIDATION */}
       <button 
          onClick={onValidate}
          disabled={!canValidate}
          className={`
            w-full py-4 rounded-xl font-black text-lg tracking-[0.2em] transition-all duration-300 uppercase
            ${canValidate 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] translate-y-0 opacity-100' 
              : 'bg-slate-800 text-slate-600 h-0 py-0 opacity-0 overflow-hidden'}
          `}
        >
          Valider le tour
        </button>
    </div>
  );
}