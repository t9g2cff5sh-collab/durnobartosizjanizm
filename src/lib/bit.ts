type Kind = "trap" | "boom bap" | "oldschool" | "choir";

const ctxRef: { current: AudioContext | null } = { current: null };

function ctx() {
  ctxRef.current ??= new AudioContext();
  return ctxRef.current;
}

export function playBit(kind: Kind | string) {
  const audio = ctx();
  void audio.resume();
  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  master.connect(audio.destination);

  const osc = audio.createOscillator();
  const osc2 = audio.createOscillator();
  if (kind === "trap") {
    osc.type = "square";
    osc.frequency.setValueAtTime(90, now);
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(45, now);
  } else if (kind === "boom bap") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(110, now);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(55, now);
  } else if (kind === "choir") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.exponentialRampToValueAtTime(147, now + 1.4);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(98, now);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(130.8, now);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(65.4, now);
  }
  osc.connect(master);
  osc2.connect(master);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 1.85);
  osc2.stop(now + 1.85);
}
