import { playAlarmSound, playSoundWithHelper } from './audio-utils.js';
import { getGame } from './constants.js';
import { appendDialogToGM } from './interfaces.js';
import { getSession } from './session.js';
import {
    displayMuthurMessage,
    lockPlayerInput,
    startReplyWait,
    syncCommandResult,
    syncMessageToSpectators,
} from './ui/ui-utils.js';

let cerberusCountdownInterval: ReturnType<typeof setInterval> | null = null;
let cerberusGlobalInterval: ReturnType<typeof setInterval> | null = null;
let cerberusAlarmSound: foundry.audio.Sound | null = null;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getSoundDurationMs = (sound: foundry.audio.Sound | undefined, fallbackMs: number): number => {
    if (!sound) return fallbackMs;
    const anySound = sound as unknown as {
        duration?: number | (() => number);
        _duration?: number;
        source?: { duration?: number };
    };
    let duration: number | undefined;
    if (typeof anySound.duration === 'function') {
        duration = anySound.duration();
    } else if (typeof anySound.duration === 'number') {
        duration = anySound.duration;
    } else if (typeof anySound._duration === 'number') {
        duration = anySound._duration;
    } else if (typeof anySound.source?.duration === 'number') {
        duration = anySound.source.duration;
    }
    if (!duration || !Number.isFinite(duration)) return fallbackMs;
    return duration > 1000 ? Math.round(duration) : Math.round(duration * 1000);
};

const createDeathScreen = (): HTMLElement => {
    const existing = document.getElementById('cerberus-death-screen');
    if (existing) return existing;

    const deathScreen = document.createElement('div');
    deathScreen.id = 'cerberus-death-screen';
    deathScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        animation: cerberus-fade-in 2s ease-in;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes cerberus-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes cerberus-explosion-pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cerberus-glitch-text {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(2px, -2px); }
            60% { transform: translate(-2px, -2px); }
            80% { transform: translate(2px, 2px); }
            100% { transform: translate(0); }
        }
        .cerberus-death-text {
            color: #ff0000;
            font-size: 120px;
            font-family: 'Arial Black', sans-serif;
            text-shadow: 0 0 20px #ff0000;
            animation: cerberus-explosion-pulse 2s infinite, cerberus-glitch-text 0.3s infinite;
            margin-bottom: 30px;
            text-align: center;
        }
        .cerberus-death-subtext {
            color: #ff3333;
            font-size: 36px;
            font-family: monospace;
            text-shadow: 0 0 10px #ff3333;
            opacity: 0.8;
            animation: cerberus-glitch-text 0.5s infinite;
            text-align: center;
        }
    `;

    const deathText = document.createElement('div');
    deathText.className = 'cerberus-death-text';
    deathText.textContent = getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.YouAreDead') || 'You are dead';

    const subText = document.createElement('div');
    subText.className = 'cerberus-death-subtext';
    subText.textContent =
        getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.MissionFailed') ||
        'Mission failed - Installation destroyed';

    deathScreen.appendChild(style);
    deathScreen.appendChild(deathText);
    deathScreen.appendChild(subText);
    document.body.appendChild(deathScreen);
    return deathScreen;
};

export function stopCerberusCountdown(): void {
    if (cerberusCountdownInterval) {
        clearInterval(cerberusCountdownInterval);
        cerberusCountdownInterval = null;
    }
}

export function stopCerberusGlobal(): void {
    if (cerberusGlobalInterval) {
        clearInterval(cerberusGlobalInterval);
        cerberusGlobalInterval = null;
    }
    const existing = document.getElementById('muthur-cerberus-window');
    if (existing) existing.remove();
    if (cerberusAlarmSound) {
        void cerberusAlarmSound.stop();
        cerberusAlarmSound = null;
    }
}

export function createCerberusWindow(): HTMLElement {
    const existing = document.getElementById('muthur-cerberus-window');
    if (existing) return existing;

    const windowEl = document.createElement('div');
    windowEl.id = 'muthur-cerberus-window';
    windowEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: black;
        border: 2px solid #ff0000;
        color: #ff0000;
        padding: 20px;
        z-index: 100000;
        font-family: monospace;
        text-align: center;
        min-width: 320px;
    `;
    const title = document.createElement('div');
    title.textContent = 'CERBERUS PROTOCOL';
    title.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
    const timer = document.createElement('div');
    timer.className = 'muthur-cerberus-timer';
    timer.style.cssText = 'font-size: 22px;';
    windowEl.appendChild(title);
    windowEl.appendChild(timer);
    document.body.appendChild(windowEl);
    return windowEl;
}

export function startCerberusCountdownGlobal(minutes: number, startTime: number = Date.now()): void {
    stopCerberusGlobal();
    const windowEl = createCerberusWindow();
    const timer = windowEl.querySelector('.muthur-cerberus-timer');
    const totalMs = Math.max(1, minutes) * 60 * 1000;
    let lastSecond: number | null = null;
    let introPlayed = false;
    let endPlayed = false;

    void playAlarmSound(0.8).then((sound) => {
        if (sound) cerberusAlarmSound = sound;
    });

    const update = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.ceil((remaining % 60000) / 1000);
        if (timer) timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (!introPlayed) {
            introPlayed = true;
            void playSoundWithHelper('/modules/alien-mu-th-ur/sounds/count/Cerberuslunch.mp3', 1, false, 'cerberus');
        }

        if (secs !== lastSecond) {
            if (secs <= 10 && secs > 0) {
                void playSoundWithHelper(`/modules/alien-mu-th-ur/sounds/count/${secs}.mp3`, 1, false, 'cerberus');
            }
            lastSecond = secs;
        }
        if (remaining <= 0) {
            if (!endPlayed) {
                endPlayed = true;
                void (async () => {
                    const wey = await playSoundWithHelper(
                        '/modules/alien-mu-th-ur/sounds/count/Weythanks.mp3',
                        1,
                        false,
                        'cerberus',
                    );
                    await wait(getSoundDurationMs(wey, 2000));
                    const bye = await playSoundWithHelper(
                        '/modules/alien-mu-th-ur/sounds/count/byebye.mp3',
                        1,
                        false,
                        'cerberus',
                    );
                    await wait(getSoundDurationMs(bye, 1500));
                    await playSoundWithHelper('/modules/alien-mu-th-ur/sounds/count/boom.mp3', 1, false, 'cerberus');
                    const deathScreen = createDeathScreen();
                    const deathMusic = await playSoundWithHelper(
                        '/modules/alien-mu-th-ur/sounds/count/musicmort.mp3',
                        1,
                        false,
                        'cerberus',
                    );
                    const musicDuration = getSoundDurationMs(deathMusic, 8000);
                    setTimeout(() => {
                        deathScreen.style.animation = 'cerberus-fade-out 1s ease-out';
                        const fadeStyle = document.createElement('style');
                        fadeStyle.textContent = `
                            @keyframes cerberus-fade-out {
                                from { opacity: 1; }
                                to { opacity: 0; }
                            }
                        `;
                        deathScreen.appendChild(fadeStyle);
                        setTimeout(() => {
                            deathScreen.remove();
                        }, 1000);
                    }, musicDuration);
                })();
            }
            stopCerberusGlobal();
        }
    };

    update();
    cerberusGlobalInterval = setInterval(update, 1000);
}

export function startCerberusCountdown(minutes: number, chatLog: HTMLElement): ReturnType<typeof setInterval> {
    stopCerberusCountdown();
    let totalSeconds = minutes * 60;

    cerberusCountdownInterval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds <= 0) {
            stopCerberusCountdown();
            if (chatLog) {
                void displayMuthurMessage(
                    chatLog,
                    getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.completed') ||
                        'Self-destruct sequence completed.',
                    '',
                    '#ff0000',
                    'error',
                );
            }
        }
    }, 1000);

    return cerberusCountdownInterval;
}

export function appendCerberusConfirmationControls(
    chatLog: HTMLElement,
    minutes: number,
    onConfirm: () => void,
    onCancel: () => void,
): void {
    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex; gap:8px; justify-content:center; margin:10px 0;';
    const yesBtn = document.createElement('button');
    yesBtn.textContent = getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.confirm') || 'CONFIRM';
    yesBtn.style.cssText = 'background:black; color:#ff3333; border:1px solid #ff3333; padding:4px 10px;';
    const noBtn = document.createElement('button');
    noBtn.textContent = getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.cancel') || 'CANCEL';
    noBtn.style.cssText = 'background:black; color:#33ff33; border:1px solid #33ff33; padding:4px 10px;';
    controls.appendChild(yesBtn);
    controls.appendChild(noBtn);
    chatLog.appendChild(controls);

    yesBtn.onclick = () => {
        controls.remove();
        onConfirm();
    };
    noBtn.onclick = () => {
        controls.remove();
        onCancel();
    };
}

export async function handleSpecialOrder(chatLog: HTMLElement, command: string): Promise<void> {
    const orders: Record<string, string> = {
        754: 'MOTHER.SpecialOrders.754',
        899: 'MOTHER.SpecialOrders.899',
        931: 'MOTHER.SpecialOrders.931',
        937: 'MOTHER.SpecialOrders.937',
        939: 'MOTHER.SpecialOrders.939',
        966: 'MOTHER.SpecialOrders.966',
        CERBERUS: 'MOTHER.SpecialOrders.Cerberus',
    };

    const orderKey = command
        .toUpperCase()
        .replace(/^ORDRE\s+SPECIAL\s+/i, '')
        .replace(/^ORDRE\s+SPÉCIAL\s+/i, '')
        .replace(/^ORDER\s+SPECIAL\s+/i, '')
        .replace(/^SPECIAL\s+ORDRE\s+/i, '')
        .replace(/^SPÉCIAL\s+ORDRE\s+/i, '')
        .replace(/^SPECIAL\s+ORDER\s+/i, '')
        .replace(/^ORDRE\s+/i, '')
        .replace(/^ORDER\s+/i, '')
        .replace(/^SPECIAL\s+/i, '')
        .replace(/^SPÉCIAL\s+/i, '')
        .replace(/^PROTOCOLE\s+/i, '')
        .replace(/^PROTOCOL\s+/i, '')
        .trim();

    if (orders[orderKey]) {
        if (orderKey === 'CERBERUS') {
            if (!getGame().user?.isGM) {
                getGame().socket?.emit('module.alien-mu-th-ur', {
                    type: 'cerberusApprovalRequest',
                    fromId: getGame().user?.id,
                    fromName: getGame().user?.name,
                });
                await displayMuthurMessage(
                    chatLog,
                    getGame().i18n?.localize('MUTHUR.waitingForMother') || 'WAITING FOR MOTHER',
                    '',
                    '#ff0000',
                    'communication',
                );
                lockPlayerInput();
                startReplyWait(chatLog);
                return;
            }

            const session = getSession();
            const activeUserId = session.userId;
            const activeUserName = session.userName ?? 'PLAYER';
            if (!activeUserId) {
                await displayMuthurMessage(chatLog, 'NO ACTIVE MUTHUR SESSION.', '', '#ff0000', 'error');
                return;
            }

            const wrap = document.createElement('div');
            wrap.style.cssText =
                'background:black; border:2px solid #ff9900; color:#ff9900; padding:10px; z-index:100005; font-family:monospace;';
            const title = document.createElement('div');
            title.textContent = `${activeUserName} -> CERBERUS ?`;
            title.style.cssText = 'margin-bottom:6px; font-weight:bold;';
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '60';
            input.value = '10';
            input.style.cssText = 'width: 60px; margin-right: 8px; background:black; color:#ff9900;';
            const ok = document.createElement('button');
            ok.textContent = 'CONFIRM';
            ok.style.cssText =
                'background:black; color:#00ff00; border:1px solid #00ff00; padding:4px 10px; margin-right:6px;';
            const ko = document.createElement('button');
            ko.textContent = 'CANCEL';
            ko.style.cssText = 'background:black; color:#ff0000; border:1px solid #ff0000; padding:4px 10px;';
            wrap.appendChild(title);
            wrap.appendChild(input);
            wrap.appendChild(ok);
            wrap.appendChild(ko);
            appendDialogToGM(wrap, 'bottom-right', 8);

            ok.onclick = () => {
                const minutes = Math.max(1, Math.min(60, parseInt(input.value, 10) || 10));
                const warningText =
                    getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.confirmation') ||
                    'CERBERUS PROTOCOL CONFIRMATION REQUIRED.';
                void displayMuthurMessage(chatLog, warningText, '', '#ff0000', 'error');

                appendCerberusConfirmationControls(
                    chatLog,
                    minutes,
                    () => {
                        void displayMuthurMessage(
                            chatLog,
                            getGame().i18n?.localize('MOTHER.CerberusConfirmed') || 'CERBERUS CONFIRMED.',
                            '',
                            '#ff0000',
                            'error',
                        );
                        createCerberusWindow();
                        startCerberusCountdown(minutes, chatLog);
                        startCerberusCountdownGlobal(minutes);
                        getGame().socket?.emit('module.alien-mu-th-ur', {
                            type: 'showCerberusGlobal',
                            fromId: getGame().user?.id,
                            fromName: getGame().user?.name,
                            minutes,
                            startTime: Date.now(),
                        });
                    },
                    () => {
                        void displayMuthurMessage(
                            chatLog,
                            getGame().i18n?.localize('MOTHER.CerberusCancelled') || 'CERBERUS CANCELLED.',
                            '',
                            '#00ff00',
                            'reply',
                        );
                    },
                );
                wrap.remove();
            };
            ko.onclick = () => {
                wrap.remove();
            };
            return;
        } else {
            const nameKey = `MOTHER.SpecialOrders.${orderKey}.name`;
            const descKey = `MOTHER.SpecialOrders.${orderKey}.description`;
            const nameText = getGame().i18n?.localize(nameKey) || `SPECIAL ORDER ${orderKey}`;
            const descText = getGame().i18n?.localize(descKey) || '';
            const text = descText && descText !== descKey ? `${nameText}\n${descText}` : nameText;
            await syncMessageToSpectators(chatLog, text, '', '#00ff00', 'reply');
            syncCommandResult('SPECIAL_ORDER', {
                text: text,
                color: '#00ff00',
                type: 'reply',
            });
        }
    } else {
        await displayMuthurMessage(
            chatLog,
            getGame().i18n?.localize('MOTHER.SpecialOrders.Unknown') || 'Special order not recognized.',
            '',
            '#ff0000',
            'error',
        );
    }
}
