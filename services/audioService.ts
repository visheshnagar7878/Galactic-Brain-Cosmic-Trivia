import { GameState } from "../types";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted: boolean = false;

// Track active music nodes to stop them when state changes
let activeOscillators: OscillatorNode[] = [];
let activeIntervals: number[] = [];
let activeGainNodes: GainNode[] = [];

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.value = isMuted ? 0 : 0.3;
  }
  return audioContext;
};

export const toggleMute = (muted: boolean) => {
  isMuted = muted;
  if (masterGain) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.3, now + 0.1);
  }
};

const stopCurrentMusic = () => {
  activeOscillators.forEach(osc => {
    try { osc.stop(); osc.disconnect(); } catch (e) {}
  });
  activeGainNodes.forEach(g => {
    try { g.disconnect(); } catch (e) {}
  });
  activeIntervals.forEach(id => window.clearInterval(id));
  
  activeOscillators = [];
  activeGainNodes = [];
  activeIntervals = [];
};

// Generative Music Engines
const playMenuMusic = (ctx: AudioContext, dest: AudioNode) => {
  // Theme: "Cosmic Awe" - Lush, warm Major 7th pad with filter movement
  // Chord: C Major 7 (C, G, B, E) spread out
  const freqs = [130.81, 196.00, 246.94, 329.63]; 
  
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Sawtooth gives a rich harmonic content like a synth
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    
    // Lowpass filter to smooth it out (warm sound)
    filter.type = 'lowpass';
    filter.frequency.value = 400; 
    filter.Q.value = 1;

    // LFO to slowly sweep the filter (movement)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + (i * 0.02); // Slightly different speeds per note
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200; // Modulate filter cutoff by +/- 200Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    gain.gain.value = 0.03; // Keep volume low to prevent clipping
    
    osc.start();
    lfo.start();
    
    activeOscillators.push(osc, lfo);
    activeGainNodes.push(gain, lfoGain);
  });
};

const playMapMusic = (ctx: AudioContext, dest: AudioNode) => {
    // Theme: "Lydian Exploration" - Mysterious and bright
    
    // 1. Bass Drone (D3)
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 146.83; 
    droneGain.gain.value = 0.08;
    droneOsc.connect(droneGain);
    droneGain.connect(dest);
    droneOsc.start();
    activeOscillators.push(droneOsc);
    activeGainNodes.push(droneGain);

    // 2. Random Space Bells in D Lydian Scale
    // Scale: D, E, F#, G#, A, B, C# (Lydian mode has a #4 which sounds very "spacey")
    const scale = [587.33, 659.25, 739.99, 830.61, 880.00, 987.77, 1108.73];
    
    const playBell = () => {
        if (ctx.state === 'suspended') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle'; // Clear, pure tone
        osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];
        
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.05); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); // Long decay (reverb-like tail)
        
        osc.connect(gain);
        gain.connect(dest);
        
        osc.start(now);
        osc.stop(now + 3.0);
    };

    // Play a note every 2-3 seconds
    const interval = window.setInterval(playBell, 2500); 
    activeIntervals.push(interval);
};

const playTriviaMusic = (ctx: AudioContext, dest: AudioNode) => {
    // Theme: "Computer Calculation" - Playful, rhythmic bubbling
    
    const baseFreq = 220; // A3
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square'; // Retro computer sound
    osc.frequency.value = baseFreq;

    // Bandpass filter to isolate a specific frequency range (nasal/robotic sound)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    
    // Sequencer LFO: Jumps frequency up and down rapidly
    const seqLfo = ctx.createOscillator();
    seqLfo.type = 'square';
    seqLfo.frequency.value = 6; // 6 Hz speed
    const seqGain = ctx.createGain();
    seqGain.gain.value = 110; // Modulate frequency by +/- 110Hz (Octave jumps)
    
    seqLfo.connect(seqGain);
    seqGain.connect(osc.frequency);

    gain.gain.value = 0.02; // Very quiet background texture

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start();
    seqLfo.start();

    activeOscillators.push(osc, seqLfo);
    activeGainNodes.push(gain, seqGain);
};

export const playBackgroundMusic = (gameState: GameState) => {
  const ctx = getAudioContext();
  if (!masterGain) return;

  // Crossfade / Stop previous
  stopCurrentMusic();

  if (ctx.state === 'suspended') {
    // Browser autoplay policy might pause this until interaction
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  
  // Create a channel for this state's music
  const stateGain = ctx.createGain();
  stateGain.connect(masterGain);
  stateGain.gain.setValueAtTime(0, now);
  stateGain.gain.linearRampToValueAtTime(0.5, now + 2); // 2s fade in
  activeGainNodes.push(stateGain);

  switch (gameState) {
    case 'MENU':
      playMenuMusic(ctx, stateGain);
      break;
    case 'MAP':
    case 'GAME_OVER':
    case 'VICTORY':
      playMapMusic(ctx, stateGain);
      break;
    case 'TRIVIA':
      playTriviaMusic(ctx, stateGain);
      break;
    case 'TRAVELING':
        // Silence music during travel to focus on engine SFX
      break;
  }
};

// SFX System (kept similar to before but routed through master)
export const playSoundEffect = (type: 'click' | 'travel' | 'success' | 'fail' | 'victory' | 'gameover') => {
  const ctx = getAudioContext();
  if (!masterGain) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(e => console.error(e));
  }
  const now = ctx.currentTime;

  // SFX have their own sub-mix to be slightly louder than music
  const sfxGain = ctx.createGain();
  sfxGain.connect(masterGain);
  sfxGain.gain.value = 1.2; 

  switch (type) {
    case 'click':
        {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            g.connect(sfxGain);
            osc.connect(g);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.3, now + 0.01);
            g.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
      break;
    
    case 'travel':
      {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(120, now + 2.0);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(800, now + 2.0);

        osc.connect(filter);
        filter.connect(g);
        g.connect(sfxGain);
        
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.5, now + 0.2);
        g.gain.setValueAtTime(0.5, now + 1.8);
        g.gain.linearRampToValueAtTime(0, now + 2.0);
        
        osc.start(now);
        osc.stop(now + 2.0);
      }
      break;

    case 'success':
      {
        const notes = [523.25, 659.25, 783.99]; 
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(sfxGain);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = now + i * 0.05;
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(0.3, start + 0.05);
            g.gain.exponentialRampToValueAtTime(0.01, start + 0.8);
            osc.start(start);
            osc.stop(start + 0.8);
        });
      }
      break;

    case 'fail':
      {
        const notes = [200, 290]; 
        notes.forEach((freq) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(sfxGain);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq - 50, now + 0.5);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.3, now + 0.1);
            g.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        });
      }
      break;

    case 'victory':
      {
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; 
        const timings = [0, 0.15, 0.3, 0.45, 0.6, 0.9];
        notes.forEach((freq, i) => {
             const osc = ctx.createOscillator();
             const g = ctx.createGain();
             osc.connect(g);
             g.connect(sfxGain);
             osc.type = 'sine';
             osc.frequency.value = freq;
             const start = now + timings[i];
             const duration = i === notes.length - 1 ? 1.0 : 0.2;
             g.gain.setValueAtTime(0, start);
             g.gain.linearRampToValueAtTime(0.3, start + 0.05);
             g.gain.exponentialRampToValueAtTime(0.01, start + duration);
             osc.start(start);
             osc.stop(start + duration);
        });
      }
      break;
      
    case 'gameover':
       {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 2.0);
        osc.connect(g);
        g.connect(sfxGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 2.0);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.1);
        g.gain.linearRampToValueAtTime(0, now + 2.0);
        osc.start(now);
        osc.stop(now + 2.0);
       }
       break;
  }
};