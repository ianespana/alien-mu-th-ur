import { clearHackingElements, createHackingWindows } from './hacking.js';
import { showGMSpectatorSelectionDialog, showSpectatorInterface } from './interfaces.js';
import { updateSession } from './session.js';
import {
    createFullScreenGlitch,
    displayHackMessage,
    displayMuthurMessage,
    removeWaitingMessage,
    showBootSequence,
} from './ui-utils.js';

export function handleSocketMessage(data) {
    if (data.type === 'muthurCommand' && game.user.isGM) {
        handleMuthurResponse(data);
    } else if (data.type === 'muthurResponse' && !game.user.isGM) {
        handleGMResponse(data);
    } else if (data.type === 'closePlayerInterface' && !game.user.isGM && data.targetUserId === game.user.id) {
        const chatContainer = document.getElementById('muthur-chat-container');
        if (chatContainer) {
            chatContainer.remove();
            updateSession({ active: false, userId: null, userName: null });
            ui.notifications.info(game.i18n.localize('MUTHUR.sessionClosedByGM'));
        }
        const spectatorContainer = document.getElementById('muthur-spectator-container');
        if (spectatorContainer) spectatorContainer.remove();
    } else if (data.type === 'openSpectatorInterface' && !game.user.isGM) {
        if (data.spectatorIds.includes(game.user.id)) {
            showSpectatorInterface(data.activeUserId, data.activeUserName, true);
            game.socket.emit('module.alien-mu-th-ur', {
                type: 'requestCurrentMessages',
                targetUserId: data.activeUserId,
                spectatorId: game.user.id,
            });
        }
    } else if (data.type === 'updateSpectators' && !game.user.isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            displayMuthurMessage(spectatorLog, data.text, data.prefix, data.color, data.messageType);
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (data.type === 'requestCurrentMessages' && data.targetUserId === game.user.id) {
        const chatLog = document.querySelector('.muthur-chat-log');
        if (chatLog) {
            const messages = chatLog.querySelectorAll('.message');
            const messageData = Array.from(messages).map((msg) => ({
                text: msg.textContent,
                color: msg.style.color,
                messageType: Array.from(msg.classList).find((c) => c !== 'message') || 'normal',
            }));
            game.socket.emit('module.alien-mu-th-ur', {
                type: 'syncMessages',
                messages: messageData,
                targetSpectatorId: data.spectatorId,
            });
        }
    } else if (data.type === 'syncMessages' && data.targetSpectatorId === game.user.id) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            spectatorLog.innerHTML = '';
            data.messages.forEach((msg) => {
                displayMuthurMessage(spectatorLog, msg.text, '', msg.color, msg.messageType);
            });
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (data.type === 'requestSpectatorSelection' && game.user.isGM) {
        showGMSpectatorSelectionDialog(data.userId, data.userName);
    } else if (data.type === 'continueBootSequence' && !game.user.isGM) {
        if (data.targetUserId === game.user.id) {
            removeWaitingMessage();
            showBootSequence();
        } else if (data.spectatorIds && data.spectatorIds.includes(game.user.id)) {
            showBootSequence(true);
            showSpectatorInterface(data.targetUserId || data.activeUserId, data.activeUserName || '');
        }
    } else if (data.type === 'sessionStatus' && !game.user.isGM) {
        updateSession({ active: data.active, userId: data.userId, userName: data.userName });
        if (!data.active) {
            const spectatorContainer = document.getElementById('muthur-spectator-container');
            if (spectatorContainer) spectatorContainer.remove();
        }
    } else if (data.type === 'hackingAttempt' && !game.user.isGM) {
        const container = document.getElementById('muthur-spectator-container');
        if (container) {
            container.classList.add('hacking-active');
            createFullScreenGlitch();
            window.stopHackingWindows = createHackingWindows();
        }
    } else if (data.type === 'hackStream' && !game.user.isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            displayHackMessage(
                spectatorLog,
                data.text,
                data.color || '#00ff00',
                data.msgType || 'reply',
                !!data.isPassword,
            );
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (data.type === 'hackStopGlitch' && !game.user.isGM) {
        const container = document.getElementById('muthur-spectator-container');
        if (container) container.classList.remove('hacking-active');
        if (window.stopHackingWindows) {
            window.stopHackingWindows();
            window.stopHackingWindows = null;
        }
        const overlay = document.getElementById('muthur-glitch-overlay');
        if (overlay) overlay.remove();
    } else if (data.type === 'hackComplete' && !game.user.isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            spectatorLog.innerHTML = '';
            spectatorLog.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        }
        clearHackingElements();
    } else if (data.type === 'commandResult' && !game.user.isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            displayMuthurMessage(
                spectatorLog,
                data.result.text,
                '',
                data.result.color || '#00ff00',
                data.result.type || 'reply',
            );
        }
    }
}

async function handleMuthurResponse(data) {
    const chatLog = document.querySelector('.muthur-chat-log');
    if (chatLog) {
        displayMuthurMessage(chatLog, data.command, `[${data.user}] > `, '#00ff00', 'command');

        // If it's an action that needs approval, we could show a dialog here for the GM
        if (data.actionType === 'action' && game.user.isGM) {
            const action = data.commandType;
            const target = data.command.substring(action.length).trim();

            let label = game.i18n.localize(`MUTHUR.approve.${action}`) || `Approve ${action}?`;
            if (target) label = label.replace('{label}', target).replace('{target}', target);

            new Dialog({
                title: 'MUTHUR Action Approval',
                content: `<p>${label}</p>`,
                buttons: {
                    approve: {
                        label: game.i18n.localize('MUTHUR.approve'),
                        callback: async () => {
                            // Import commands to execute the action
                            const { executeAction } = await import('./commands.js');
                            await executeAction(action, target, chatLog);
                        },
                    },
                    deny: {
                        label: game.i18n.localize('MUTHUR.deny'),
                        callback: async () => {
                            const { syncMessageToSpectators } = await import('./ui-utils.js');
                            await syncMessageToSpectators(
                                chatLog,
                                game.i18n.localize('MUTHUR.requestDenied'),
                                '',
                                '#ff0000',
                                'error',
                            );
                        },
                    },
                },
                default: 'approve',
            }).render(true);
        }
    }
}

async function handleGMResponse(data) {
    const chatLog = document.querySelector('.muthur-chat-log');
    if (chatLog) {
        displayMuthurMessage(chatLog, data.message, '', data.color || '#00ff00', data.messageType || 'reply');
    }
}
