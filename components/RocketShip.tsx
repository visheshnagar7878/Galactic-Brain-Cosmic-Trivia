import React from 'react';
import { Rocket as RocketIcon } from 'lucide-react';

interface RocketShipProps {
    className?: string;
}

const RocketShip: React.FC<RocketShipProps> = ({ className = '' }) => {
    return (
        <div className={`relative ${className}`}>
             {/* Engine Flame */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-4 h-8 bg-orange-500 rounded-full blur-sm animate-pulse origin-top scale-y-150"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-5 bg-yellow-300 rounded-full blur-[2px]"></div>
            </div>
            
            <div className="bg-white p-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] border-4 border-gray-200 z-10 relative">
                 <RocketIcon size={40} className="text-blue-600 fill-blue-100 rotate-45" />
            </div>
        </div>
    );
};

export default RocketShip;