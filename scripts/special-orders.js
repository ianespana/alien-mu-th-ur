import { getHackStatus } from './hacking.js';
import { displayMuthurMessage, syncCommandResult, syncMessageToSpectators } from './ui-utils.js';

let cerberusCountdownInterval = null;

export function stopCerberusCountdown() {
    if (cerberusCountdownInterval) {
        clearInterval(cerberusCountdownInterval);
        cerberusCountdownInterval = null;
    }
}

export function startCerberusCountdown(minutes, chatLog) {
    stopCerberusCountdown();
    let totalSeconds = minutes * 60;

    cerberusCountdownInterval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds <= 0) {
            stopCerberusCountdown();
            if (chatLog) {
                displayMuthurMessage(
                    chatLog,
                    game.i18n.localize('MOTHER.SpecialOrders.Cerberus.completed'),
                    '',
                    '#ff0000',
                    'error',
                );
            }
        }
    }, 1000);

    return cerberusCountdownInterval;
}

export async function handleSpecialOrder(chatLog, command) {
    const orders = {
        754: 'MOTHER.SpecialOrders.754',
        899: 'MOTHER.SpecialOrders.899',
        931: 'MOTHER.SpecialOrders.931',
        937: 'MOTHER.SpecialOrders.937',
        939: 'MOTHER.SpecialOrders.939',
        966: 'MOTHER.SpecialOrders.966',
        CERBERUS: 'MOTHER.SpecialOrders.Cerberus',
    };

    let orderKey = command
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
            if (!game.user.isGM) {
                game.socket.emit('module.alien-mu-th-ur', {
                    type: 'cerberusApprovalRequest',
                    fromId: game.user.id,
                    fromName: game.user.name,
                });
                await displayMuthurMessage(
                    chatLog,
                    game.i18n.localize('MUTHUR.waitingForMother'),
                    '',
                    '#ff0000',
                    'communication',
                );
                return;
            }

            if (getHackStatus()) {
                game.socket.emit('module.alien-mu-th-ur', {
                    type: 'muthurCommand',
                    command: game.i18n.format('MOTHER.CerberusHackAlert', { userName: game.user.name }),
                    user: 'MUTHUR 6000',
                    userId: game.user.id,
                    timestamp: Date.now(),
                });
            }

            await syncMessageToSpectators(
                chatLog,
                game.i18n.localize('MOTHER.SpecialOrders.Cerberus.confirmation'),
                '',
                '#ff0000',
                'error',
            );
            syncCommandResult('SPECIAL_ORDER', {
                text: game.i18n.localize('MOTHER.SpecialOrders.Cerberus.confirmation'),
                color: '#ff0000',
                type: 'error',
            });

            // Dialog logic would go here, for now I'm extracting the core handling.
            // In a real refactor, I might want to separate UI dialogs from logic.
        } else {
            const translationKey = orders[orderKey];
            await syncMessageToSpectators(chatLog, game.i18n.localize(translationKey), '', '#00ff00', 'reply');
            syncCommandResult('SPECIAL_ORDER', {
                text: game.i18n.localize(translationKey),
                color: '#00ff00',
                type: 'reply',
            });
        }
    } else {
        await displayMuthurMessage(chatLog, game.i18n.localize('MOTHER.SpecialOrders.Unknown'), '', '#ff0000', 'error');
    }
}
