type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const melodies: number[][] = [
  [294, 392, 440, 392, 330, 294],
  [220, 262, 330, 392, 330, 262],
  [262, 294, 330, 392, 523, 392],
  [196, 247, 294, 330, 294, 247],
  [220, 277, 330, 370, 330, 277],
  [523, 659, 784, 659, 587, 523],
  [147, 165, 196, 165, 147, 131],
  [196, 220, 247, 220, 196, 175],
  [262, 330, 392, 330, 294, 262],
  [174, 233, 261, 311, 261, 233],
  [392, 440, 523, 659, 523, 440],
  [110, 147, 165, 147, 123, 110],
];

class DemoAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private timer: number | null = null;
  private volume = 0.18;

  private getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.context) {
      const AudioCtor = (window as AudioContextWindow).AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
      if (!AudioCtor) return null;
      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }
    return this.context;
  }

  play(tone = 0) {
    const context = this.getContext();
    if (!context || !this.master) return false;
    void context.resume();
    this.stopNodes();

    const id = Math.abs(tone) % melodies.length;
    const melody = melodies[id];

    // Each track uses a different synthesis style, so tracks are audibly different.
    if (id === 6 || id === 7 || id === 11) {
      this.playAmbient(context, id);
    } else if (id === 4) {
      this.playFlute(context, melody);
    } else if (id === 0) {
      this.playRhythm(context, melody);
    } else {
      this.playMelody(context, melody, id);
    }
    return true;
  }

  private playMelody(context: AudioContext, notes: number[], id: number) {
    let step = 0;
    const interval = 420 + id * 45;
    const schedule = () => {
      if (!this.master) return;
      const now = context.currentTime;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = id % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = notes[step % notes.length];
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.45, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      osc.connect(env);
      env.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.52);
      this.nodes.push(osc, env);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, interval);
  }

  private playFlute(context: AudioContext, notes: number[]) {
    let step = 0;
    const schedule = () => {
      if (!this.master) return;
      const now = context.currentTime;
      const osc = context.createOscillator();
      const harmonic = context.createOscillator();
      const env = context.createGain();
      osc.type = 'sine';
      harmonic.type = 'sine';
      osc.frequency.value = notes[step % notes.length];
      harmonic.frequency.value = notes[step % notes.length] * 2;
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.34, now + 0.12);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      osc.connect(env);
      harmonic.connect(env);
      env.connect(this.master);
      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.8);
      harmonic.stop(now + 0.8);
      this.nodes.push(osc, harmonic, env);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, 850);
  }

  private playRhythm(context: AudioContext, notes: number[]) {
    let step = 0;
    const schedule = () => {
      if (!this.master) return;
      const now = context.currentTime;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[step % notes.length];
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(env);
      env.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.18);
      this.nodes.push(osc, env);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, 220);
  }

  private playAmbient(context: AudioContext, id: number) {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * (id === 11 ? 0.11 : 0.07);

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = id === 6 ? 'lowpass' : 'bandpass';
    filter.frequency.value = id === 6 ? 850 : 1400;
    filter.Q.value = 0.7;
    gain.gain.value = 0.8;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.nodes.push(source, filter, gain);

    let step = 0;
    const notes = melodies[id];
    const schedule = () => {
      if (!this.master) return;
      const now = context.currentTime;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[step % notes.length];
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.12, now + 0.5);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(env);
      env.connect(this.master);
      osc.start(now);
      osc.stop(now + 1.9);
      this.nodes.push(osc, env);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, 1900);
  }

  pause() {
    if (!this.context) return;
    if (this.context.state === 'running') void this.context.suspend();
    else if (this.context.state === 'suspended') void this.context.resume();
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.stopNodes();
    if (this.context?.state === 'running') void this.context.suspend();
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.master) this.master.gain.value = this.volume;
  }

  private stopNodes() {
    this.nodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode | AudioBufferSourceNode).stop === 'function') {
          (node as OscillatorNode | AudioBufferSourceNode).stop();
        }
      } catch {
        // Node may already be stopped.
      }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    this.nodes = [];
  }
}

export const demoAudio = new DemoAudioEngine();