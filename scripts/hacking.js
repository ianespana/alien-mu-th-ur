import {
    getFailureSequences,
    getHackingSequences,
    getPostPasswordSequences,
    getSuccessSequences,
} from './constants.js';
import { applyGlitchEffect, createFullScreenGlitch, displayHackMessage, displayMuthurMessage } from './ui-utils.js';

let hackSuccessful = false;
let stopHackingWindows = null;

export function getHackStatus() {
    return hackSuccessful;
}

export function setHackStatus(status) {
    hackSuccessful = status;
}

export function clearHackingElements() {
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

export async function simulateHackingAttempt(chatLog) {
    console.debug('MUTHUR | simulateHackingAttempt triggered');

    if (hackSuccessful) {
        await displayMuthurMessage(chatLog, game.i18n.localize('MOTHER.HackAlreadySuccessful'), '', '#ff0000', 'error');
        return;
    }

    const container = document.getElementById('muthur-chat-container');
    if (container) container.classList.add('hacking-active');

    // Notify spectators
    if (game.socket) {
        game.socket.emit('module.alien-mu-th-ur', { type: 'hackingAttempt' });
    }

    const glitchOverlay = createFullScreenGlitch();
    stopHackingWindows = createHackingWindows();

    // Hacking logic...
    // To keep it readable and since I'm splitting files,
    // I'll implement the main logic here but refer to sequences from constants.

    const sequences = getHackingSequences();
    const postPasswordSequences = getPostPasswordSequences();

    for (const seq of sequences) {
        await displayHackMessage(chatLog, seq, '#00ff00', 'reply');
        await new Promise((r) => setTimeout(r, 500));
        if (game.socket) game.socket.emit('module.alien-mu-th-ur', { type: 'hackStream', text: seq });
    }

    // [Simulated passwords attempt]
    for (let i = 0; i < 5; i++) {
        const pass = 'TRYING: ' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await displayHackMessage(chatLog, pass, '#00ff00', 'reply', true);
        if (game.socket)
            game.socket.emit('module.alien-mu-th-ur', { type: 'hackStream', text: pass, isPassword: true });
        await new Promise((r) => setTimeout(r, 100));
        if (Math.random() > 0.8) await applyGlitchEffect();
    }

    for (const seq of postPasswordSequences) {
        await displayHackMessage(chatLog, seq, '#00ff00', 'reply');
        if (game.socket) game.socket.emit('module.alien-mu-th-ur', { type: 'hackStream', text: seq });
        await new Promise((r) => setTimeout(r, 600));
    }

    const isSuccess = Math.random() > 0.3; // 70% success rate
    const resultSequences = isSuccess ? getSuccessSequences() : getFailureSequences();

    for (const step of resultSequences) {
        if (step.text.includes('AdminPrivileges') || step.text.includes('TerminalLocked')) {
            if (glitchOverlay) glitchOverlay.remove();
            if (container) container.classList.remove('hacking-active');
            if (game.socket) game.socket.emit('module.alien-mu-th-ur', { type: 'hackStopGlitch' });
        }
        await displayHackMessage(chatLog, step.text, step.color, step.type);
        if (game.socket)
            game.socket.emit('module.alien-mu-th-ur', {
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
        await displayMuthurMessage(chatLog, game.i18n.localize('MOTHER.WelcomeAdmin'), '', '#00ff00', 'reply');
    }

    clearHackingElements();
    if (game.socket)
        game.socket.emit('module.alien-mu-th-ur', { type: 'hackComplete', success: isSuccess, fromId: game.user.id });

    return isSuccess;
}

export function createHackingWindows() {
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

    const windows = [];
    const interval = setInterval(() => {
        if (windows.length > 10) {
            windows.shift().remove();
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
