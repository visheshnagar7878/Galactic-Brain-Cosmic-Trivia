import React from 'react';
import { PlanetData, PlanetType } from '../types';
import { Lock, Award, X } from 'lucide-react';
import { Leaf, Microscope, Hourglass, Rocket, Fish, Palette } from 'lucide-react';

interface PassportProps {
  planets: PlanetData[];
  badges: PlanetType[];
  onClose: () => void;
  playerName: string;
}

const Passport: React.FC<PassportProps> = ({ planets, badges, onClose, playerName }) => {
  const getIcon = (id: PlanetType) => {
    switch (id) {
      case PlanetType.NATURE: return <Leaf size={24} />;
      case PlanetType.SCIENCE: return <Microscope size={24} />;
      case PlanetType.HISTORY: return <Hourglass size={24} />;
      case PlanetType.SPACE: return <Rocket size={24} />;
      case PlanetType.OCEAN: return <Fish size={24} />;
      case PlanetType.ART: return <Palette size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-white/10 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                    <Award /> Captain's Log
                </h2>
                <p className="text-slate-400 text-sm font-mono mt-1">Pilot: {playerName}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <X size={28} />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {planets.map((planet) => {
                    const isUnlocked = badges.includes(planet.id);
                    
                    return (
                        <div 
                            key={planet.id}
                            className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all ${
                                isUnlocked 
                                ? 'bg-indigo-900/40 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                : 'bg-slate-900/50 border-slate-700 border-dashed opacity-70'
                            }`}
                        >
                            {isUnlocked ? (
                                <>
                                    <div 
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-white shadow-lg animate-in zoom-in duration-500"
                                        style={{ backgroundColor: planet.color }}
                                    >
                                        {getIcon(planet.id)}
                                    </div>
                                    <span className="text-green-400 font-bold text-sm uppercase text-center tracking-wider">
                                        Mission Complete
                                    </span>
                                    <h3 className="text-white font-bold mt-1 text-center">{planet.name}</h3>
                                    
                                    {/* Stamp Effect */}
                                    <div className="absolute top-2 right-2 border-2 border-green-500 text-green-500 text-[10px] font-bold px-1 rounded rotate-[-12deg] opacity-80">
                                        PASSED
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-600">
                                        <Lock size={24} />
                                    </div>
                                    <span className="text-slate-500 font-bold text-sm uppercase text-center tracking-wider">
                                        Locked
                                    </span>
                                    <h3 className="text-slate-600 font-bold mt-1 text-center">???</h3>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 p-4 text-center border-t border-white/10">
            <p className="text-blue-200 text-sm">
                Collect all 6 badges to complete your galactic training!
            </p>
        </div>
      </div>
    </div>
  );
};

export default Passport;