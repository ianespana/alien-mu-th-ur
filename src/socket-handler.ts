import { releaseCryoForTokens, stopAlarm, triggerAlarm } from './actions.js';
import { getGame, MODULE_ID } from './constants.js';
import { clearHackingElements, createHackingWindows } from './hacking.js';
import {
    appendDialogToGM,
    showGMMuthurInterface,
    showGMSpectatorSelectionDialog,
    showSpectatorInterface,
} from './interfaces.js';
import { getPermissionsForUser, setLocalPermissions } from './permissions.js';
import { updateSession } from './session.js';
import {
    createCerberusWindow,
    startCerberusCountdown,
    startCerberusCountdownGlobal,
    stopCerberusCountdown,
    stopCerberusGlobal,
} from './special-orders.js';
import {
    applyGlitchEffect,
    createFullScreenGlitch,
    displayHackMessage,
    displayMuthurMessage,
    removeWaitingMessage,
    sendGMResponse,
    showBootSequence,
    stopReplyWait,
    unlockPlayerInput,
    updateSpectatorsWithMessage,
} from './ui/ui-utils.js';

type SocketPayload = Record<string, unknown> & { type: string };
type MessageSnapshot = { text: string; color?: string; messageType?: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const getString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const getStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const getBoolean = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined);

export function handleSocketMessage(raw: unknown): void {
    if (!isRecord(raw)) return;

    const type = getString(raw.type);
    if (!type) return;

    const game = getGame();
    const user = game.user;
    const userId = user?.id;
    const isGM = user?.isGM ?? false;

    if (type === 'muthurCommand' && isGM) {
        void handleMuthurResponse(raw as SocketPayload);
    } else if (type === 'muthurResponse' && !isGM) {
        void handleGMResponse(raw as SocketPayload);
    } else if (type === 'closePlayerInterface' && !isGM && getString(raw.targetUserId) === userId) {
        const chatContainer = document.getElementById('muthur-chat-container');
        if (chatContainer) {
            chatContainer.remove();
            updateSession({ active: false, userId: null, userName: null });
            unlockPlayerInput();
            ui.notifications?.info(
                getGame().i18n?.localize('MUTHUR.sessionClosedByGM') || 'GM has closed the MUTHUR session',
            );
        }
        const spectatorContainer = document.getElementById('muthur-spectator-container');
        if (spectatorContainer) spectatorContainer.remove();
    } else if (type === 'openSpectatorInterface' && !isGM) {
        const spectatorIds = getStringArray(raw.spectatorIds);
        if (userId && spectatorIds.includes(userId)) {
            const activeUserId = getString(raw.activeUserId) ?? '';
            const activeUserName = getString(raw.activeUserName) ?? '';
            showSpectatorInterface(activeUserId, activeUserName, true);
            game.socket?.emit('module.alien-mu-th-ur', {
                type: 'requestCurrentMessages',
                targetUserId: activeUserId,
                spectatorId: userId,
            });
        }
    } else if (type === 'updateSpectators' && !isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        const text = getString(raw.text);
        if (spectatorLog && text) {
            const prefix = getString(raw.prefix) ?? '';
            const color = getString(raw.color) ?? '#00ff00';
            const messageType = getString(raw.messageType) ?? 'normal';
            void displayMuthurMessage(spectatorLog as HTMLElement, text, prefix, color, messageType);
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (type === 'clearSpectatorChat' && !isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            spectatorLog.innerHTML = '';
        }
    } else if (type === 'requestCurrentMessages' && getString(raw.targetUserId) === userId) {
        const chatLog = document.querySelector('.muthur-chat-log');
        if (chatLog) {
            const messages = chatLog.querySelectorAll('.message');
            const messageData: MessageSnapshot[] = Array.from(messages)
                .map((msg) => {
                    const messageType =
                        Array.from(msg.classList).find((className) => className !== 'message') || 'normal';
                    return {
                        text: msg.textContent || '',
                        color: (msg as HTMLElement).style.color,
                        messageType,
                    };
                })
                .filter((msg) => msg.text.length > 0);
            game.socket?.emit('module.alien-mu-th-ur', {
                type: 'syncMessages',
                messages: messageData,
                targetSpectatorId: getString(raw.spectatorId),
            });
        }
    } else if (type === 'syncMessages' && getString(raw.targetSpectatorId) === userId) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        const messagesRaw = Array.isArray(raw.messages) ? raw.messages : [];
        if (spectatorLog) {
            spectatorLog.innerHTML = '';
            for (const msg of messagesRaw) {
                if (!isRecord(msg)) continue;
                const text = getString(msg.text);
                if (!text) continue;
                const color = getString(msg.color) ?? '#00ff00';
                const messageType = getString(msg.messageType) ?? 'normal';
                void displayMuthurMessage(spectatorLog as HTMLElement, text, '', color, messageType);
            }
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (type === 'requestSpectatorSelection' && isGM) {
        const activeUserId = getString(raw.userId);
        const activeUserName = getString(raw.userName);
        if (activeUserId && activeUserName) {
            showGMSpectatorSelectionDialog(activeUserId, activeUserName);
        }
    } else if (type === 'hackDecisionRequest' && isGM) {
        const requesterId = getString(raw.fromId);
        const requesterName = getString(raw.fromName) || 'PLAYER';
        if (!requesterId) return;

        const wrap = document.createElement('div');
        wrap.style.cssText =
            'background:black; border:2px solid #ff9900; color:#ff9900; padding:10px; z-index:100005; font-family:monospace;';
        const title = document.createElement('div');
        title.textContent = `${requesterName} → HACK ?`;
        title.style.cssText = 'margin-bottom:6px; font-weight:bold;';
        const ok = document.createElement('button');
        ok.textContent = 'SUCCESS';
        ok.style.cssText =
            'background:black; color:#00ff00; border:1px solid #00ff00; padding:4px 10px; margin-right:6px;';
        const ko = document.createElement('button');
        ko.textContent = 'FAILURE';
        ko.style.cssText = 'background:black; color:#ff0000; border:1px solid #ff0000; padding:4px 10px;';
        wrap.appendChild(title);
        wrap.appendChild(ok);
        wrap.appendChild(ko);
        appendDialogToGM(wrap, 'bottom-right', 8);
        const decide = (success: boolean) => {
            wrap.remove();
            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'hackDecision',
                targetUserId: requesterId,
                success,
            });
        };
        ok.onclick = () => decide(true);
        ko.onclick = () => decide(false);
    } else if (type === 'cerberusApprovalRequest' && isGM) {
        const requesterId = getString(raw.fromId);
        const requesterName = getString(raw.fromName) || 'PLAYER';
        if (!requesterId) return;

        const wrap = document.createElement('div');
        wrap.style.cssText =
            'background:black; border:2px solid #ff9900; color:#ff9900; padding:10px; z-index:100005; font-family:monospace;';
        const title = document.createElement('div');
        title.textContent = `${requesterName} → CERBERUS ?`;
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
            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'cerberusApproval',
                targetUserId: requesterId,
                approved: true,
                minutes,
            });
            wrap.remove();
        };
        ko.onclick = () => {
            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'cerberusApproval',
                targetUserId: requesterId,
                approved: false,
            });
            wrap.remove();
        };
    } else if (type === 'statusRequest' && isGM) {
        const requesterId = getString(raw.fromId);
        if (!requesterId) return;

        const statusOptions = [
            'normal',
            'anomalyDetected',
            'systemOffline',
            'degradedPerformance',
            'fireDetected',
            'quarantine',
            'lockdown',
            'intrusion',
            'networkIssue',
            'custom',
        ];

        const picker = document.createElement('div');
        picker.style.cssText = `
            background: black;
            border: 2px solid #ff9900;
            color: #ff9900;
            padding: 10px;
            font-family: monospace;
        `;

        const title = document.createElement('div');
        title.textContent = getGame().i18n?.localize('MUTHUR.STATUS.current') || 'System status';
        title.style.cssText = 'font-weight: bold; margin-bottom: 8px;';
        picker.appendChild(title);

        const select = document.createElement('select');
        select.style.cssText = 'width: 100%; margin-bottom: 8px; background: black; color: #ff9900;';
        statusOptions.forEach((key) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = getGame().i18n?.localize(`MUTHUR.STATUS.presets.${key}`) || key;
            select.appendChild(option);
        });
        picker.appendChild(select);

        const approve = document.createElement('button');
        approve.textContent = getGame().i18n?.localize('MUTHUR.confirmSpectators') || 'Confirm';
        approve.style.cssText =
            'background:black; border:1px solid #ff9900; color:#ff9900; padding:4px 10px; cursor:pointer;';
        approve.addEventListener('click', () => {
            const key = select.value;
            const presetKey = key === 'custom' ? null : `MUTHUR.STATUS.text.${key}`;
            const statusText =
                (presetKey && getGame().i18n?.localize(presetKey)) ||
                (key === 'custom'
                    ? getGame().settings.get(MODULE_ID, 'customStatusText') ||
                      getGame().i18n?.localize('MUTHUR.STATUS.text.normal') ||
                      ''
                    : getGame().i18n?.localize('MUTHUR.STATUS.text.normal') || '');

            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'statusResponse',
                targetUserId: requesterId,
                text: statusText,
                statusKey: key,
            });
            picker.remove();
        });
        picker.appendChild(approve);

        appendDialogToGM(picker, 'bottom-right', 8);
    } else if (type === 'cryoReleaseRequest' && isGM) {
        const requesterId = getString(raw.fromId);
        const requesterName = getString(raw.fromName) || 'PLAYER';
        const tokens = Array.from(canvas?.tokens?.placeables ?? []);

        const dialog = document.createElement('div');
        dialog.style.cssText =
            'background:black; border:2px solid #ff9900; color:#ff9900; padding:10px; z-index:100004; font-family:monospace; min-width:300px;';
        const title = document.createElement('div');
        title.textContent = `CRYO RELEASE${requesterName ? `: ${requesterName}` : ''}`;
        title.style.cssText = 'margin-bottom:6px; font-weight:bold;';
        dialog.appendChild(title);

        const list = document.createElement('div');
        list.style.maxHeight = '260px';
        list.style.overflow = 'auto';
        list.style.marginBottom = '8px';

        const selections = new Map<string, boolean>();
        tokens.forEach((t) => {
            const row = document.createElement('label');
            row.style.cssText = 'display:flex; align-items:center; gap:8px; margin:3px 0;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.onchange = () => {
                if (t.id) selections.set(t.id, cb.checked);
            };
            const name = document.createElement('span');
            name.textContent = t.name || '-';
            row.appendChild(cb);
            row.appendChild(name);
            list.appendChild(row);
        });

        dialog.appendChild(list);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex; gap:8px; justify-content:flex-end;';
        const confirm = document.createElement('button');
        confirm.textContent = 'OK';
        confirm.style.cssText = 'background:black; border:1px solid #00ff00; color:#00ff00; padding:2px 8px;';
        const cancel = document.createElement('button');
        cancel.textContent = 'X';
        cancel.style.cssText = 'background:black; border:1px solid #ff0000; color:#ff0000; padding:2px 8px;';

        confirm.onclick = async () => {
            const picked = tokens.filter((t) => t.id && selections.get(t.id));
            const released = await releaseCryoForTokens(picked.length ? picked : []);
            const label = picked.length
                ? picked
                      .map((t) => t.name || '')
                      .filter(Boolean)
                      .join(', ')
                : 'NONE';
            const msg = released > 0 ? `CRYO RELEASED: ${label}.` : 'NO CRYO TO RELEASE.';

            if (requesterId) {
                sendGMResponse(requesterId, msg, '#00ff00');
            } else {
                const gmChatLog = document.querySelector('.gm-chat-log');
                if (gmChatLog) {
                    await displayMuthurMessage(gmChatLog as HTMLElement, msg, '', '#00ff00', 'reply');
                }
            }

            dialog.remove();
        };
        cancel.onclick = () => dialog.remove();
        actions.appendChild(confirm);
        actions.appendChild(cancel);
        dialog.appendChild(actions);
        appendDialogToGM(dialog, 'bottom-right', 8);
    } else if (type === 'statusResponse' && !isGM && getString(raw.targetUserId) === userId) {
        const chatLog = document.querySelector('.muthur-chat-log');
        const text = getString(raw.text);
        if (!chatLog || !text) return;
        void displayMuthurMessage(chatLog as HTMLElement, text, '', '#00ff00', 'reply');
        stopReplyWait(chatLog as HTMLElement);
        unlockPlayerInput();
        const motherName = getGame().i18n?.localize('MUTHUR.motherName') || 'MUTHUR';
        updateSpectatorsWithMessage(text, `${motherName}: `, '#00ff00', 'reply');
    } else if (type === 'cerberusApproval' && getString(raw.targetUserId) === userId) {
        const approved = getBoolean(raw.approved) ?? false;
        const minutes = Math.max(1, Math.min(60, Number(raw.minutes) || 10));
        const chatLog = document.querySelector('.muthur-chat-log');
        if (chatLog) {
            stopReplyWait(chatLog as HTMLElement);
            unlockPlayerInput();
        }
        if (!approved) {
            if (chatLog) {
                void displayMuthurMessage(
                    chatLog as HTMLElement,
                    getGame().i18n?.localize('MUTHUR.requestDenied') || 'Request denied.',
                    '',
                    '#00ff00',
                    'reply',
                );
            }
            return;
        }
        if (!chatLog) return;
        const warningText =
            getGame().i18n?.localize('MOTHER.SpecialOrders.Cerberus.confirmation') ||
            'CERBERUS PROTOCOL CONFIRMATION REQUIRED.';
        void displayMuthurMessage(chatLog as HTMLElement, warningText, '', '#ff0000', 'error');
        updateSpectatorsWithMessage(
            warningText,
            `${getGame().i18n?.localize('MUTHUR.motherName') || 'MUTHUR'}: `,
            '#ff0000',
            'error',
        );

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
            void displayMuthurMessage(
                chatLog as HTMLElement,
                getGame().i18n?.localize('MOTHER.CerberusConfirmed') || 'CERBERUS CONFIRMED.',
                '',
                '#ff0000',
                'error',
            );
            createCerberusWindow();
            startCerberusCountdown(minutes, chatLog as HTMLElement);
            startCerberusCountdownGlobal(minutes);
            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'showCerberusGlobal',
                fromId: userId,
                fromName: user?.name,
                minutes,
                startTime: Date.now(),
            });
        };
        noBtn.onclick = () => {
            controls.remove();
            void displayMuthurMessage(
                chatLog as HTMLElement,
                getGame().i18n?.localize('MOTHER.CerberusCancelled') || 'CERBERUS CANCELLED.',
                '',
                '#00ff00',
                'reply',
            );
        };
    } else if (type === 'showCerberusGlobal') {
        const fromId = getString(raw.fromId);
        const minutes = Math.max(1, Math.min(60, Number(raw.minutes) || 10));
        const startTime = Number(raw.startTime) || Date.now();
        if (fromId !== userId) {
            createCerberusWindow();
            startCerberusCountdownGlobal(minutes, startTime);
        }
    } else if (type === 'stopCerberus') {
        stopCerberusCountdown();
        stopCerberusGlobal();
    } else if (type === 'permissionsUpdate' && getString(raw.targetUserId) === userId) {
        const perms = isRecord(raw.permissions) ? raw.permissions : null;
        if (!perms) return;
        setLocalPermissions(perms as never);
    } else if (type === 'closeMuthurChats') {
        document.querySelectorAll('#muthur-chat-container, #gm-muthur-container').forEach((chat) => {
            chat.remove();
        });
        updateSession({ active: false, userId: null, userName: null });
    } else if (type === 'continueBootSequence' && !isGM) {
        if (getString(raw.targetUserId) === userId) {
            removeWaitingMessage();
            void showBootSequence();
        } else {
            const spectatorIds = getStringArray(raw.spectatorIds);
            if (userId && spectatorIds.includes(userId)) {
                const activeUserId = getString(raw.targetUserId) ?? getString(raw.activeUserId) ?? '';
                const activeUserName = getString(raw.activeUserName) ?? '';
                void showBootSequence(true);
                showSpectatorInterface(activeUserId, activeUserName);
            }
        }
    } else if (type === 'sessionStatus') {
        const active = getBoolean(raw.active) ?? false;
        const activeUserId = getString(raw.userId) ?? null;
        const activeUserName = getString(raw.userName) ?? null;
        updateSession({ active, userId: activeUserId, userName: activeUserName });
        if (!active && !isGM) {
            const spectatorContainer = document.getElementById('muthur-spectator-container');
            if (spectatorContainer) spectatorContainer.remove();
        }
    } else if (type === 'hackingAttempt' && !isGM) {
        const container = document.getElementById('muthur-spectator-container');
        if (container) {
            container.classList.add('hacking-active');
            createFullScreenGlitch();
            window.stopHackingWindows = createHackingWindows();
        }
    } else if (type === 'hackStream' && !isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        const text = getString(raw.text);
        if (spectatorLog && text) {
            const color = getString(raw.color) ?? '#00ff00';
            const msgType = getString(raw.msgType) ?? 'reply';
            const isPassword = getBoolean(raw.isPassword) ?? false;
            void displayHackMessage(spectatorLog as HTMLElement, text, color, msgType, isPassword);
            spectatorLog.scrollTop = spectatorLog.scrollHeight;
        }
    } else if (type === 'hackGlitch' && !isGM) {
        void applyGlitchEffect();
    } else if (type === 'hackProgress' && !isGM) {
        // Reserved for progress UI, currently unused in TS port.
    } else if (type === 'alarmControl') {
        const action = getString(raw.action);
        if (action === 'on' && !isGM) {
            triggerAlarm();
        }
        if (action === 'off' && !isGM) {
            stopAlarm();
        }
        if (isGM) {
            const stopButton = document.getElementById('gm-muthur-stop-alarm-btn');
            if (stopButton) {
                stopButton.style.display = action === 'on' ? 'flex' : 'none';
            }
        }
    } else if (type === 'hackStopGlitch' && !isGM) {
        const container = document.getElementById('muthur-spectator-container');
        if (container) container.classList.remove('hacking-active');
        if (window.stopHackingWindows) {
            window.stopHackingWindows();
            window.stopHackingWindows = undefined;
        }
        const overlay = document.getElementById('muthur-glitch-overlay');
        if (overlay) overlay.remove();
    } else if (type === 'hackComplete' && !isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog) {
            (spectatorLog as HTMLElement).innerHTML = '';
            (spectatorLog as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        }
        clearHackingElements();
    } else if (type === 'commandResult' && !isGM) {
        const spectatorLog = document.querySelector('.muthur-spectator-log');
        if (spectatorLog && isRecord(raw.result)) {
            const text = getString(raw.result.text);
            if (!text) return;
            const color = getString(raw.result.color) ?? '#00ff00';
            const messageType = getString(raw.result.type) ?? 'reply';
            void displayMuthurMessage(spectatorLog as HTMLElement, text, '', color, messageType);
        }
    }
}

async function handleMuthurResponse(data: SocketPayload): Promise<void> {
    const command = getString(data.command);
    const user = getString(data.user);
    const userId = getString(data.userId);
    if (!command || !user || !userId) return;

    const gmContainer = showGMMuthurInterface(user, userId);
    const chatLog = gmContainer.querySelector('.gm-chat-log');
    if (!chatLog) return;

    const commandType = getString(data.commandType) ?? '';
    const actionType = getString(data.actionType) ?? '';
    const playerColor = '#00ff00';

    let rendered = `${user}: ${command}`;
    if (commandType === 'm') {
        const prefix = getGame().i18n?.localize('MUTHUR.motherPrefix') || '/M : ';
        rendered = `${user}: ${prefix}${command}`;
    } else if (commandType === 'unknown') {
        const unknownPrefix = getGame().i18n?.localize('MUTHUR.unknownCommandPrefix') || 'COMMAND NOT RECOGNIZED : ';
        rendered = `${user}: ${unknownPrefix}${command}`;
    }

    await displayMuthurMessage(chatLog as HTMLElement, rendered, '', playerColor, 'command');

    if (actionType === 'open') {
        const perms = getPermissionsForUser(userId);
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'permissionsUpdate',
            targetUserId: userId,
            permissions: perms,
        });
    }

    if (actionType === 'action' && getGame().user?.isGM) {
        const action = getString(data.commandType) ?? '';
        const target = command.substring(action.length).trim();

        let label = getGame().i18n?.localize(`MUTHUR.approve.${action}`) || `Approve ${action}?`;
        if (target) label = label.replace('{label}', target).replace('{target}', target);

        const wrap = document.createElement('div');
        wrap.style.cssText =
            'background:black; border:2px solid #ff9900; color:#ff9900; padding:10px; z-index:100005; font-family:monospace;';
        const title = document.createElement('div');
        title.textContent = label;
        title.style.cssText = 'margin-bottom:6px; font-weight:bold;';
        const ok = document.createElement('button');
        ok.textContent = getGame().i18n?.localize('MUTHUR.confirmSpectators') || 'Confirm';
        ok.style.cssText =
            'background:black; color:#00ff00; border:1px solid #00ff00; padding:4px 10px; margin-right:6px;';
        const ko = document.createElement('button');
        ko.textContent = getGame().i18n?.localize('MUTHUR.cancelSpectators') || 'Cancel';
        ko.style.cssText = 'background:black; color:#ff0000; border:1px solid #ff0000; padding:4px 10px;';
        wrap.appendChild(title);
        wrap.appendChild(ok);
        wrap.appendChild(ko);
        appendDialogToGM(wrap, 'bottom-right', 8);

        ok.onclick = async () => {
            wrap.remove();
            const { executeAction } = await import('./commands.js');
            await executeAction(action, target, chatLog as HTMLElement);
        };
        ko.onclick = async () => {
            wrap.remove();
            const { syncMessageToSpectators } = await import('./ui/ui-utils.js');
            await syncMessageToSpectators(
                chatLog as HTMLElement,
                getGame().i18n?.localize('MUTHUR.requestDenied') || 'Request denied.',
                '',
                '#ff0000',
                'error',
            );
        };
    }

    if (actionType === 'close') {
        await displayMuthurMessage(
            chatLog as HTMLElement,
            getGame().i18n?.localize('MUTHUR.muthurSessionEnded') || 'MUTHUR SESSION TERMINATED',
            '',
            '#ff9900',
            'reply',
        );
        setTimeout(() => gmContainer.remove(), 2000);
    }
}

async function handleGMResponse(data: SocketPayload): Promise<void> {
    const chatLog = document.querySelector('.muthur-chat-log');
    if (chatLog) {
        const message = getString(data.message);
        if (!message) return;
        const color = getString(data.color) ?? '#00ff00';
        const messageType = getString(data.messageType) ?? 'reply';
        await displayMuthurMessage(chatLog as HTMLElement, message, '', color, messageType);
        stopReplyWait(chatLog as HTMLElement);
        unlockPlayerInput();
        const motherName = getGame().i18n?.localize('MUTHUR.motherName') || 'MUTHUR';
        updateSpectatorsWithMessage(message, `${motherName}: `, color, messageType);
    }
}
