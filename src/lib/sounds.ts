// Super soft, gentle sounds

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Soft gentle pop on drop
export function playPlaceSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Just a soft little pop
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    pop.type = 'sine';
    pop.frequency.setValueAtTime(280, now);
    pop.frequency.exponentialRampToValueAtTime(100, now + 0.04);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    
    popGain.gain.setValueAtTime(0.04, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    pop.connect(filter);
    filter.connect(popGain);
    popGain.connect(ctx.destination);
    
    pop.start(now);
    pop.stop(now + 0.06);

  } catch (e) {
    console.warn('Could not play sound:', e);
  }
}

// Soft gentle tap for UI
export function playAddSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Gentle high tap
    const tap = ctx.createOscillator();
    const tapGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    tap.type = 'sine';
    tap.frequency.setValueAtTime(1200, now);
    tap.frequency.exponentialRampToValueAtTime(800, now + 0.025);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    
    tapGain.gain.setValueAtTime(0.025, now);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    tap.connect(filter);
    filter.connect(tapGain);
    tapGain.connect(ctx.destination);
    
    tap.start(now);
    tap.stop(now + 0.04);

  } catch (e) {
    console.warn('Could not play sound:', e);
  }
}
