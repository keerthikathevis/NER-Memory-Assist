type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

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
    const notes = [220, 262, 330, 392, 494].map((frequency) => frequency * (1 + tone * 0.025));
    let step = 0;
    const schedule = () => {
      if (!this.context || !this.gain) return;
      const oscillator = this.context.createOscillator();
      const now = this.context.currentTime;
      oscillator.type = tone % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = notes[step % notes.length];
      oscillator.connect(this.gain);
      oscillator.start(now);
      oscillator.stop(now + 0.55);
      this.oscillators.push(oscillator);
      oscillator.onended = () => { this.oscillators = this.oscillators.filter((item) => item !== oscillator); };
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, 700);
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