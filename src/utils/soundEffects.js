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
        playShot: () => {
            playTone({ frequency: 180, duration: 0.08, type: 'square', volume: 0.04, endFrequency: 70 });
        },
        playExplosion: () => {
            playTone({ frequency: 90, duration: 0.7, type: 'sawtooth', volume: 0.08, endFrequency: 20 });
            playTone({ frequency: 140, duration: 0.45, type: 'triangle', volume: 0.06, endFrequency: 35, startTime: 0.08 });
        },
        playZombieDamage: () => {
            playTone({ frequency: 145, duration: 0.24, type: 'sawtooth', volume: 0.035, endFrequency: 58, attack: 0.025, decay: 0.16 });
            playTone({ frequency: 290, duration: 0.2, type: 'triangle', volume: 0.022, endFrequency: 116, attack: 0.02, decay: 0.14, startTime: 0.015 });
            playTone({ frequency: 95, duration: 0.12, type: 'square', volume: 0.012, endFrequency: 48, attack: 0.01, decay: 0.08, startTime: 0.16 });
        },
        playHumanDamage: () => {
            playTone({ frequency: 245, duration: 0.14, type: 'triangle', volume: 0.035, endFrequency: 118, attack: 0.012, decay: 0.14 });
            playTone({ frequency: 490, duration: 0.11, type: 'sine', volume: 0.009, endFrequency: 236, attack: 0.01, decay: 0.1 });
        },
        playDeath: () => {
            playTone({ frequency: 90, duration: 0.35, type: 'sawtooth', volume: 0.07, endFrequency: 34 });
            playTone({ frequency: 40, duration: 0.55, type: 'square', volume: 0.04, endFrequency: 14, startTime: 0.12 });
        }
    };
}

export default createSoundEffects;
