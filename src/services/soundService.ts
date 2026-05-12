/**
 * SoundService handles game sound effects using the Web Audio API.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private createOscillator(freq: number, type: OscillatorType, startTime: number, duration: number) {
    if (!this.audioCtx) return null;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    return { osc, gain };
  }

  playDiceRoll() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    
    // Simulate dice rolling with random short pops
    for (let i = 0; i < 5; i++) {
        const time = now + i * 0.1;
        const sound = this.createOscillator(100 + Math.random() * 50, 'square', time, 0.05);
        if (sound) {
            sound.gain.gain.setValueAtTime(0.1, time);
            sound.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            sound.osc.start(time);
            sound.osc.stop(time + 0.05);
        }
    }
  }

  playMove() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const sound = this.createOscillator(440, 'sine', now, 0.1);
    if (sound) {
        sound.osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        sound.gain.gain.setValueAtTime(0.1, now);
        sound.gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        sound.osc.start(now);
        sound.osc.stop(now + 0.1);
    }
  }

  playCapture() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const sound = this.createOscillator(200, 'sawtooth', now, 0.3);
    if (sound) {
        sound.osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        sound.gain.gain.setValueAtTime(0.2, now);
        sound.gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        sound.osc.start(now);
        sound.osc.stop(now + 0.3);
    }
  }

  playHome() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
        const time = now + i * 0.1;
        const sound = this.createOscillator(freq, 'triangle', time, 0.2);
        if (sound) {
            sound.gain.gain.setValueAtTime(0.1, time);
            sound.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            sound.osc.start(time);
            sound.osc.stop(time + 0.2);
        }
    });
  }

  playWin() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 523.25, 659.25, 783.99, 1046.50]; // C5, C5, E5, G5, C6
    notes.forEach((freq, i) => {
        const time = now + i * 0.15;
        const sound = this.createOscillator(freq, 'sine', time, 0.3);
        if (sound) {
            sound.gain.gain.setValueAtTime(0.15, time);
            sound.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            sound.osc.start(time);
            sound.osc.stop(time + 0.3);
        }
    });
  }
}

export const soundService = new SoundService();
