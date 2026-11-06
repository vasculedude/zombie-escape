export function createSoundEffects() {
    let context = null;

    const getContext = () => {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;

        if (!AudioCtor) {
            return null;
        }

        if (!context) {
            context = new AudioCtor();
        }

        return context;
    };

    const unlock = async () => {
        const audioContext = getContext();

        if (!audioContext) {
            return;
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    };

    const playTone = ({
        frequency = 440,
        duration = 0.12,
        type = 'square',
        volume = 0.05,
        endFrequency = null,
        attack = 0.01,
        decay = 0.08,
        startTime = 0
    }) => {
        const audioContext = getContext();

        if (!audioContext) {
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);

        if (endFrequency) {
            oscillator.frequency.exponentialRampToValueAtTime(
                endFrequency,
                audioContext.currentTime + startTime + duration
            );
        }

        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + startTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + startTime + duration + decay);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration + decay + 0.05);
    };

    return {
        unlock,
        playExplosion: () => {
            playTone({ frequency: 90, duration: 0.7, type: 'sawtooth', volume: 0.08, endFrequency: 20 });
            playTone({ frequency: 140, duration: 0.45, type: 'triangle', volume: 0.06, endFrequency: 35, startTime: 0.08 });
        }
    };
}

export default createSoundEffects;
