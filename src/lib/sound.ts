let audioContext: AudioContext|null = null

const getContext = ()=>{
    if (!audioContext){
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext;
}

const playTone = (freq:number, duration:number, type:OscillatorType = 'sine')=>{
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

export const playCorrectSound = () => {
  playTone(880, 0.15);
  setTimeout(() => playTone(1174.66, 0.2), 100);
};
export const playIncorrectSound = ()=>{
    playTone(150, 0.3, 'square');
}
