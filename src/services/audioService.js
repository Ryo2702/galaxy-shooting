const tones = {
  hover: [440, 0.035, 'sine', 0.015],
  click: [680, 0.07, 'sine', 0.025],
  laser: [860, 0.11, 'sawtooth', 0.025],
  explosion: [85, 0.24, 'triangle', 0.1],
  alert: [220, 0.25, 'square', 0.025],
  mission: [1100, 0.4, 'sine', 0.06],
  reward: [900, 0.15, 'sine', 0.035],
};

class AudioService {
  enabled = false;
  context = null;
  ambient = null;
  async enable(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.ambient?.gain.setTargetAtTime(0, this.context.currentTime, 0.2);
      return;
    }
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) {
      this.enabled = false;
      return;
    }
    this.context ??= new Context();
    await this.context.resume();
    if (!this.ambient) {
      this.ambient = this.context.createGain();
      this.ambient.gain.value = 0;
      this.ambient.connect(this.context.destination);
      [55, 82.41, 110.2].forEach((frequency) => {
        const oscillator = this.context.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.connect(this.ambient);
        oscillator.start();
      });
    }
    this.ambient.gain.setTargetAtTime(0.012, this.context.currentTime, 0.4);
  }
  play(name) {
    if (!this.enabled || !this.context || this.context.state !== 'running')
      return;
    const [frequency, duration, type, volume] = tones[name] || tones.click;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      name === 'laser' ? 100 : frequency * 0.65,
      now + duration,
    );
    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
}
export const audio = new AudioService();
