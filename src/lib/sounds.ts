// Sound effects for game events
// Using Web Audio API to generate simple sound effects

// Extend the Window interface to include webkitAudioContext for browser compatibility
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Sound effects for different game events
  cellReveal() {
    this.playTone(800, 0.1, 'sine', 0.05);
  }

  cellFlag() {
    this.playTone(600, 0.15, 'square', 0.08);
  }

  cellUnflag() {
    this.playTone(400, 0.1, 'square', 0.06);
  }

  gameWin() {
    // Victory sound - ascending notes
    setTimeout(() => this.playTone(523, 0.2, 'sine', 0.1), 0);     // C
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.1), 100);   // E
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.1), 200);   // G
    setTimeout(() => this.playTone(1047, 0.4, 'sine', 0.1), 300);  // C
  }
  gameLoss() {
    // Explosion sound
    this.playTone(150, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.1), 100);
  }
  bombExplosion() {
    // Enhanced bomb explosion sound with multiple layers for realism
    // Initial blast - deep rumble
    this.playTone(80, 0.25, 'sawtooth', 0.15);
    
    // Mid-range explosion crack
    setTimeout(() => this.playTone(250, 0.15, 'square', 0.12), 20);
    
    // High-frequency debris/shrapnel sound
    setTimeout(() => this.playTone(800, 0.08, 'triangle', 0.06), 40);
    
    // Final rumble decay
    setTimeout(() => this.playTone(60, 0.2, 'sawtooth', 0.08), 80);
  }

  gameStart() {
    this.playTone(440, 0.1, 'sine', 0.08);
  }

  // Extended victory fanfare for the modal
  modalVictoryFanfare() {
    if (!this.enabled) return;
    
    // Main victory melody
    setTimeout(() => this.playTone(523, 0.3, 'sine', 0.1), 0);     // C
    setTimeout(() => this.playTone(659, 0.3, 'sine', 0.1), 150);   // E
    setTimeout(() => this.playTone(784, 0.3, 'sine', 0.1), 300);   // G
    setTimeout(() => this.playTone(1047, 0.5, 'sine', 0.1), 450);  // C
    
    // Harmony layer
    setTimeout(() => this.playTone(392, 0.2, 'triangle', 0.05), 0);   // G
    setTimeout(() => this.playTone(494, 0.2, 'triangle', 0.05), 150); // B
    setTimeout(() => this.playTone(587, 0.2, 'triangle', 0.05), 300); // D
    setTimeout(() => this.playTone(785, 0.3, 'triangle', 0.05), 450); // G
    
    // Celebration sparkles
    setTimeout(() => this.playTone(1568, 0.1, 'sine', 0.03), 600);
    setTimeout(() => this.playTone(1760, 0.1, 'sine', 0.03), 650);
    setTimeout(() => this.playTone(1975, 0.1, 'sine', 0.03), 700);
  }

  // Modal defeat sound
  modalDefeatSound() {
    if (!this.enabled) return;
    
    // Descending defeat melody
    setTimeout(() => this.playTone(440, 0.4, 'sawtooth', 0.1), 0);   // A
    setTimeout(() => this.playTone(392, 0.4, 'sawtooth', 0.1), 200); // G
    setTimeout(() => this.playTone(349, 0.4, 'sawtooth', 0.1), 400); // F
    setTimeout(() => this.playTone(293, 0.6, 'sawtooth', 0.1), 600); // D
    
    // Deep rumble
    setTimeout(() => this.playTone(110, 0.5, 'sawtooth', 0.08), 0);
    setTimeout(() => this.playTone(98, 0.6, 'sawtooth', 0.06), 300);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
