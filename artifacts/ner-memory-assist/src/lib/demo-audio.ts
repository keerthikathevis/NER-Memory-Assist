type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

type DemoPattern = {
  wave: OscillatorType;
  notes: number[];
  intervalMs: number;
  noteMs: number;
};

const patterns: DemoPattern[] = [
  { wave: 'square', notes: [294, 392, 440, 392, 330, 392], intervalMs: 360, noteMs: 210 },
  { wave: 'triangle', notes: [220, 247, 294, 330, 294, 247], intervalMs: 520, noteMs: 380 },
  { wave: 'sine', notes: [262, 330, 392, 523, 392, 330], intervalMs: 650, noteMs: 520 },
  { wave: 'triangle', notes: [196, 247, 294, 247, 220, 196], intervalMs: 760, noteMs: 620 },
  { wave: 'sawtooth', notes: [220, 277, 330, 370, 330, 277], intervalMs: 430, noteMs: 260 },
  { wave: 'sine', notes: [523, 659, 784, 659, 587, 523], intervalMs: 700, noteMs: 590 },
  { wave: 'triangle', notes: [147, 165, 196, 165, 147, 131], intervalMs: 980, noteMs: 830 },
  { wave: 'sine', notes: [196, 220, 247, 220, 196, 175], intervalMs: 1100, noteMs: 950 },
  { wave: 'triangle', notes: [262, 330, 392, 330, 294, 262], intervalMs: 820, noteMs: 680 },
];

class DemoAudioEngine {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private timer: number | null = null;
  private volume = 0.18;

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.context) {
      const AudioCtor = (window as AudioContextWindow).AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
      if (!AudioCtor) return null;
      this.context = new AudioCtor();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.context.destination);
    }
    return this.context;
  }

  play(tone = 0) {
    const context = this.getContext();
    if (!context || !this.gain) return false;
    void context.resume();
    this.stopNodes();

    const pattern = patterns[Math.abs(tone) % patterns.length];
    let step = 0;
    const schedule = () => {
      if (!this.context || !this.gain) return;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      const now = this.context.currentTime;
      oscillator.type = pattern.wave;
      oscillator.frequency.value = pattern.notes[step % pattern.notes.length];
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.72, now + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + pattern.noteMs / 1000);
      oscillator.connect(envelope);
      envelope.connect(this.gain);
      oscillator.start(now);
      oscillator.stop(now + pattern.noteMs / 1000 + 0.03);
      this.oscillators.push(oscillator);
      oscillator.onended = () => { this.oscillators = this.oscillators.filter((item) => item !== oscillator); };
      step += 1;
    };

    schedule();
    this.timer = window.setInterval(schedule, pattern.intervalMs);
    return true;
  }

  pause() {
    if (this.context?.state === 'running') void this.context.suspend();
    else if (this.context?.state === 'suspended') void this.context.resume();
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.stopNodes();
    if (this.context?.state === 'running') void this.context.suspend();
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.gain) this.gain.gain.value = this.volume;
  }

  private stopNodes() {
    this.oscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch { /* already stopped */ }
    });
    this.oscillators = [];
  }
}

export const demoAudio = new DemoAudioEngine();