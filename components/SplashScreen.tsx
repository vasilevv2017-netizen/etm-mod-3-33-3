import React from 'react';

interface Props {
  onNext: () => void;
}

const SplashScreen: React.FC<Props> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-8 bg-zinc-950 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/5 rounded-full blur-[150px]"></div>
      
      <div className="h-10"></div>

      <div className="text-center z-10">
        <h1 className="text-6xl font-black tracking-tighter text-red-500/60 drop-shadow-2xl">
          ETM <span className="text-zinc-600 text-3xl font-light tracking-widest">module</span>
          <span className="text-lg block mt-3 opacity-30 font-mono tracking-[0.5em] font-light">v3.33</span>
        </h1>
        <div className="w-12 h-0.5 bg-red-500/20 mx-auto mt-8 mb-4 rounded-full"></div>
        <p className="text-zinc-600 font-mono tracking-[0.5em] text-[8px] uppercase font-black">
          IN
        </p>
      </div>

      <div className="z-10 w-full flex justify-end pb-10 pr-4">
        <button
          onClick={onNext}
          className="w-24 h-10 bg-emerald-500/90 hover:bg-emerald-400 text-white font-medium rounded-2xl shadow-xl shadow-emerald-950/40 active:scale-95 transition-all text-xs tracking-wider border-t border-white/10"
        >
          поехали
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;