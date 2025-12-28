import React, { useState, useEffect } from 'react';
import StarField from './components/StarField';
import Planet from './components/Planet';
import RocketShip from './components/RocketShip';
import Button from './components/Button';
import { GameState, PlanetType, PlanetData, PlayerStats, TriviaQuestion, Difficulty } from './types';
import { generateTrivia } from './services/geminiService';
import { playSoundEffect, playBackgroundMusic, toggleMute } from './services/audioService';
import { Trophy, Fuel, Map as MapIcon, RotateCcw, Volume2, Sparkles, BrainCircuit, Shield, Swords, Skull, Check, X, VolumeX, Home } from 'lucide-react';

// Planet Configuration
const PLANETS_INITIAL: PlanetData[] = [
  { id: PlanetType.NATURE, name: "Terra Verde", color: "#22c55e", icon: "leaf", description: "The Jungle Planet. Home to amazing animals and lush forests!", completed: false, position: { x: 15, y: 30 } },
  { id: PlanetType.SCIENCE, name: "Atomos", color: "#3b82f6", icon: "microscope", description: "The Lab World. Where science experiments come to life!", completed: false, position: { x: 85, y: 25 } },
  { id: PlanetType.HISTORY, name: "Chronos", color: "#eab308", icon: "hourglass", description: "The Time Capsule. Travel back to ancient history!", completed: false, position: { x: 20, y: 65 } },
  { id: PlanetType.SPACE, name: "Stardust", color: "#a855f7", icon: "rocket", description: "Deep Space Outpost. Explore the mysteries of the universe!", completed: false, position: { x: 80, y: 70 } },
  { id: PlanetType.OCEAN, name: "Aquaria", color: "#06b6d4", icon: "fish", description: "The Water World. Dive deep into the blue ocean!", completed: false, position: { x: 50, y: 45 } },
  { id: PlanetType.ART, name: "Muse", color: "#ec4899", icon: "palette", description: "The Creative Comet. Painting, music, and imagination!", completed: false, position: { x: 50, y: 80 } },
];

// --- Separate Component to handle Travel Animation and Hooks correctly ---
interface TravelingScreenProps {
  travelPhase: 'warp' | 'landing';
  targetPlanet: PlanetData | undefined;
}

const TravelingScreen: React.FC<TravelingScreenProps> = ({ travelPhase, targetPlanet }) => {
    // Generate streaks for warp effect using useMemo (now safe inside a component)
    const streaks = React.useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
      duration: `${0.3 + Math.random() * 0.5}s`
    })), []);

    return (
      <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
        {/* Warp Background */}
        <div className="absolute inset-0 z-0">
           {travelPhase === 'warp' && streaks.map((s, i) => (
             <div 
               key={i} 
               className="star-streak" 
               style={{ 
                 left: s.left, 
                 animationDelay: s.delay,
                 animationDuration: s.duration
               }} 
             />
           ))}
           {/* During landing, we show static stars or normal starfield */}
           {travelPhase === 'landing' && <StarField />} 
        </div>

        {/* Rocket Container */}
        <div className={`z-20 transition-all duration-1000 ${travelPhase === 'warp' ? 'rocket-shake scale-125' : 'rocket-land-anim'}`}>
           {/* Rotate container to point Up (-45deg correction because icon is 45deg) */}
           <div className={`transform transition-transform duration-1000 ${travelPhase === 'warp' ? 'rotate-[-45deg]' : 'rotate-0'}`}>
             <RocketShip />
           </div>
        </div>
        
        {/* Status Text */}
        <div className="absolute top-[20%] z-20 text-center w-full">
             <h2 className={`text-4xl font-black text-white italic tracking-wider transition-opacity duration-300 ${travelPhase === 'warp' ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                WARP SPEED ENGAGED
             </h2>
        </div>

        {/* Approaching Text / Planet */}
        {travelPhase === 'landing' && targetPlanet && (
            <div className="absolute bottom-0 z-10 flex flex-col items-center justify-end w-full h-[60%] planet-rise">
                <div className="mb-12 text-center relative z-20">
                    <p className="text-blue-300 uppercase tracking-widest text-sm font-bold mb-2">Arriving at sector</p>
                    <h1 className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {targetPlanet.name}
                    </h1>
                </div>
                {/* Giant Planet Graphic for Landing Effect */}
                <div 
                    className="w-[150vw] h-[150vw] rounded-full -mb-[120vw] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-t-4 border-white/20 relative z-10"
                    style={{ backgroundColor: targetPlanet.color }}
                >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)]"></div>
                </div>
            </div>
        )}
      </div>
    );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [player, setPlayer] = useState<PlayerStats>({ name: '', fuel: 100, score: 0, badges: [], difficulty: 'easy' });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetType | null>(null);
  const [planets, setPlanets] = useState<PlanetData[]>(PLANETS_INITIAL);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Travel Animation State
  const [travelPhase, setTravelPhase] = useState<'warp' | 'landing'>('warp');

  // Mission State (Multiple Questions)
  const [missionQuestions, setMissionQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [missionScore, setMissionScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Background Music Effect
  useEffect(() => {
    playBackgroundMusic(gameState);
  }, [gameState]);

  // Handle Mute Toggle
  const handleToggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    toggleMute(newState);
  };
  
  const handleReturnToMenu = () => {
      playSound('click');
      setGameState(GameState.MENU);
  };

  // --- "Backend" Persistence (LocalStorage) ---
  useEffect(() => {
    // Load data on mount
    const savedPlayer = localStorage.getItem('gb_player');
    const savedPlanets = localStorage.getItem('gb_planets');
    
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer));
      // Optional: setGameState(GameState.MAP) if you want to skip menu
    }
    if (savedPlanets) {
      setPlanets(JSON.parse(savedPlanets));
    }
  }, []);

  useEffect(() => {
    // Save data on change
    if (player.name) {
      localStorage.setItem('gb_player', JSON.stringify(player));
    }
    localStorage.setItem('gb_planets', JSON.stringify(planets));
  }, [player, planets]);

  const playSound = (type: 'success' | 'fail' | 'click' | 'travel' | 'victory' | 'gameover') => {
    playSoundEffect(type);
  };

  const startGame = () => {
    if(!player.name.trim()) return;
    setGameState(GameState.MAP);
    playSound('click');
  };

  const handlePlanetInteraction = (planetId: PlanetType) => {
    if (selectedPlanet === planetId) {
        startTravel(planetId);
    } else {
        setSelectedPlanet(planetId);
        playSound('click');
    }
  };

  // Configuration for missions based on difficulty
  const getMissionConfig = (difficulty: Difficulty) => {
    switch(difficulty) {
        case 'hard': return { count: 5, passThreshold: 4 }; // 5 questions, need 4 to pass
        case 'medium': return { count: 4, passThreshold: 3 }; // 4 questions, need 3 to pass
        case 'easy': 
        default: return { count: 3, passThreshold: 2 }; // 3 questions, need 2 to pass
    }
  };

  const startTravel = async (planetId: PlanetType) => {
    if (player.fuel <= 0) return;
    
    setSelectedPlanet(planetId);
    setGameState(GameState.TRAVELING);
    setTravelPhase('warp');
    playSound('travel');
    
    setLoading(true);
    
    // Minimum travel time of 2.5s for the warp effect
    const minTravelTime = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
        const missionConfig = getMissionConfig(player.difficulty);
        // Fetch questions based on difficulty config
        const questionsPromise = generateTrivia(planetId, player.difficulty, missionConfig.count); 
        
        // Wait for both API and Animation
        const [questions] = await Promise.all([questionsPromise, minTravelTime]);

        setMissionQuestions(questions);
        setCurrentQuestionIndex(0);
        setMissionScore(0);
        setFeedback(null);
        setSelectedAnswerIndex(null);
        
        // Switch to Landing Phase
        setTravelPhase('landing');
        
        // Allow landing animation to play for 1.5s
        setTimeout(() => {
            setGameState(GameState.TRIVIA);
            setLoading(false);
        }, 1500); 
    } catch (e) {
        setLoading(false);
        setGameState(GameState.MAP);
        alert("Communications with the planet failed! Try again.");
    }
  };

  const getDifficultyRewards = (diff: Difficulty) => {
      switch(diff) {
          case 'hard': return { score: 100, fuelGain: 10, fuelLoss: 10 };
          case 'medium': return { score: 75, fuelGain: 8, fuelLoss: 8 };
          case 'easy': 
          default: return { score: 50, fuelGain: 5, fuelLoss: 5 };
      }
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswerIndex !== null) return; 
    
    const currentQ = missionQuestions[currentQuestionIndex];
    setSelectedAnswerIndex(index);
    const isCorrect = index === currentQ.correctAnswerIndex;
    const rewards = getDifficultyRewards(player.difficulty);

    if (isCorrect) {
      setFeedback('correct');
      playSound('success');
      setMissionScore(prev => prev + 1);
      setPlayer(prev => ({
        ...prev,
        score: prev.score + rewards.score,
        fuel: Math.min(prev.fuel + rewards.fuelGain, 100),
      }));
    } else {
      setFeedback('incorrect');
      playSound('fail');
      setPlayer(prev => ({
        ...prev,
        fuel: Math.max(prev.fuel - rewards.fuelLoss, 0),
      }));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < missionQuestions.length - 1) {
        // Next Question
        setFeedback(null);
        setSelectedAnswerIndex(null);
        setCurrentQuestionIndex(prev => prev + 1);
        playSound('click');
    } else {
        // End of Mission Logic
        finishMission();
    }
  };

  const finishMission = () => {
      const missionConfig = getMissionConfig(player.difficulty);
      const passed = missionScore >= missionConfig.passThreshold;
      
      if (passed && selectedPlanet) {
          if (!player.badges.includes(selectedPlanet)) {
               setPlayer(prev => ({...prev, badges: [...prev.badges, selectedPlanet]}));
               setPlanets(prev => prev.map(p => p.id === selectedPlanet ? { ...p, completed: true } : p));
          }
          playSound('victory');
      } else {
          playSound('fail');
      }

      // Check overarching game state
      if (player.fuel <= 0) {
        setGameState(GameState.GAME_OVER);
        playSound('gameover');
      } else {
          const currentPlanetsState = passed && selectedPlanet 
             ? planets.map(p => p.id === selectedPlanet ? { ...p, completed: true } : p)
             : planets;
             
          const allCompleted = currentPlanetsState.every(p => p.completed);

          if (allCompleted) {
              setGameState(GameState.VICTORY);
              playSound('victory');
          } else {
              setGameState(GameState.MAP);
              setSelectedPlanet(null);
              playSound('click');
          }
      }
  };
  
  const resetGame = () => {
      const resetPlayer = { name: player.name, fuel: 100, score: 0, badges: [], difficulty: 'easy' as Difficulty };
      setPlayer(resetPlayer);
      setPlanets(PLANETS_INITIAL);
      setGameState(GameState.MAP); 
      localStorage.removeItem('gb_planets');
      localStorage.setItem('gb_player', JSON.stringify(resetPlayer));
      playSound('click');
  }

  // --- Renderers ---
  
  const renderMuteButton = () => (
    <button 
        onClick={handleToggleMute}
        className="fixed top-4 right-4 z-50 p-2 bg-slate-900/80 backdrop-blur border border-white/20 rounded-full hover:bg-slate-800 transition-colors text-white"
        title={isMuted ? "Unmute" : "Mute"}
    >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>
  );

  const renderHomeButton = () => {
      if (gameState !== GameState.MAP && gameState !== GameState.TRIVIA) return null;
      
      return (
        <button 
            onClick={handleReturnToMenu}
            className="fixed top-4 right-16 z-50 p-2 bg-slate-900/80 backdrop-blur border border-white/20 rounded-full hover:bg-slate-800 transition-colors text-white"
            title="Return to Menu"
        >
            <Home size={24} />
        </button>
      );
  };
  
  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative px-4">
      <div className="mb-8 relative animate-bounce">
         <RocketShip className="scale-150 rotate-[-15deg]" />
      </div>
      <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-6 text-center drop-shadow-lg">
        Galactic Brain
      </h1>
      <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-lg text-center font-light">
        A cosmic trivia adventure. <br/> <span className="text-sm text-slate-400">(Your progress is saved automatically)</span>
      </p>
      
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl w-full max-w-md">
        <label className="block text-blue-300 text-sm font-bold mb-2 ml-2 uppercase tracking-wide">Pilot Name</label>
        <input 
          type="text" 
          maxLength={12}
          placeholder="Enter your name..."
          className="w-full px-6 py-4 rounded-full bg-slate-900/80 border-2 border-blue-500/50 text-white text-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 mb-6 placeholder-slate-500 text-center"
          value={player.name}
          onChange={(e) => setPlayer({...player, name: e.target.value})}
        />
        
        <label className="block text-blue-300 text-sm font-bold mb-3 ml-2 uppercase tracking-wide">Select Difficulty</label>
        <div className="grid grid-cols-3 gap-2 mb-8">
            <button 
                onClick={() => { setPlayer({...player, difficulty: 'easy'}); playSound('click'); }}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all border-2 ${player.difficulty === 'easy' ? 'bg-green-500/20 border-green-400' : 'bg-slate-900/50 border-transparent hover:bg-slate-800'}`}
            >
                <Shield size={24} className={player.difficulty === 'easy' ? 'text-green-400' : 'text-slate-400'} />
                <span className={`text-xs font-bold ${player.difficulty === 'easy' ? 'text-white' : 'text-slate-400'}`}>Cadet</span>
            </button>
            <button 
                onClick={() => { setPlayer({...player, difficulty: 'medium'}); playSound('click'); }}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all border-2 ${player.difficulty === 'medium' ? 'bg-yellow-500/20 border-yellow-400' : 'bg-slate-900/50 border-transparent hover:bg-slate-800'}`}
            >
                <Swords size={24} className={player.difficulty === 'medium' ? 'text-yellow-400' : 'text-slate-400'} />
                <span className={`text-xs font-bold ${player.difficulty === 'medium' ? 'text-white' : 'text-slate-400'}`}>Explorer</span>
            </button>
            <button 
                onClick={() => { setPlayer({...player, difficulty: 'hard'}); playSound('click'); }}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all border-2 ${player.difficulty === 'hard' ? 'bg-red-500/20 border-red-400' : 'bg-slate-900/50 border-transparent hover:bg-slate-800'}`}
            >
                <Skull size={24} className={player.difficulty === 'hard' ? 'text-red-400' : 'text-slate-400'} />
                <span className={`text-xs font-bold ${player.difficulty === 'hard' ? 'text-white' : 'text-slate-400'}`}>Ace</span>
            </button>
        </div>

        <Button onClick={startGame} size="lg" className="w-full" disabled={!player.name}>
          Launch Mission 🚀
        </Button>
      </div>
    </div>
  );

  const renderMap = () => (
    <div 
        className="relative w-full h-screen z-10 overflow-hidden" 
        onClick={() => setSelectedPlanet(null)}
    >
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl p-4 flex gap-4 pointer-events-auto shadow-xl">
           <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pilot</span>
              <span className="text-xl font-bold text-white">{player.name || 'Cadet'}</span>
           </div>
           <div className="w-px bg-white/20"></div>
           <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mode</span>
              <span className={`text-xl font-bold uppercase ${player.difficulty === 'hard' ? 'text-red-400' : player.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                {player.difficulty}
              </span>
           </div>
           <div className="w-px bg-white/20"></div>
           <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Score</span>
              <span className="text-xl font-bold text-yellow-400">{player.score}</span>
           </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-center gap-3 pointer-events-auto shadow-xl mr-28">
           <Fuel className={`${player.fuel < 30 ? 'text-red-500 animate-pulse' : 'text-green-400'}`} />
           <div className="w-32 h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
              <div 
                className={`h-full transition-all duration-500 ${player.fuel < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-green-400 to-blue-500'}`}
                style={{ width: `${player.fuel}%` }} 
              />
           </div>
           <span className="font-mono font-bold w-8 text-right">{Math.round(player.fuel)}%</span>
        </div>
      </div>

      <div className="absolute top-24 w-full text-center pointer-events-none">
         <h2 className="text-2xl text-blue-200 font-light bg-black/30 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
             {selectedPlanet ? 'Tap again to engage warp drive!' : 'Select a planet to explore'}
         </h2>
      </div>

      {planets.map(planet => (
        <Planet 
          key={planet.id} 
          data={planet} 
          onClick={handlePlanetInteraction}
          isSelected={selectedPlanet === planet.id}
          disabled={false} 
        />
      ))}
    </div>
  );

  const renderTrivia = () => {
      const currentQuestion = missionQuestions[currentQuestionIndex];
      if (!currentQuestion) return null;

      return (
        <div className="flex flex-col items-center justify-center h-screen z-10 relative px-4">
             <div className="w-full max-w-3xl bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 {/* Header */}
                 <div className="bg-slate-900/50 p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded text-white uppercase tracking-wider">
                             {selectedPlanet}
                         </span>
                         <span className="text-slate-400 text-sm font-mono">
                             Mission Progress: {currentQuestionIndex + 1} / {missionQuestions.length}
                         </span>
                    </div>
                    {/* Visual indicators for progress */}
                    <div className="flex gap-1">
                        {missionQuestions.map((_, i) => (
                             <div key={i} className={`h-2 w-8 rounded-full ${i < currentQuestionIndex ? 'bg-green-500' : i === currentQuestionIndex ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                        ))}
                    </div>
                 </div>

                 {/* Question */}
                 <div className="p-8 text-center flex-grow flex flex-col justify-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
                        {currentQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {currentQuestion.options.map((option, idx) => {
                            let btnVariant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary';
                            
                            // Reveal phase
                            if (selectedAnswerIndex !== null) {
                                if (idx === currentQuestion.correctAnswerIndex) btnVariant = 'success';
                                else if (idx === selectedAnswerIndex) btnVariant = 'danger';
                                else btnVariant = 'primary';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedAnswerIndex !== null}
                                    className={`
                                        p-6 rounded-2xl text-lg font-bold transition-all transform duration-300 border-b-4
                                        ${selectedAnswerIndex === null ? 'hover:scale-[1.02] hover:-translate-y-1 active:translate-y-0' : ''}
                                        ${btnVariant === 'secondary' ? 'bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-500' : ''}
                                        ${btnVariant === 'success' ? 'bg-green-500 border-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' : ''}
                                        ${btnVariant === 'danger' ? 'bg-red-500 border-red-700 text-white opacity-80' : ''}
                                        ${selectedAnswerIndex !== null && idx !== currentQuestion.correctAnswerIndex && idx !== selectedAnswerIndex ? 'opacity-40 grayscale' : ''}
                                    `}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                 </div>

                 {/* Feedback Footer */}
                 {feedback && (
                     <div className={`p-6 ${feedback === 'correct' ? 'bg-green-500/20 border-t border-green-500/50' : 'bg-red-500/20 border-t border-red-500/50'} animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                             <div className={`p-4 rounded-full ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'} flex-shrink-0`}>
                                 {feedback === 'correct' ? <Check size={32} /> : <X size={32} />}
                             </div>
                             <div className="flex-grow text-center md:text-left">
                                 <h4 className={`text-xl font-bold mb-1 ${feedback === 'correct' ? 'text-green-300' : 'text-red-300'}`}>
                                     {feedback === 'correct' ? 'Correct!' : 'Incorrect!'}
                                 </h4>
                                 <p className="text-white/90 text-lg leading-snug">
                                     {currentQuestion.explanation}
                                 </p>
                             </div>
                             <Button onClick={handleNextQuestion} variant={feedback === 'correct' ? 'success' : 'primary'} className="flex-shrink-0 whitespace-nowrap">
                                 {currentQuestionIndex < missionQuestions.length - 1 ? 'Next Question' : 'Complete Mission'}
                             </Button>
                        </div>
                     </div>
                 )}
             </div>
        </div>
      );
  }

  const renderEndGame = (victory: boolean) => (
      <div className="flex flex-col items-center justify-center h-screen z-10 relative px-4 text-center">
          <div className="mb-6 p-8 bg-white/10 rounded-full backdrop-blur-lg border border-white/20 shadow-2xl">
            {victory ? <Trophy size={80} className="text-yellow-400 animate-bounce" /> : <Fuel size={80} className="text-red-500 animate-pulse" />}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-4 text-white drop-shadow-lg">
              {victory ? "Mission Accomplished!" : "Out of Fuel!"}
          </h1>
          
          <p className="text-2xl text-blue-200 mb-8 max-w-xl">
              {victory 
                ? `Captain ${player.name} has successfully mapped the galaxy with a score of ${player.score}!` 
                : "Your rocket drifted into a nebula. Don't worry, rescue is on the way!"}
          </p>

          <div className="flex gap-4">
              <Button onClick={resetGame} variant="secondary" size="lg" className="flex items-center gap-2">
                  <RotateCcw /> Play Again
              </Button>
          </div>
      </div>
  )

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      <StarField />
      
      {renderMuteButton()}
      {renderHomeButton()}
      
      {gameState === GameState.MENU && renderMenu()}
      {gameState === GameState.MAP && renderMap()}
      
      {/* Replaced renderTraveling() call with component usage */}
      {gameState === GameState.TRAVELING && <TravelingScreen travelPhase={travelPhase} targetPlanet={planets.find(p => p.id === selectedPlanet)} />}
      
      {gameState === GameState.TRIVIA && renderTrivia()}
      {gameState === GameState.GAME_OVER && renderEndGame(false)}
      {gameState === GameState.VICTORY && renderEndGame(true)}
      
      {/* Loading Overlay (Global) - Only show if not in traveling state to avoid double spinners */}
      {loading && gameState !== GameState.TRAVELING && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
      )}
    </div>
  );
};

export default App;