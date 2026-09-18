type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

type TrackStyle = 'rhythm' | 'pluck' | 'bell' | 'flute' | 'melody' | 'bass' | 'rain' | 'ambient';

const tracks: Array<{ notes: number[]; style: TrackStyle; stepMs: number; gain: number }> = [
  { notes: [294, 392, 440, 494, 440, 392, 330, 392], style: 'rhythm', stepMs: 240, gain: 0.32 },
  { notes: [220, 262, 330, 392, 330, 294, 262, 220], style: 'pluck', stepMs: 520, gain: 0.34 },
  { notes: [262, 330, 392, 523, 494, 392, 330, 262], style: 'bell', stepMs: 620, gain: 0.30 },
  { notes: [196, 247, 294, 330, 370, 330, 294, 247], style: 'flute', stepMs: 760, gain: 0.28 },
  { notes: [220, 277, 330, 370, 415, 370, 330, 277], style: 'melody', stepMs: 560, gain: 0.30 },
  { notes: [523, 587, 659, 784, 659, 587, 523, 440], style: 'flute', stepMs: 680, gain: 0.26 },
  { notes: [147, 165, 196, 220, 196, 165, 147, 131], style: 'rain', stepMs: 1800, gain: 0.24 },
  { notes: [196, 220, 247, 294, 247, 220, 196, 175], style: 'ambient', stepMs: 2100, gain: 0.20 },
  { notes: [262, 294, 349, 392, 440, 392, 349, 294], style: 'pluck', stepMs: 700, gain: 0.30 },
  { notes: [174, 233, 261, 311, 349, 311, 261, 233], style: 'rain', stepMs: 1500, gain: 0.23 },
  { notes: [392, 440, 523, 659, 784, 659, 523, 440], style: 'bell', stepMs: 820, gain: 0.27 },
  { notes: [110, 147, 165, 196, 165, 147, 123, 110], style: 'bass', stepMs: 900, gain: 0.28 },
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

    const id = Math.abs(Math.trunc(tone)) % tracks.length;
    const track = tracks[id];

    switch (track.style) {
      case 'rhythm':
        this.playRhythm(context, track);
        break;
      case 'pluck':
        this.playPluck(context, track);
        break;
      case 'bell':
        this.playBell(context, track);
        break;
      case 'flute':
        this.playFlute(context, track);
        break;
      case 'bass':
        this.playBass(context, track);
        break;
      case 'rain':
        this.playRain(context, track);
        break;
      default:
        this.playAmbientMelody(context, track);
        break;
    }
    return true;
  }

  private scheduleOscillator(
    context: AudioContext,
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType,
    attack = 0.03,
  ) {
    if (!this.master) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const env = context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(Math.max(0.01, gainValue), now + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.03);
    this.nodes.push(osc, env);
  }

  private playRhythm(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 0.16, track.gain, 'square', 0.008);
      if (step % 2 === 0) this.scheduleOscillator(context, note / 2, 0.11, track.gain * 0.55, 'triangle', 0.005);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playPluck(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 0.48, track.gain, 'triangle', 0.008);
      this.scheduleOscillator(context, note * 2, 0.28, track.gain * 0.22, 'sine', 0.004);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playBell(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 1.15, track.gain, 'sine', 0.01);
      this.scheduleOscillator(context, note * 2.01, 0.75, track.gain * 0.32, 'sine', 0.01);
      this.scheduleOscillator(context, note * 3.01, 0.5, track.gain * 0.12, 'sine', 0.01);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playFlute(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 0.72, track.gain, 'sine', 0.12);
      this.scheduleOscillator(context, note * 2, 0.62, track.gain * 0.08, 'sine', 0.16);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playBass(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 0.72, track.gain, 'sawtooth', 0.05);
      this.scheduleOscillator(context, note * 2, 0.3, track.gain * 0.10, 'triangle', 0.03);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playAmbientMelody(context: AudioContext, track: (typeof tracks)[number]) {
    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 1.55, track.gain, 'sine', 0.35);
      this.scheduleOscillator(context, note * 1.5, 1.0, track.gain * 0.08, 'sine', 0.4);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
  }

  private playRain(context: AudioContext, track: (typeof tracks)[number]) {
    if (!this.master) return;

    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.13;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'bandpass';
    filter.frequency.value = track.notes[0] * 4;
    filter.Q.value = 0.55;
    gain.gain.value = track.gain * 0.7;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.nodes.push(source, filter, gain);

    let step = 0;
    const schedule = () => {
      const note = track.notes[step % track.notes.length];
      this.scheduleOscillator(context, note, 1.1, track.gain * 0.5, 'sine', 0.35);
      step += 1;
    };
    schedule();
    this.timer = window.setInterval(schedule, track.stepMs);
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
