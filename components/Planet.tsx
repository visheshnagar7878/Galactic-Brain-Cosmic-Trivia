import React from 'react';
import { PlanetData, PlanetType } from '../types';
import { Leaf, Microscope, Hourglass, Rocket, CheckCircle, ArrowRight, Fish, Palette } from 'lucide-react';

interface PlanetProps {
  data: PlanetData;
  onClick: (planet: PlanetType) => void;
  disabled: boolean;
  isSelected?: boolean;
}

const Planet: React.FC<PlanetProps> = ({ data, onClick, disabled, isSelected }) => {
  const getIcon = () => {
    switch (data.id) {
      case PlanetType.NATURE: return <Leaf size={32} className="text-white drop-shadow-md" />;
      case PlanetType.SCIENCE: return <Microscope size={32} className="text-white drop-shadow-md" />;
      case PlanetType.HISTORY: return <Hourglass size={32} className="text-white drop-shadow-md" />;
      case PlanetType.SPACE: return <Rocket size={32} className="text-white drop-shadow-md" />;
      case PlanetType.OCEAN: return <Fish size={32} className="text-white drop-shadow-md" />;
      case PlanetType.ART: return <Palette size={32} className="text-white drop-shadow-md" />;
    }
  };

  return (
    <div 
      className={`group absolute flex flex-col items-center justify-center transition-all duration-500 ${disabled ? 'opacity-50 grayscale' : 'cursor-pointer'} ${isSelected ? 'z-30 scale-110' : 'hover:scale-110 z-10'}`}
      style={{ 
        left: `${data.position.x}%`, 
        top: `${data.position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        !disabled && onClick(data.id);
      }}
    >
      {/* Description Tooltip */}
      <div className={`absolute bottom-full mb-8 w-60 p-4 bg-slate-900/95 border border-blue-500/50 rounded-2xl text-center transition-all duration-300 shadow-[0_0_25px_rgba(59,130,246,0.6)] backdrop-blur-md transform ${isSelected ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-4 scale-95 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100'} pointer-events-none z-50`}>
        <h4 className="text-blue-300 font-bold text-sm uppercase tracking-wider mb-1">{data.name}</h4>
        <p className="text-white text-sm font-medium leading-snug mb-2">{data.description}</p>
        
        {isSelected && (
           <div className="mt-2 text-xs font-bold text-green-400 flex items-center justify-center gap-1 animate-pulse">
              Click to Travel <ArrowRight size={12} />
           </div>
        )}

        {/* Arrow */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-r border-b border-blue-500/50 rotate-45"></div>
      </div>

      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 transition-all duration-300 ${isSelected ? 'border-green-400 shadow-[0_0_50px_rgba(34,197,94,0.6)]' : 'border-white/20'} float-animation`}
           style={{ backgroundColor: data.color }}>
        
        {/* Selection Visuals */}
        {isSelected && (
            <>
                {/* Spinning dashed orbit ring */}
                <div className="absolute -inset-6 rounded-full border-2 border-dashed border-green-400/50 animate-[spin_6s_linear_infinite]" />
                {/* Reverse spinning finer dotted orbit */}
                <div className="absolute -inset-3 rounded-full border border-dotted border-white/40 animate-[spin_8s_linear_infinite_reverse]" />
                {/* Pulsing inner glow */}
                <div className="absolute -inset-1 rounded-full bg-green-400/20 animate-pulse" />
            </>
        )}

        {/* Planet Ring simulation for Space planet */}
        {data.id === PlanetType.SPACE && (
           <div className="absolute w-32 h-8 border-4 border-white/30 rounded-[100%] rotate-[-20deg]" />
        )}
        
        {/* Crater details */}
        <div className="absolute w-4 h-4 rounded-full bg-black/10 top-4 left-6" />
        <div className="absolute w-6 h-6 rounded-full bg-black/10 bottom-6 right-6" />

        <div className="relative z-10">
            {getIcon()}
        </div>
        
        {data.completed && (
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white z-20">
            <CheckCircle size={16} className="text-white" />
          </div>
        )}
      </div>
      
      {/* Label */}
      <span className={`mt-5 font-bold text-white text-lg bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border transition-colors relative z-20 ${isSelected ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-white/10 group-hover:bg-blue-600/80'}`}>
        {data.name}
      </span>
    </div>
  );
};

export default Planet;