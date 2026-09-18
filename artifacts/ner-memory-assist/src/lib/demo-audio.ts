type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

type DemoPattern = {
  wave: OscillatorType;
  notes: number[];
  intervalMs: number;
  noteMs: number;
  detune?: number;
  gain?: number;
};

const patterns: DemoPattern[] = [
  { wave: 'square', notes: [294, 392, 440, 392, 330, 392], intervalMs: 360, noteMs: 210, gain: 0.55 },
  { wave: 'triangle', notes: [220, 247, 294, 330, 294, 247], intervalMs: 520, noteMs: 380, gain: 0.62 },
  { wave: 'sine', notes: [262, 330, 392, 523, 392, 330], intervalMs: 650, noteMs: 520, gain: 0.58 },
  { wave: 'triangle', notes: [196, 247, 294, 247, 220, 196], intervalMs: 760, noteMs: 620, gain: 0.62 },
  { wave: 'sawtooth', notes: [220, 277, 330, 370, 330, 277], intervalMs: 430, noteMs: 260, gain: 0.42 },
  { wave: 'sine', notes: [523, 659, 784, 659, 587, 523], intervalMs: 700, noteMs: 590, gain: 0.5 },
  { wave: 'triangle', notes: [147, 165, 196, 165, 147, 131], intervalMs: 980, noteMs: 830, gain: 0.7 },
  { wave: 'sine', notes: [196, 220, 247, 220, 196, 175], intervalMs: 1100, noteMs: 950, gain: 0.68 },
  { wave: 'triangle', notes: [262, 330, 392, 330, 294, 262], intervalMs: 820, noteMs: 680, gain: 0.58 },
  { wave: 'sine', notes: [174, 233, 261, 311, 261, 233], intervalMs: 910, noteMs: 760, detune: -7, gain: 0.48 },
  { wave: 'triangle', notes: [392, 440, 523, 659, 523, 440], intervalMs: 480, noteMs: 330, detune: 5, gain: 0.5 },
  { wave: 'sine', notes: [110, 147, 165, 147, 123, 110], intervalMs: 1250, noteMs: 1080, detune: 3, gain: 0.72 },
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
      oscillator.detune.value = pattern.detune ?? 0;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(pattern.gain ?? 0.6, now + 0.025);
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