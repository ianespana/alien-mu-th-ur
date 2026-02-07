import {
    getFailureSequences,
    getGame,
    getHackingSequences,
    getPostPasswordSequences,
    getSuccessSequences,
} from './constants.js';
import { applyGlitchEffect, createFullScreenGlitch, displayHackMessage, displayMuthurMessage } from './ui/ui-utils.js';

let hackSuccessful = false;
let stopHackingWindows: (() => void) | null = null;

export function getHackStatus(): boolean {
    return hackSuccessful;
}

export function setHackStatus(status: boolean): void {
    hackSuccessful = status;
}

export function clearHackingElements(): void {
    const hackingWindows = document.querySelectorAll('.hacking-window, .terminal-window');
    hackingWindows.forEach((window) => window.remove());

    const hackingStyles = document.querySelectorAll('style[data-hacking]');
    hackingStyles.forEach((style) => style.remove());

    const overlays = document.querySelectorAll('.matrix-code, #muthur-glitch-overlay');
    overlays.forEach((overlay) => overlay.remove());

    if (stopHackingWindows) {
        stopHackingWindows();
        stopHackingWindows = null;
    }
}

export async function simulateHackingAttempt(chatLog: HTMLElement): Promise<boolean> {
    console.debug('MUTHUR | simulateHackingAttempt triggered');

    if (hackSuccessful) {
        await displayMuthurMessage(
            chatLog,
            getGame().i18n?.localize('MOTHER.HackAlreadySuccessful') ||
                'ADMINISTRATOR ACCESS ALREADY OBTAINED - NEW HACK ATTEMPT NOT AUTHORIZED',
            '',
            '#ff0000',
            'error',
        );
        return true;
    }

    const container = document.getElementById('muthur-chat-container');
    if (container) container.classList.add('hacking-active');

    // Notify spectators
    if (getGame().socket) {
        getGame().socket.emit('module.alien-mu-th-ur', { type: 'hackingAttempt' });
    }

    const glitchOverlay = createFullScreenGlitch();
    stopHackingWindows = createHackingWindows();

    // Hacking logic...
    // To keep it readable and since I'm splitting files,
    // I'll implement the main logic here but refer to sequences from constants.

    const sequences = getHackingSequences();
    const postPasswordSequences = getPostPasswordSequences();

    for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i];
        await displayHackMessage(chatLog, seq, '#00ff00', 'reply');
        await new Promise((r) => setTimeout(r, 500));
        if (getGame().socket) getGame().socket.emit('module.alien-mu-th-ur', { type: 'hackStream', text: seq });
        if (getGame().socket)
            getGame().socket.emit('module.alien-mu-th-ur', {
                type: 'hackProgress',
                stage: 'initial',
                progress: Math.round(((i + 1) / sequences.length) * 100),
            });
    }

    // [Simulated passwords attempt]
    for (let i = 0; i < 5; i++) {
        const pass = 'TRYING: ' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await displayHackMessage(chatLog, pass, '#00ff00', 'reply', true);
        if (getGame().socket)
            getGame().socket.emit('module.alien-mu-th-ur', {
                type: 'hackStream',
                text: pass,
                isPassword: true,
            });
        await new Promise((r) => setTimeout(r, 100));
        if (Math.random() > 0.8) {
            await applyGlitchEffect();
            getGame().socket?.emit('module.alien-mu-th-ur', { type: 'hackGlitch' });
        }
    }

    for (let i = 0; i < postPasswordSequences.length; i++) {
        const seq = postPasswordSequences[i];
        await displayHackMessage(chatLog, seq, '#00ff00', 'reply');
        if (getGame().socket) getGame().socket.emit('module.alien-mu-th-ur', { type: 'hackStream', text: seq });
        await new Promise((r) => setTimeout(r, 600));
        if (getGame().socket)
            getGame().socket.emit('module.alien-mu-th-ur', {
                type: 'hackProgress',
                stage: 'post',
                progress: Math.round(((i + 1) / postPasswordSequences.length) * 100),
            });
    }

    let isSuccess: boolean; // 70% success rate
    if (!getGame().user?.isGM) {
        isSuccess = await requestHackDecision();
    } else {
        const roll = new Roll('1d6');
        await roll.evaluate();
        isSuccess = (roll.total ?? 0) % 2 === 0;
    }
    const resultSequences = isSuccess ? getSuccessSequences() : getFailureSequences();

    for (const step of resultSequences) {
        if (step.text.includes('AdminPrivileges') || step.text.includes('TerminalLocked')) {
            if (glitchOverlay) glitchOverlay.remove();
            if (container) container.classList.remove('hacking-active');
            if (getGame().socket) getGame().socket.emit('module.alien-mu-th-ur', { type: 'hackStopGlitch' });
        }
        await displayHackMessage(chatLog, step.text, step.color, step.type);
        if (getGame().socket)
            getGame().socket.emit('module.alien-mu-th-ur', {
                type: 'hackStream',
                text: step.text,
                color: step.color,
                msgType: step.type,
            });
        await new Promise((r) => setTimeout(r, 800));
    }

    hackSuccessful = isSuccess;
    if (isSuccess) {
        chatLog.innerHTML = '';
        chatLog.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        await displayMuthurMessage(
            chatLog,
            getGame().i18n?.localize('MOTHER.WelcomeAdmin') || 'WELCOME ADMINISTRATOR',
            '',
            '#00ff00',
            'reply',
        );
    }

    clearHackingElements();
    if (getGame().socket)
        getGame().socket.emit('module.alien-mu-th-ur', {
            type: 'hackComplete',
            success: isSuccess,
            fromId: getGame().user?.id,
        });

    return isSuccess;
}

async function requestHackDecision(): Promise<boolean> {
    const socket = getGame().socket;
    const user = getGame().user;
    if (!socket || !user) return Math.random() > 0.3;

    return new Promise<boolean>((resolve) => {
        const handler = (data: unknown) => {
            const payload = data as { type?: string; targetUserId?: string; success?: boolean };
            if (payload.type === 'hackDecision' && payload.targetUserId === user.id) {
                socket.off('module.alien-mu-th-ur', handler);
                resolve(!!payload.success);
            }
        };
        socket.on('module.alien-mu-th-ur', handler);
        socket.emit('module.alien-mu-th-ur', {
            type: 'hackDecisionRequest',
            fromId: user.id,
            fromName: user.name,
        });
    });
}

export function createHackingWindows(): () => void {
    const style = document.createElement('style');
    style.setAttribute('data-hacking', 'true');
    style.textContent = `
        @keyframes glowPulse {
            0% { box-shadow: 0 0 10px #00ff00, inset 0 0 5px #00ff00; }
            50% { box-shadow: 0 0 20px #00ff00, inset 0 0 15px #00ff00; }
            100% { box-shadow: 0 0 10px #00ff00, inset 0 0 5px #00ff00; }
        }
        @keyframes glowPulseRed {
            0% { box-shadow: 0 0 10px #ff0000, inset 0 0 5px #ff0000; }
            50% { box-shadow: 0 0 20px #ff0000, inset 0 0 15px #ff0000; }
            100% { box-shadow: 0 0 10px #ff0000, inset 0 0 5px #ff0000; }
        }
        .terminal-window {
            position: fixed;
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff00;
            color: #00ff00;
            font-family: monospace;
            padding: 10px;
            z-index: 1000;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    const windows: HTMLElement[] = [];
    const interval = setInterval(() => {
        if (windows.length > 10) {
            const first = windows.shift();
            if (first) first.remove();
        }
        const win = document.createElement('div');
        win.className = 'terminal-window';
        win.style.top = Math.random() * 80 + '%';
        win.style.left = Math.random() * 80 + '%';
        win.textContent = 'ACCESSING DATA... ' + Math.random().toString(16);
        document.body.appendChild(win);
        windows.push(win);
    }, 500);

    return () => {
        clearInterval(interval);
        windows.forEach((w) => w.remove());
        style.remove();
    };
}
