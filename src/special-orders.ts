import { getGame } from './constants.js';
import { getHackStatus } from './hacking.js';
import { displayMuthurMessage, syncCommandResult, syncMessageToSpectators } from './ui/ui-utils.js';

let cerberusCountdownInterval: ReturnType<typeof setInterval> | null = null;
let cerberusGlobalInterval: ReturnType<typeof setInterval> | null = null;

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

    const update = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        if (timer) timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (remaining <= 0) {
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
                return;
            }

            if (getHackStatus()) {
                getGame().socket?.emit('module.alien-mu-th-ur', {
                    type: 'muthurCommand',
                    command:
                        getGame().i18n?.format('MOTHER.CerberusHackAlert', {
                            userName: getGame().user?.name || 'unknown',
                        }) || `!!! PRIORITY ALERT !!! - ${getGame().user?.name} HAS INITIATED CERBERUS PROTOCOL`,
                    user: 'MUTHUR 6000',
                    userId: getGame().user?.id,
                    timestamp: Date.now(),
                });
            }

            await syncMessageToSpectators(
                chatLog,
                getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.confirmation') ||
                    "!!! WARNING !!!\n\nYOU ARE ABOUT TO ACTIVATE THE CERBERUS PROTOCOL\nTHIS ACTION WILL TRIGGER THE STATION'S SELF-DESTRUCT\nNO RETURN WILL BE POSSIBLE\n\nCONFIRM ACTIVATION?",
                '',
                '#ff0000',
                'error',
            );
            syncCommandResult('SPECIAL_ORDER', {
                text:
                    getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.confirmation') ||
                    "!!! WARNING !!!\n\nYOU ARE ABOUT TO ACTIVATE THE CERBERUS PROTOCOL\nTHIS ACTION WILL TRIGGER THE STATION'S SELF-DESTRUCT\nNO RETURN WILL BE POSSIBLE\n\nCONFIRM ACTIVATION?",
                color: '#ff0000',
                type: 'error',
            });

            // Dialog logic would go here, for now I'm extracting the core handling.
            // In a real refactor, I might want to separate UI dialogs from logic.
        } else {
            const translationKey = orders[orderKey];
            const localized = getGame().i18n?.localize(translationKey) || `SPECIAL ORDER ${orderKey}`;
            await syncMessageToSpectators(chatLog, localized, '', '#00ff00', 'reply');
            syncCommandResult('SPECIAL_ORDER', {
                text: localized,
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
