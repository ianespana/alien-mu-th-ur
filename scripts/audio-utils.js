import { MODULE_ID } from './constants.js';

let currentReplySound = null;
let shouldContinueReplySound = false;
let lastComSoundTime = 0;

export function getAudioState() {
    return {
        currentReplySound,
        shouldContinueReplySound,
    };
}

export function setShouldContinueReplySound(value) {
    shouldContinueReplySound = value;
}

export async function playSoundWithHelper(soundPath, volume, loop = false, label = 'generic') {
    try {
        if (typeof AudioHelper !== 'undefined' && AudioHelper?.play) {
            return await AudioHelper.play({ src: soundPath, volume, autoplay: true, loop }, true);
        } else {
            const audio = new Audio(soundPath);
            audio.volume = volume;
            audio.loop = loop;
            return audio.play();
        }
    } catch (error) {
        console.error(`MUTHUR Audio | Error during ${label} sound playback:`, error);
    }
}

export async function playCommunicationSound() {
    try {
        const volume = game.settings.get(MODULE_ID, 'typingSoundVolume');
        const randomNumber = Math.floor(Math.random() * 5) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/pec_message/Save_Sound_Communications_${randomNumber}.wav`;

        return playSoundWithHelper(soundPath, volume, false, 'communication');
    } catch (error) {
        console.error('MUTHUR Audio | Error during communication sound playback:', error);
    }
}

export function playCommunicationSoundThrottled(minIntervalMs = 200) {
    const now = Date.now();
    if (now - lastComSoundTime >= minIntervalMs) {
        playCommunicationSound();
        lastComSoundTime = now;
    }
}

export function playTypeSound() {
    if (!game.settings.get(MODULE_ID, 'enableTypingSounds')) return;

    try {
        const volume = game.settings.get(MODULE_ID, 'typingSoundVolume');
        const randomNumber = Math.floor(Math.random() * 8) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/type/Key_Press_${randomNumber}.wav`;

        playSoundWithHelper(soundPath, volume, false, 'typing');
    } catch (error) {
        console.error('MUTHUR Audio | Error during typing sound playback:', error);
    }
}

export async function playReplySound() {
    try {
        if (currentReplySound) {
            currentReplySound.pause();
            currentReplySound.currentTime = 0;
        }

        const volume = game.settings.get(MODULE_ID, 'typingSoundVolume');
        const randomNumber = Math.floor(Math.random() * 9) + 1;
        const soundPath = `/modules/alien-mu-th-ur/sounds/reply/Computer_Reply_${randomNumber}.wav`;

        if (typeof AudioHelper !== 'undefined' && AudioHelper?.play) {
            await AudioHelper.play({ src: soundPath, volume, autoplay: true, loop: false }, true);
            setTimeout(async () => {
                if (shouldContinueReplySound) {
                    await playReplySound();
                }
            }, 900);
            return true;
        } else {
            currentReplySound = new Audio(soundPath);
            currentReplySound.volume = volume;
            currentReplySound.onended = async () => {
                if (shouldContinueReplySound) {
                    await playReplySound();
                }
            };
            currentReplySound.onerror = () => {
                currentReplySound = null;
            };
            return currentReplySound.play();
        }
    } catch (error) {
        console.error('MUTHUR Audio | Error during reply sound playback:', error);
        currentReplySound = null;
    }
}

export function playErrorSound() {
    try {
        const volume = game.settings.get(MODULE_ID, 'typingSoundVolume');
        const soundPath = `/modules/alien-mu-th-ur/sounds/pec_message/error.wav`;

        return playSoundWithHelper(soundPath, volume, false, 'error');
    } catch (error) {
        console.error('MUTHUR Audio | Error during error sound playback:', error);
    }
}

export function stopReplySound() {
    shouldContinueReplySound = false;
    if (currentReplySound) {
        console.debug('MUTHUR Audio | stopReplySound invoked');
        currentReplySound.pause();
        currentReplySound.currentTime = 0;
        currentReplySound = null;
    }
}
