import { getGame, MODULE_ID } from './constants.js';

type SoundHandle = foundry.audio.Sound;

let currentReplySound: SoundHandle | null = null;
let shouldContinueReplySound = false;
let lastComSoundTime = 0;

export function getAudioState(): { currentReplySound: SoundHandle | null; shouldContinueReplySound: boolean } {
    return {
        currentReplySound,
        shouldContinueReplySound,
    };
}

export function setShouldContinueReplySound(value: boolean): void {
    shouldContinueReplySound = value;
}

export async function playSoundWithHelper(
    soundPath: string,
    volume: number,
    loop: boolean = false,
    label: string = 'generic',
) {
    try {
        const baseVolume = getGame().settings.get(MODULE_ID, 'soundVolume');
        const safeVolume = volume > baseVolume ? baseVolume : volume;
        return await getGame().audio.play(soundPath, { volume: safeVolume, loop });
    } catch (error) {
        console.error(`MUTHUR Audio | Error during ${label} sound playback:`, error);
    }
}

export async function playAlarmSound(volume?: number): Promise<void> {
    const soundPath = getGame().settings.get(MODULE_ID, 'alarmSoundPath');
    if (!soundPath) return;
    await playSoundWithHelper(soundPath, volume ?? 0.8, true, 'alarm');
}

export async function playCommunicationSound() {
    try {
        const volume = getGame().settings.get(MODULE_ID, 'soundVolume');
        const randomNumber = Math.floor(Math.random() * 5) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/pec_message/Save_Sound_Communications_${randomNumber}.wav`;

        return playSoundWithHelper(soundPath, volume, false, 'communication');
    } catch (error) {
        console.error('MUTHUR Audio | Error during communication sound playback:', error);
    }
}

export function playCommunicationSoundThrottled(minIntervalMs: number = 200): void {
    const now = Date.now();
    if (now - lastComSoundTime >= minIntervalMs) {
        void playCommunicationSound();
        lastComSoundTime = now;
    }
}

export function playTypeSound() {
    if (!getGame().settings.get(MODULE_ID, 'enableTypingSounds')) return;

    try {
        const volume = getGame().settings.get(MODULE_ID, 'soundVolume');
        const randomNumber = Math.floor(Math.random() * 8) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/type/Key_Press_${randomNumber}.wav`;

        void playSoundWithHelper(soundPath, volume, false, 'typing');
    } catch (error) {
        console.error('MUTHUR Audio | Error during typing sound playback:', error);
    }
}

export async function playReplySound(): Promise<void> {
    try {
        if (currentReplySound) {
            void currentReplySound.stop();
            currentReplySound = null;
        }

        const volume = getGame().settings.get(MODULE_ID, 'soundVolume');
        const randomNumber = Math.floor(Math.random() * 9) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/reply/Computer_Reply_${randomNumber}.wav`;

        const replySound = await playSoundWithHelper(soundPath, volume, false, 'reply');
        if (replySound) {
            currentReplySound = replySound;
        }
        setTimeout(() => {
            if (shouldContinueReplySound) {
                void playReplySound();
            }
        }, 900);
    } catch (error) {
        console.error('MUTHUR Audio | Error during reply sound playback:', error);
        currentReplySound = null;
    }
}

export function playErrorSound() {
    try {
        const volume = getGame().settings.get(MODULE_ID, 'soundVolume');
        const soundPath = `/modules/alien-mu-th-ur/sounds/pec_message/error.wav`;

        return playSoundWithHelper(soundPath, volume, false, 'error');
    } catch (error) {
        console.error('MUTHUR Audio | Error during error sound playback:', error);
    }
}

export function stopReplySound(): void {
    shouldContinueReplySound = false;
    if (currentReplySound) {
        console.debug('MUTHUR Audio | stopReplySound invoked');
        void currentReplySound.stop();
        currentReplySound = null;
    }
}
