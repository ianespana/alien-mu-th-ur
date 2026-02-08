import { stopAlarm } from './actions.js';
import { handleCommand } from './commands.js';
import { getGame, MODULE_ID } from './constants.js';
import { getSession, updateSession } from './session.js';
import { displayMuthurMessage, showWaitingMessage, syncMessageToSpectators } from './ui/ui-utils.js';

export function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '255, 255, 255';
}

export function showMuthurInterface(): HTMLElement | undefined {
    const existingChat = document.getElementById('muthur-chat-container');
    if (existingChat) return existingChat;

    const currentMuthurSession = getSession();
    if (currentMuthurSession.active && currentMuthurSession.userId !== getGame().user?.id) {
        ui.notifications?.warn(
            getGame().i18n?.format('MUTHUR.sessionActiveWarning', {
                userName: currentMuthurSession.userName ?? '',
            }) || `A MUTHUR session is already active with ${currentMuthurSession.userName}`,
        );
        return;
    }

    if (!currentMuthurSession.active) {
        updateSession({
            active: true,
            userId: getGame().user?.id,
            userName: getGame().user?.name,
        });

        getGame().socket.emit('module.alien-mu-th-ur', {
            type: 'sessionStatus',
            active: true,
            userId: getGame().user?.id,
            userName: getGame().user?.name,
        });
    }

    const chatContainer = document.createElement('div');
    chatContainer.id = 'muthur-chat-container';

    const sidebar = document.getElementById('sidebar');
    const rightPosition = sidebar ? `${sidebar.offsetWidth + 20}px` : '320px';

    const allowPlayersDrag = getGame().settings.get(MODULE_ID, 'allowDragPlayers');

    chatContainer.style.cssText = `
        position: ${allowPlayersDrag ? 'absolute' : 'fixed'};
        bottom: 20px;
        right: ${rightPosition};
        width: 400px;
        height: 600px;
        background: black;
        border: 2px solid #00ff00;
        padding: 10px;
        font-family: monospace;
        z-index: 100000;
        display: flex;
        flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
    `;
    const title = document.createElement('div');
    title.textContent = 'MU/TH/UR 6000';
    title.style.cssText = 'color: #00ff00; font-weight: bold;';
    header.appendChild(title);

    if (getGame().user?.isGM) {
        const stopAlarmButton = document.createElement('button');
        stopAlarmButton.id = 'gm-muthur-stop-alarm-btn';
        stopAlarmButton.textContent = getGame().i18n?.localize('MUTHUR.stopAlarm') || 'STOP ALARM';
        stopAlarmButton.title = stopAlarmButton.textContent;
        stopAlarmButton.style.cssText = `
            display: none;
            background: black;
            border: 1px solid #ff0000;
            color: #ff0000;
            cursor: pointer;
            font-family: monospace;
            padding: 2px 8px;
            height: 24px;
        `;
        stopAlarmButton.addEventListener('click', () => {
            stopAlarm();
            getGame().socket?.emit('module.alien-mu-th-ur', { type: 'alarmControl', action: 'off' });
            stopAlarmButton.style.display = 'none';
        });
        header.appendChild(stopAlarmButton);
    }

    const chatLog = document.createElement('div');
    chatLog.className = 'muthur-chat-log';
    chatLog.style.cssText = `
        flex: 1;
        overflow-y: auto;
        margin-bottom: 10px;
        font-family: monospace;
        padding: 5px;
        background: rgba(0, 0, 0, 0.8);
    `;

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
        display: flex;
        gap: 5px;
        width: 100%;
        align-items: center;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = getGame().i18n?.localize('MUTHUR.inputPlaceholder') || 'Enter a command';
    input.style.cssText = `
        flex: 1;
        background: black;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 4px 6px;
        font-family: monospace;
        height: 24px;
    `;

    const sendButton = document.createElement('button');
    sendButton.className = 'muthur-enter-btn';
    sendButton.innerHTML = '<i class="fas fa-level-down-alt" style="transform: rotate(90deg);"></i>';
    sendButton.title = getGame().i18n?.localize('MUTHUR.send') || 'REPLY';
    sendButton.style.cssText = `
        background: black;
        border: 1px solid #00ff00;
        color: #00ff00;
        cursor: pointer;
        font-family: monospace;
        height: 24px;
        width: 32px;
    `;

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);
    chatContainer.appendChild(header);
    chatContainer.appendChild(chatLog);
    chatContainer.appendChild(inputContainer);

    document.body.appendChild(chatContainer);

    const executeCommand = () => {
        void handleCommand(input, chatLog);
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeCommand();
    });
    sendButton.addEventListener('click', executeCommand);

    void syncMessageToSpectators(
        chatLog,
        getGame().i18n?.localize('MUTHUR.welcome') ||
            'MUTHUR 6000 v2.1.0\nTERMINAL ACTIVE...\nINTERFACE 2037\nAWAITING COMMAND...',
        '',
        '#00ff00',
        'reply',
    );

    return chatContainer;
}

export function showSpectatorInterface(
    activeUserId: string,
    activeUserName: string,
    skipWelcomeMessage: boolean = false,
): HTMLElement | undefined {
    const existingSpectator = document.getElementById('muthur-spectator-container');
    if (existingSpectator) return existingSpectator;

    const container = document.createElement('div');
    container.id = 'muthur-spectator-container';

    const sidebar = document.getElementById('sidebar');
    const rightPosition = sidebar ? `${sidebar.offsetWidth + 20}px` : '320px';

    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: ${rightPosition};
        width: 400px;
        height: 600px;
        background: rgba(0, 20, 0, 0.9);
        border: 2px solid #00ff00;
        padding: 10px;
        font-family: monospace;
        z-index: 99999;
        display: flex;
        flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        color: #00ff00;
        border-bottom: 1px solid #00ff00;
        padding-bottom: 5px;
        margin-bottom: 10px;
        font-weight: bold;
    `;
    header.textContent = `MU/TH/UR 6000 - SPECTATING: ${activeUserName || 'Unknown'}`;
    container.appendChild(header);

    const spectatorLog = document.createElement('div');
    spectatorLog.className = 'muthur-spectator-log';
    spectatorLog.style.cssText = `
        flex: 1;
        overflow-y: auto;
        font-family: monospace;
        padding: 5px;
    `;
    container.appendChild(spectatorLog);

    document.body.appendChild(container);

    if (!skipWelcomeMessage) {
        void displayMuthurMessage(
            spectatorLog,
            getGame().i18n?.localize('MUTHUR.spectatorJoined') || 'A new spectator has joined the session',
            '',
            '#00ff00',
            'reply',
        );
    }

    return container;
}

export function toggleMuthurChat(): void {
    const chatContainer = document.getElementById('muthur-chat-container');
    const session = getSession();
    if (chatContainer) {
        if (session.userId === getGame().user?.id) {
            updateSession({ active: false, userId: null, userName: null });
            getGame().socket?.emit('module.alien-mu-th-ur', {
                type: 'sessionStatus',
                active: false,
                userId: null,
                userName: null,
            });
        }
        chatContainer.remove();
    } else {
        const user = getGame().user;
        if (!user) return;
        if (session.active && session.userId && session.userId !== user.id) {
            ui.notifications?.warn(
                getGame().i18n?.format('MUTHUR.sessionActiveWarning', {
                    userName: session.userName ?? '',
                }) || `A MUTHUR session is already active with ${session.userName ?? 'another user'}`,
            );
            return;
        }
        if (user.isGM) {
            showMuthurInterface();
            return;
        }

        showWaitingMessage();
        updateSession({ active: true, userId: user.id, userName: user.name });
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'requestSpectatorSelection',
            userId: user.id,
            userName: user.name,
        });
        ui.notifications?.info(getGame().i18n?.localize('MUTHUR.waitingForGM') || 'Waiting for GM authorization.');
    }
}

export function showGMSpectatorSelectionDialog(activeUserId: string, activeUserName: string): void {
    const dialog = document.createElement('div');
    dialog.id = 'muthur-spectator-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        background: black;
        border: 2px solid #ff9900;
        padding: 20px;
        font-family: monospace;
        z-index: 100001;
        color: #ff9900;
    `;

    const title = document.createElement('h2');
    title.textContent = getGame().i18n?.localize('MUTHUR.selectSpectators') || 'Select spectators';
    title.style.cssText = `margin-top: 0; text-align: center; color: #ff9900; font-family: monospace; font-size: 18px;`;
    dialog.appendChild(title);

    const description = document.createElement('p');
    description.textContent =
        getGame().i18n?.localize('MUTHUR.selectSpectatorsHint') || 'Choose the players who will view as spectators';
    description.style.cssText = `margin-bottom: 15px; color: #ff9900; font-family: monospace;`;
    dialog.appendChild(description);

    const playerList = document.createElement('div');
    playerList.style.cssText = `max-height: 200px; overflow-y: auto; margin-bottom: 15px; border: 1px solid #ff9900; padding: 10px;`;
    dialog.appendChild(playerList);

    const players: User[] | undefined = getGame().users?.filter(
        (user: User) => !user.isGM && user.id !== activeUserId && user.active,
    );

    players?.forEach((player: User) => {
        if (!player.id) {
            return;
        }

        const playerItem = document.createElement('div');
        playerItem.style.cssText = `display: flex; align-items: center; margin-bottom: 5px;`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `player-${player.id}`;
        checkbox.value = player.id;
        checkbox.style.cssText = `margin-right: 10px; cursor: pointer;`;
        const label = document.createElement('label');
        label.htmlFor = `player-${player.id}`;
        label.textContent = player.name;
        label.style.cssText = `cursor: pointer; color: #ff9900; font-family: monospace;`;
        playerItem.appendChild(checkbox);
        playerItem.appendChild(label);
        playerList.appendChild(playerItem);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `display: flex; justify-content: space-between; margin-top: 20px;`;

    const confirmButton = document.createElement('button');
    confirmButton.textContent = getGame().i18n?.localize('MUTHUR.confirmSpectators') || 'Confirm';
    confirmButton.style.cssText = `background: black; border: 1px solid #ff9900; color: #ff9900; padding: 5px 15px; cursor: pointer; font-family: monospace;`;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = getGame().i18n?.localize('MUTHUR.cancelSpectators') || 'Cancel';
    cancelButton.style.cssText = `background: black; border: 1px solid #ff9900; color: #ff9900; padding: 5px 15px; cursor: pointer; font-family: monospace;`;

    buttonsContainer.appendChild(confirmButton);
    buttonsContainer.appendChild(cancelButton);
    dialog.appendChild(buttonsContainer);

    document.body.appendChild(dialog);

    confirmButton.onclick = () => {
        const selectedIds = Array.from(dialog.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')).map(
            (cb) => cb.value,
        );
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'openSpectatorInterface',
            spectatorIds: selectedIds,
            activeUserId: activeUserId,
            activeUserName: activeUserName,
        });
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'continueBootSequence',
            targetUserId: activeUserId,
            activeUserId: activeUserId,
            activeUserName: activeUserName,
            spectatorIds: selectedIds,
        });
        dialog.remove();
    };

    cancelButton.onclick = () => {
        dialog.remove();
    };
}

export function appendDialogToGM(element: HTMLElement, position: string = 'bottom-right', margin: number = 10): void {
    if (!getGame().user?.isGM) return;
    element.style.position = 'fixed';
    if (position === 'bottom-right') {
        element.style.bottom = `${margin}px`;
        element.style.right = `${margin}px`;
    }
    document.body.appendChild(element);
}
